// ==UserScript==
// @id             layer-count@fkloft
// @name           IITC plugin: layer count
// @category       Info
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Allow users to count nested fields
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @include        https://www.ingress.com/mission/*
// @include        http://www.ingress.com/mission/*
// @match          https://www.ingress.com/mission/*
// @match          http://www.ingress.com/mission/*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
plugin.layerCount = {}

plugin.layerCount.onBtnClick = function(ev) {
	var btn = plugin.layerCount.button,
		tooltip = plugin.layerCount.tooltip,
		layer = plugin.layerCount.layer;

	if(btn.classList.contains("active")) {
		map.off("click", plugin.layerCount.calculate);
		btn.classList.remove("active");
	} else {
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
	var layersRes = layersEnl = 0;

	for(var guid in fields) {
		var field = fields[guid];

		// we don't need to check the field's bounds first. pnpoly is pretty simple math. the bounds is about 50 times
		// slower than just using pnpoly
		if(plugin.layerCount.pnpoly(field._latlngs, point)) {
			if(field.options.team == TEAM_ENL)
				layersEnl++;
			else if(field.options.team == TEAM_RES)
				layersRes++;
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

	plugin.layerCount.tooltip.innerHTML = content;

	return false;
};

var setup = function() {
	$('<style>').prop('type', 'text/css').html('@@INCLUDESTRING:plugins/layer-count.css@@').appendTo('head');

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

@@PLUGINEND@@

