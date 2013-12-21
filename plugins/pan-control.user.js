// ==UserScript==
// @id             iitc-plugin-pan-control@fragger
// @name           IITC plugin: pan control
// @category       Controls
// @version        0.1.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Show a panning control on the map.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.panControl = function() {};

window.plugin.panControl.setup  = function() {
  try { console.log('Loading Leaflet.Pancontrol JS now'); } catch(e) {}
  @@INCLUDERAW:external/L.Control.Pan.js@@
  try { console.log('done loading Leaflet.Pancontrol JS'); } catch(e) {}

  // prevent Pancontrol from being activated by default (e.g. in minimap)
  L.Map.mergeOptions({
    panControl: false
  });


  window.map.panControl = L.control.pan({panOffset: 350});
  window.map.addControl(window.map.panControl);

  if(map.zoomControl._map) {  // Move above the zoom control
    window.map.removeControl(map.zoomControl);
    window.map.zoomControl = L.control.zoom();
    window.map.addControl(window.map.zoomControl);
  }

  $('head').append('<style>@@INCLUDESTRING:external/L.Control.Pan.css@@</style>');
};

var setup =  window.plugin.panControl.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
