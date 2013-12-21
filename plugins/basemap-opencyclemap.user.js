// ==UserScript==
// @id             iitc-plugin-basemap-opencyclepam@jonatkins
// @name           IITC plugin: OpenCycleMap.org map tiles
// @category       Map Tiles
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Add the OpenCycleMap.org map tiles as an optional layer.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.mapTileOpenCycleMap = function() {};

window.plugin.mapTileOpenCycleMap.addLayer = function() {

  //the Thunderforest (OpenCycleMap) tiles are free to use - http://www.thunderforest.com/terms/

  osmAttribution = 'Map data © OpenStreetMap';
  var ocmOpt = {attribution: 'Tiles © OpenCycleMap, '+osmAttribution, maxZoom: 18};
  var ocmCycle = new L.TileLayer('http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png', ocmOpt);
  var ocmTransport = new L.TileLayer('http://{s}.tile2.opencyclemap.org/transport/{z}/{x}/{y}.png', ocmOpt);
  var ocmLandscape = new L.TileLayer('http://{s}.tile3.opencyclemap.org/landscape/{z}/{x}/{y}.png', ocmOpt);

  layerChooser.addBaseLayer(ocmCycle, "Thunderforest OpenCycleMap");
  layerChooser.addBaseLayer(ocmTransport, "Thunderforest Transport");
  layerChooser.addBaseLayer(ocmLandscape, "Thunderforest Landscape");
};

var setup =  window.plugin.mapTileOpenCycleMap.addLayer;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
