// ==UserScript==
// @id             iitc-plugin-basemap-opencyclepam@jonatkins
// @name           IITC plugin: OpenCycleMap.org map tiles
// @category       Map Tiles
// @version        0.2.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Add the OpenCycleMap.org map tiles as an optional layer.
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

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.mapTileOpenCycleMap = {
  addLayer: function() {
    //the Thunderforest (OpenCycleMap) tiles are free to use - http://www.thunderforest.com/terms/

    var ocmOpt = {
      attribution: 'Tiles © OpenCycleMap, Map data © OpenStreetMap',
      maxNativeZoom: 18,
      maxZoom: 21,
    };

    var layers = {
      'cycle': 'OpenCycleMap',
      'transport': 'Transport',
      'transport-dark': 'Transport Dark',
      'outdoors': 'Outdoors',
      'landscape': 'Landscape',
    };

    for(var i in layers) {
      var layer = new L.TileLayer('http://{s}.tile.thunderforest.com/' + i + '/{z}/{x}/{y}.png', ocmOpt);
      layerChooser.addBaseLayer(layer, 'Thunderforest ' + layers[i]);
    }
  },
};

var setup =  window.plugin.mapTileOpenCycleMap.addLayer;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
