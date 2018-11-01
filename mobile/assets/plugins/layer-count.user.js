// ==UserScript==
// @id             layer-count@fkloft
// @name           IITC plugin: layer count
// @category       Info
// @version        0.1.0.20181101.60209
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      none
// @downloadURL    none
// @description    [mobile-2018-11-01-060209] Allow users to count nested fields
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @include        https://*.ingress.com/mission/*
// @include        http://*.ingress.com/mission/*
// @match          https://*.ingress.com/mission/*
// @match          http://*.ingress.com/mission/*
// @grant          none
// ==/UserScript==


function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

//PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
//(leaving them in place might break the 'About IITC' page or break update checks)
plugin_info.buildName = 'mobile';
plugin_info.dateTimeVersion = '20181101.60209';
plugin_info.pluginId = 'layer-count';
//END PLUGIN AUTHORS NOTE



// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
plugin.layerCount = {}

plugin.layerCount.onBtnClick = function(ev) {
	var btn = plugin.layerCount.button,
		tooltip = plugin.layerCount.tooltip,
		layer = plugin.layerCount.layer;

	if(btn.classList.contains("active")) {
		if(window.plugin.drawTools !== undefined) {
			window.plugin.drawTools.drawnItems.eachLayer(function(layer) {
				if (layer instanceof L.GeodesicPolygon) {
					L.DomUtil.addClass(layer._path, "leaflet-clickable");
					layer._path.setAttribute("pointer-events", layer.options.pointerEventsBackup);
					layer.options.pointerEvents = layer.options.pointerEventsBackup;
					layer.options.clickable = true;
				}
			});
		}
		map.off("click", plugin.layerCount.calculate);
		btn.classList.remove("active");
	} else {
		console.log("inactive");
		if(window.plugin.drawTools !== undefined) {
			window.plugin.drawTools.drawnItems.eachLayer(function(layer) {
				if (layer instanceof L.GeodesicPolygon) {
					layer.options.pointerEventsBackup = layer.options.pointerEvents;
					layer.options.pointerEvents = null;
					layer.options.clickable = false;
					L.DomUtil.removeClass(layer._path, "leaflet-clickable");
					layer._path.setAttribute("pointer-events", "none");
				}
			});
		}
		map.on("click", plugin.layerCount.calculate);
		btn.classList.add("active");
		setTimeout(function(){
			tooltip.textContent = "Click on map";
		}, 10);
	}
};

plugin.layerCount.latLngE6ToGooglePoint = function(point) {
	return new google.maps.LatLng(point.latE6/1E6, point.lngE6/1E6);
}

/*
pnpoly Copyright (c) 1970-2003, Wm. Randolph Franklin

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:

  1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
     disclaimers.
  2. Redistributions in binary form must reproduce the above copyright notice in the documentation and/or other
     materials provided with the distribution.
  3. The name of W. Randolph Franklin may not be used to endorse or promote products derived from this Software without
     specific prior written permission.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
plugin.layerCount.pnpoly = function(latlngs, point) {
	var length = latlngs.length, c = false;

	for(var i = 0, j = length - 1; i < length; j = i++) {
		if(((latlngs[i].lat > point.lat) != (latlngs[j].lat > point.lat)) &&
		  (point.lng < latlngs[i].lng
		  + (latlngs[j].lng - latlngs[i].lng) * (point.lat - latlngs[i].lat)
		  / (latlngs[j].lat - latlngs[i].lat))) {
			c = !c;
		}
	}

	return c;
}

plugin.layerCount.calculate = function(ev) {
	var point = ev.latlng;
	var fields = window.fields;
	var layersRes = layersEnl = layersDrawn = 0;

	for(var guid in fields) {
		var field = fields[guid];

		// we don't need to check the field's bounds first. pnpoly is pretty simple math.
		// Checking the bounds is about 50 times slower than just using pnpoly
		if(plugin.layerCount.pnpoly(field._latlngs, point)) {
			if(field.options.team == TEAM_ENL)
				layersEnl++;
			else if(field.options.team == TEAM_RES)
				layersRes++;
		}
	}

	if (window.plugin.drawTools) {
		for(var layerId in window.plugin.drawTools.drawnItems._layers) {
			var field = window.plugin.drawTools.drawnItems._layers[layerId];
			if(field instanceof L.GeodesicPolygon && plugin.layerCount.pnpoly(field._latlngs, point)) 
				layersDrawn++;
		}
	}

	if(layersRes != 0 && layersEnl != 0)
		var content = "Res: " + layersRes + " + Enl: " + layersEnl + " = " + (layersRes + layersEnl) + " fields";
	else if(layersRes != 0)
		var content = "Res: " + layersRes + " field(s)";
	else if(layersEnl != 0)
		var content = "Enl: " + layersEnl + " field(s)";
	else
		var content = "No fields";

	if (layersDrawn != 0)
		content += "; draw: " + layersDrawn + " polygon(s)";

	plugin.layerCount.tooltip.innerHTML = content;

	return false;
};

var setup = function() {
	$('<style>').prop('type', 'text/css').html('.leaflet-control-layer-count a\n{\n	background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCI+Cgk8ZyBzdHlsZT0iZmlsbDojMDAwMDAwO2ZpbGwtb3BhY2l0eTowLjQ7c3Ryb2tlOm5vbmUiPgoJCTxwYXRoIGQ9Ik0gNiwyNCAyNCwyNCAxNSw2IHoiLz4KCQk8cGF0aCBkPSJNIDYsMjQgMjQsMjQgMTUsMTIgeiIvPgoJCTxwYXRoIGQ9Ik0gNiwyNCAyNCwyNCAxNSwxOCB6Ii8+Cgk8L2c+Cjwvc3ZnPgo=");\n}\n.leaflet-control-layer-count a.active\n{\n	background-color: #BBB;\n}\n.leaflet-control-layer-count-tooltip\n{\n	background-color: rgba(255, 255, 255, 0.6);\n	display: none;\n	height: 24px;\n	left: 30px;\n	line-height: 24px;\n	margin-left: 15px;\n	margin-top: -12px;\n	padding: 0 10px;\n	position: absolute;\n	top: 50%;\n	white-space: nowrap;\n	width: auto;\n}\n.leaflet-control-layer-count a.active .leaflet-control-layer-count-tooltip\n{\n	display: block;\n}\n.leaflet-control-layer-count-tooltip:before\n{\n	border-color: transparent rgba(255, 255, 255, 0.6);\n	border-style: solid;\n	border-width: 12px 12px 12px 0;\n	content: "";\n	display: block;\n	height: 0;\n	left: -12px;\n	position: absolute;\n	width: 0;\n}\n').appendTo('head');

	var parent = $(".leaflet-top.leaflet-left", window.map.getContainer());

	var button = document.createElement("a");
	button.className = "leaflet-bar-part";
	button.addEventListener("click", plugin.layerCount.onBtnClick, false);
	button.title = 'Count nested fields';

	var tooltip = document.createElement("div");
	tooltip.className = "leaflet-control-layer-count-tooltip";
	button.appendChild(tooltip);

	var container = document.createElement("div");
	container.className = "leaflet-control-layer-count leaflet-bar leaflet-control";
	container.appendChild(button);
	parent.append(container);

	plugin.layerCount.button = button;
	plugin.layerCount.tooltip = tooltip;
	plugin.layerCount.container = container;
}

// PLUGIN END //////////////////////////////////////////////////////////


setup.info = plugin_info; //add the script info data to the function as a property
if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);



