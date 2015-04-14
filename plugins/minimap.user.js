// ==UserScript==
// @id             iitc-plugin-minimap@breunigs
// @name           IITC plugin: Mini map
// @category       Controls
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Show a mini map on the corner of the map.
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
window.plugin.miniMap = function() {};

window.plugin.miniMap.setup  = function() {

  try { console.log('Loading leaflet.draw JS now'); } catch(e) {}
  @@INCLUDERAW:external/Control.MiniMap.js@@
  try { console.log('done loading leaflet.draw JS'); } catch(e) {}

  // we can't use the same TileLayer as the main map uses - it causes issues.
  // stick with the MapQuest tiles for now

  //OpenStreetMap attribution - required by several of the layers
  osmAttribution = 'Map data © OpenStreetMap contributors';

  //MapQuest offer tiles - http://developer.mapquest.com/web/products/open/map
  //their usage policy has no limits (except required notification above 4000 tiles/sec - we're perhaps at 50 tiles/sec based on CloudMade stats)
  var mqSubdomains = [ 'otile1','otile2', 'otile3', 'otile4' ];
  var mqTileUrlPrefix = window.location.protocol !== 'https:' ? 'http://{s}.mqcdn.com' : 'https://{s}-s.mqcdn.com';
  var mqMapOpt = {attribution: osmAttribution+', Tiles Courtesy of MapQuest', maxZoom: 18, subdomains: mqSubdomains};
  var mqMap = new L.TileLayer(mqTileUrlPrefix+'/tiles/1.0.0/map/{z}/{x}/{y}.jpg',mqMapOpt);

  setTimeout(function() {
    if(!isSmartphone()) {
      // desktop mode - bottom-left, so it doesn't clash with the sidebar
      new L.Control.MiniMap(mqMap, {toggleDisplay: true, position: 'bottomleft'}).addTo(window.map);
    } else {
      // mobile mode - bottom-right - so it floats above the map copyright text
      new L.Control.MiniMap(mqMap, {toggleDisplay: true, position: 'bottomright'}).addTo(window.map);
    }
  }, 0);

  $('head').append('<style>@@INCLUDESTRING:external/Control.MiniMap.css@@</style>');
};

var setup =  window.plugin.miniMap.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
