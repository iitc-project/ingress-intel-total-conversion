// ==UserScript==
// @id             iitc-plugin-nokia-ovi-maps
// @name           IITC plugin: Nokia OVI maps
// @category       Map Tiles
// @version        0.1.3.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Add various map layers from Nokia OVI Maps.
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

window.plugin.mapNokiaOvi = function() {};

window.plugin.mapNokiaOvi.setup = function() {
  //the list of styles you'd like to see
  let oviStyles = {
    'normal.day': { name: "Normal", request: 'base', type: 'png8' }, //Normal Street Map
    'normal.day.grey': { name: "Normal (grey)", request: 'base', type: 'png8' }, //Color-reduced Street Map
    'normal.day.transit': { name: "Normal (transit)", request: 'base', type: 'png8' }, //Color-reduced Transit Map
    'satellite.day': { name: "Satellite", request: 'aerial', type: 'png8' }, //Satellite Map
    'terrain.day': { name: "Terrain", request: 'aerial', type: 'png8' }, //Terrain Map
    'normal.night.grey': { name: "Normal Night (grey)", request: 'base', type: 'png8' },
    'hybrid.day': { name: "Hybrid", request: 'aerial', type: 'png8' } //Hybrid Map
  };
  
  let oviOpt = {attribution: 'Imagery © Here OVI', subdomains: '1234', maxNativeZoom: 20, maxZoom: 21};
  
  $.each(oviStyles, function(style,data) {
    //To get an app_id and an app_code register at https://developer.here.com/ and create your project.
    //Afterwards create your JavaScript/REST APP_ID and APP_CODE
    //demo IDs are available here: https://developer.here.com/api-explorer/rest/map-tile/map-tile-normal
    let id = 'devportal-demo-20180625';
    let code = '9v2BkviRwi9Ot26kp2IysQ';
    
    oviOpt['style'] = style;
    oviOpt['request'] = data.request;
    oviOpt['type'] = data.type;
    oviOpt['id'] = id;
    oviOpt['code'] = code;
    let oviMap = new L.TileLayer('https://{s}.{request}.maps.api.here.com/maptile/2.1/maptile/newest/{style}/{z}/{x}/{y}/256/{type}?app_id={id}&app_code={code}', oviOpt);
    layerChooser.addBaseLayer(oviMap, 'Here OVI '+data.name);
  });
  
};

let setup = window.plugin.mapNokiaOvi.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
