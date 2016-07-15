// ==UserScript==
// @id             iitc-plugin-basemap-openstreetpam@jonatkins
// @name           IITC plugin: OpenStreetMap.org map tiles
// @category       Map Tiles
// @version        0.1.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Add the native OpenStreetMap.org map tiles as an optional layer.
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
window.plugin.mapTileOpenStreetMap = {
  addLayer: function() {
    // OpenStreetMap tiles - we shouldn't use these by default - https://wiki.openstreetmap.org/wiki/Tile_usage_policy
    // "Heavy use (e.g. distributing an app that uses tiles from openstreetmap.org) is forbidden without prior permission from the System Administrators"

    var osmOpt = {
      attribution: 'Map data © OpenStreetMap contributors',
      maxNativeZoom: 18,
      maxZoom: 21,
    };

    var layers = {
      'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png': 'OpenStreetMap',
      'http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png': 'Humanitarian',
    };

    for(var url in layers) {
      var layer = new L.TileLayer(url, osmOpt);
      layerChooser.addBaseLayer(layer, layers[url]);
    }
  },
};

var setup =  window.plugin.mapTileOpenStreetMap.addLayer;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
