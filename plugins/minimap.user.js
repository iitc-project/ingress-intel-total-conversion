// ==UserScript==
// @id             iitc-plugin-minimap@breunigs
// @name           IITC plugin: Mini map
// @category       Controls
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Shows a mini map on the corner of the map
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


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

  if(!isSmartphone()) {
    // desktop mode - bottom-left, so it doesn't clash with the sidebar
    new L.Control.MiniMap(mqMap, {toggleDisplay: true, position: 'bottomleft'}).addTo(window.map);
  } else {
    // mobile mode - bottom-right - so it floats above the map copyright text
    new L.Control.MiniMap(mqMap, {toggleDisplay: true, position: 'bottomright'}).addTo(window.map);
  }

  $('head').append('<style>@@INCLUDESTRING:external/Control.MiniMap.css@@</style>');


};

var setup =  window.plugin.miniMap.setup;

// PLUGIN END //////////////////////////////////////////////////////////

if(window.iitcLoaded && typeof setup === 'function') {
  setup();
} else {
  if(window.bootPlugins)
    window.bootPlugins.push(setup);
  else
    window.bootPlugins = [setup];
}
} // wrapper end
// inject code into site context
var script = document.createElement('script');
script.appendChild(document.createTextNode('('+ wrapper +')();'));
(document.body || document.head || document.documentElement).appendChild(script);
