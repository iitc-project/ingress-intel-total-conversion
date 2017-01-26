// ==UserScript==
// @id iitc-plugin-ingressmaxfield@stenyg
// @name IITC plugin: Ingress Maxfields
// @category Information
// @version 0.0.0.4
// @namespace https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL http://github.com/itayo/IITC-Ingress-Maxfields-Exporter/raw/master/IngressMaxFields.user.js
// @downloadURL http://github.com/itayo/IITC-Ingress-Maxfields-Exporter/raw/master/IngressMaxFields.user.js
// @description Exports portals in the format for http://www.ingress-maxfield.com/
// @include https://www.ingress.com/intel*
// @include http://www.ingress.com/intel*
// @match https://www.ingress.com/intel*
// @match http://www.ingress.com/intel*
// @grant none
// ==/UserScript==

function wrapper() {
	// in case IITC is not available yet, define the base plugin object
	if (typeof window.plugin !== "function") {
		window.plugin = function() {
		};
	}
	// base context for plugin

	window.plugin.ingressmaxfield = function() {
	};
	var self = window.plugin.ingressmaxfield;
	// custom dialog wrapper with more flexibility
	self.tooManyWait = function tooManyWait() {
		alert("Too many portals found, only listing 50");
	}
	self.sleep = function sleep(milliseconds) {
		var start = new Date().getTime();
		for (var i = 0; i < 1e7; i++) {
				if ((new Date().getTime() - start) > milliseconds){
				break;
			}
		}
	}

	self.portalInScreen = function portalInScreen( p ) {
		return map.getBounds().contains(p.getLatLng())
	}

	//  adapted from
	//+ Jonas Raoni Soares Silva
	//@ http://jsfromhell.com/math/is-point-in-poly [rev. #0]
	self.portalInPolygon = function portalInPolygon( polygon, portal ) {
		var poly = polygon.getLatLngs();
		var pt = portal.getLatLng();

		for(var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i) {
			((poly[i].lat <= pt.lat && pt.lat < poly[j].lat) || (poly[j].lat <= pt.lat && pt.lat < poly[i].lat))
				&& (pt.lng < (poly[j].lng - poly[i].lng) * (pt.lat - poly[i].lat) / (poly[j].lat - poly[i].lat) + poly[i].lng)
				&& (c = !c);
		}
		return c;
	}

	// return if the portal is within the drawtool objects.
	// Polygon and circles are available, and circles are implemented
	// as round polygons.
	self.portalInDrawnItems = function ( portal ) {
		var c = false;

		window.plugin.drawTools.drawnItems.eachLayer( function( layer ) {
			if ( self.portalInPolygon( layer, portal ) ) {
				c = true;
			}
		});
		return c;
	}

	self.gen = function gen() {
		var o = [];
		var antal = 0;
		var tooMany = 0;

		if ( window.plugin.drawTools && window.plugin.drawTools.drawnItems.getLayers().length ) {
			var inBounds = function( portal ) {
				return self.portalInDrawnItems( portal );
			}
			var string = "Portal selection based on drawTools boundaties.";
		} else {
			var inBounds = function( portal ) {
				return self.portalInScreen( portal );
			}
			var string = "Portal selection based on screen boundaries.";
		}

		for ( var x in window.portals) {
			var p = window.portals[x];
			if(antal < 50)
			{
				if (inBounds(p)) {
					antal = antal + 1;
					var href = 'https://www.ingress.com/intel?ll=' + p._latlng.lat
							+ ',' + p._latlng.lng + '&z=17&pll=' + p._latlng.lat
							+ ',' + p._latlng.lng;
					var str1 = p.options.data.title.replace(/\"/g, "\\\"");
					var str2 = str1.replace(',', ' ');
					o.push(str2 + "," + href);
				}
			}
			else
			{
				if (tooMany == 0 )
				{
					tooMany = 1;
				}
			}
		}

		var dialog = window
				.dialog(
						{
							title : "www.ingress-maxfield.com: CSV export",
							// body must be wrapped in an outer tag (e.g.
							// <div>content</div>)
							html: '<span>Save the data in a textfile or post it on ingress-maxfields.com. ' + string + '</span>'
									+ '<textarea id="imfCSVExport" rows="30" style="width: 100%;"></textarea>'
						}).parent();
		$(".ui-dialog-buttonpane", dialog).remove();
		dialog.css("width", "600px").css("top",
				($(window).height() - dialog.height()) / 2).css("left",
				($(window).width() - dialog.width()) / 2);
		$("#imfCSVExport").val(o.join("\n"));
		if ( tooMany == 1) {
			alert("Too many portals visible, only showing 50!");
		}
		return dialog;
	}
	// setup function called by IITC
	self.setup = function init() {
		// add controls to toolbox
		var link = $("<a onclick=\"window.plugin.ingressmaxfield.gen();\" title=\"Generate a CSV list of portals and locations for use with www.ingress-maxfield.com.\">IMF Export</a>");
		$("#toolbox").append(link);
		// delete self to ensure init can't be run again
		delete self.init;
	}
	// IITC plugin setup
	if (window.iitcLoaded && typeof self.setup === "function") {
		self.setup();
	} else if (window.bootPlugins) {
		window.bootPlugins.push(self.setup);
	} else {
		window.bootPlugins = [ self.setup ];
	}
}
// inject plugin into page
var script = document.createElement("script");
script.appendChild(document.createTextNode("(" + wrapper + ")();"));
(document.body || document.head || document.documentElement)
		.appendChild(script);
