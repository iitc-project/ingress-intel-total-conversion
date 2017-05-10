// ==UserScript==
// @id             iitc-plugin-basemap-tianditu@felixonmars
// @name           IITC plugin: Tianditu.com map tiles
// @category       Map Tiles
// @version        0.0.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      https://raw.githubusercontent.com/felixonmars/iitc-plugins/master/basemap-tianditu.user.js
// @downloadURL    https://raw.githubusercontent.com/felixonmars/iitc-plugins/master/basemap-tianditu.user.js
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Add the tianditu.com map tiles as an optional layer.
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
window.plugin.mapTileTianditu = {
  addLayer: function() {
    var tdtOpt = {
      subdomains: [0, 1, 2, 3, 4, 5, 6, 7],
      attribution: 'Map data © 国家地理信息公共服务平台“天地图”',
      maxNativeZoom: 18,
      maxZoom: 21,
    };

    var street = new L.LayerGroup();
    var satellite = new L.LayerGroup();

    var streetLayer = new L.TileLayer('http://t{s}.tianditu.com/DataServer?T=vec_w&x={x}&y={y}&l={z}', tdtOpt);
    var satelliteLayer = new L.TileLayer('http://t{s}.tianditu.com/DataServer?T=img_w&x={x}&y={y}&l={z}', tdtOpt);

    var streetOverlay = new L.TileLayer('http://t{s}.tianditu.com/DataServer?T=cva_w&x={x}&y={y}&l={z}', tdtOpt);
    var satelliteOverlay = new L.TileLayer('http://t{s}.tianditu.com/DataServer?T=cva_w&x={x}&y={y}&l={z}', tdtOpt);

    street.addLayer(streetLayer);
    street.addLayer(streetOverlay);
    
    satellite.addLayer(satelliteLayer);
    satellite.addLayer(satelliteOverlay);

    layerChooser.addBaseLayer(street, "Tianditu Street");
    layerChooser.addBaseLayer(satellite, "Tianditu Satellite");
  },
};

var setup =  window.plugin.mapTileTianditu.addLayer;

// PLUGIN END //////////////////////////////////////////////////////////


@@PLUGINEND@@