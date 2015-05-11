// ==UserScript==
// @id             iitc-plugin-basemap-mapquest-open-aerial@jonatkins
// @name           IITC plugin: MapQuest Open Satellite view (US Only)
// @category       Map Tiles
// @version        0.1.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Add the MapQuest Open Aerial satellite view tiles as a map layer. High detail in the US (lower 48) only.
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
window.plugin.mapTileMapQuestSat = function() {};

window.plugin.mapTileMapQuestSat.addLayer = function() {

  var mqSubdomains = [ 'otile1','otile2', 'otile3', 'otile4' ];
  var mqTileUrlPrefix = window.location.protocol !== 'https:' ? 'http://{s}.mqcdn.com' : 'https://{s}-s.mqcdn.com';
  //MapQuest satellite coverage outside of the US is rather limited - so not really worth having as we have google as an op!
  var mqSatOpt = {attribution: 'Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency', maxNativeZoom: 18, maxZoom: 21, subdomains: mqSubdomains};
  var mqSat = new L.TileLayer('http://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg',mqSatOpt);

  layerChooser.addBaseLayer(mqSat, "MapQuest Open Satellite");
};

var setup =  window.plugin.mapTileMapQuestSat.addLayer;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
