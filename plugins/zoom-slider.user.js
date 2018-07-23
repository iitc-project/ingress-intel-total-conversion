// ==UserScript==
// @id             iitc-plugin-zoom-slider@fragger
// @name           IITC plugin: zoom slider
// @category       Controls
// @version        0.1.1.@@DATETIMEVERSION@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Show a zoom slider on the map instead of the zoom buttons.
@@METAINFO@@
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.zoomSlider = function() {};

window.plugin.zoomSlider.setup  = function() {
  try { console.log('Loading Leaflet.zoomslider JS now'); } catch(e) {}
  @@INCLUDERAW:external/L.Control.Zoomslider.js@@
  try { console.log('done loading Leaflet.zoomslider JS'); } catch(e) {}

  // prevent Zoomslider from being activated by default (e.g. in minimap)
  L.Map.mergeOptions({
    zoomsliderControl: false
  });

  if(map.zoomControl._map) {
    window.map.removeControl(map.zoomControl);
  }
  window.map.addControl(L.control.zoomslider());

  $('head').append('<style>@@INCLUDESTRING:external/L.Control.Zoomslider.css@@</style>');
};

var setup = window.plugin.zoomSlider.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
