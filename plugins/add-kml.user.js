// ==UserScript==
// @id             overlay-kml@danielatkins
// @name           IITC plugin: overlay KML
// @category       Info
// @version        0.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Allows users to overlay their own KML / GPX files on top of IITC
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.overlayKML = function() {};

window.plugin.overlayKML.loadExternals = function() {
  try { console.log('Loading leaflet.filelayer JS now'); } catch(e) {}
  @@INCLUDERAW:external/leaflet.filelayer.js@@
  try { console.log('done loading leaflet.filelayer JS'); } catch(e) {}

  try { console.log('Loading KML JS now'); } catch(e) {}
  @@INCLUDERAW:external/KML.js@@
  try { console.log('done loading KML JS'); } catch(e) {}
	  
  try { console.log('Loading togeojson JS now'); } catch(e) {}
  @@INCLUDERAW:external/togeojson.js@@
  try { console.log('done loading togeojson JS'); } catch(e) {}

  window.plugin.overlayKML.load();
}
	
// window.plugin.overlayKML.setupCallback = function() {
//   $('#toolbox').append(' <a onclick="window.plugin.overlayKML.load()" title="Load KML to overlay on top of Ingress Intel Map">Overlay KML</a>');
// }

window.plugin.overlayKML.load = function() {
  // Provide popup window allow user to select KML to overlay
L.Control.FileLayerLoad.LABEL = 'O';
L.Control.fileLayerLoad({
	fitBounds: true,
	layerOptions: {
		pointToLayer: function (data, latlng) {
		return L.marker(latlng);
		}},
}).addTo(map);
}

var setup =  function() {
  window.plugin.overlayKML.loadExternals();
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@