// ==UserScript==
// @id             iitc-plugin-zoom-slider@fragger
// @name           IITC plugin: zoom slider
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Shows a zoom slider on the map instead of the zoom buttons
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// ==/UserScript==

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.zoomSlider = function() {};

window.plugin.zoomSlider.setup  = function() {
  try { console.log('Loading Leaflet.zoomslider JS now'); } catch(e) {}
  @@INCLUDERAW:external/L.Control.Zoomslider.js@@
  try { console.log('done loading Leaflet.zoomslider JS'); } catch(e) {}
  
  window.map.removeControl(map.zoomControl);
  window.map.addControl(L.control.zoomslider());
  
  $('head').append('<style>@@INCLUDESTRING:external/L.Control.Zoomslider.css@@</style>');
};

var setup =  window.plugin.zoomSlider.setup;

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
