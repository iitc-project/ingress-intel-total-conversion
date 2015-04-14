// ==UserScript==
// @id             iitc-plugin-basemap-kartverket@sollie
// @name           IITC plugin: Kartverket.no map tiles
// @category       Map Tiles
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Add the color and grayscale map tiles from Kartverket.no as an optional layer.
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
window.plugin.mapTileKartverketMap = function() {};

window.plugin.mapTileKartverketMap.addLayer = function() {

  // Map data from Kartverket (http://statkart.no/en/)
  kartverketAttribution = 'Map data © Kartverket';
  var kartverketOpt = {attribution: kartverketAttribution, maxNativeZoom: 18, maxZoom: 21, subdomains: ['opencache', 'opencache2', 'opencache3']};
  var kartverketTopo2 = new L.TileLayer('http://{s}.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=topo2&zoom={z}&x={x}&y={y}', kartverketOpt);
  var kartverketTopo2Grayscale = new L.TileLayer('http://{s}.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=topo2graatone&zoom={z}&x={x}&y={y}', kartverketOpt);

  layerChooser.addBaseLayer(kartverketTopo2, "Norway Topo");
  layerChooser.addBaseLayer(kartverketTopo2Grayscale, "Norway Topo Grayscale");
};

var setup =  window.plugin.mapTileKartverketMap.addLayer;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@

