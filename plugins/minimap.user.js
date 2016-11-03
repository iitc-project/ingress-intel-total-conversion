// ==UserScript==
// @id             iitc-plugin-minimap@breunigs
// @name           IITC plugin: Mini map
// @category       Controls
// @version        0.2.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Show a mini map on the corner of the map.
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
window.plugin.miniMap = function() {};

window.plugin.miniMap.setup  = function() {

  try { console.log('Loading leaflet.draw JS now'); } catch(e) {}
  @@INCLUDERAW:external/Control.MiniMap.js@@
  try { console.log('done loading leaflet.draw JS'); } catch(e) {}

  // we can't use the same TileLayer as the main map uses - it causes issues.
  // stick with the Google tiles for now

  // desktop mode - bottom-left, so it doesn't clash with the sidebar
  // mobile mode - bottom-right - so it floats above the map copyright text
  var position = isSmartphone() ? 'bottomright' : 'bottomleft';

  setTimeout(function() {
    new L.Control.MiniMap(new L.Google('ROADMAP',{maxZoom:21}), {toggleDisplay: true, position: position}).addTo(window.map);
  }, 0);

  $('head').append('<style>@@INCLUDESTRING:external/Control.MiniMap.css@@</style>');
};

var setup =  window.plugin.miniMap.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
