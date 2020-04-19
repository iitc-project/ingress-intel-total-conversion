// ==UserScript==
// @id             iitc-plugin-basemap-kartverket@sollie
// @name           IITC plugin: Kartverket.no map tiles
// @category       Map Tiles
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Add the color and grayscale map tiles from Kartverket.no as an optional layer.
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
  window.plugin.mapTileKartverketMap = {
  addLayer: function() {
    let kartverketOpt = {
      attribution  : 'Map data © Kartverket', // Map data from Kartverket (http://statkart.no/en/)
      maxNativeZoom: 18,
      maxZoom      : 21,
      subdomains   : [ 'opencache', 'opencache2', 'opencache3' ]
    };
    
    let layers = {
      'topo4'        : 'Norway Topo',
      'topo4graatone': 'Norway Topo Grayscale',
      'kartdata2'    : 'Norway Kartdata2',
      'toporaster3'  : 'Norway Toporaster3',
      'europa'       : 'Norway Europa',
    };
    
    for(let i in layers) {
      let layer = new L.TileLayer('https://{s}.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=' + i + '&zoom={z}&x={x}&y={y}', kartverketOpt);
      layerChooser.addBaseLayer(layer, 'Kartverket ' + layers[ i ]);
    }
  },
};

let setup = window.plugin.mapTileKartverketMap.addLayer;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@

