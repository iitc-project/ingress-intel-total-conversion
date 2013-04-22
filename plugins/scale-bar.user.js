// ==UserScript==
// @id             iitc-plugin-scale-bar@breunigs
// @name           IITC plugin: scale bar
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Shows scale bar on the map
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
window.plugin.scaleBar = function() {};

window.plugin.scaleBar.setup  = function() {
  $('head').append('<style>.leaflet-control-scale { position: absolute; top: 2px; left: 40px; } </style>');
  // Before you ask: yes, I explicitly turned off imperial units. Imperial units
  // are worse than Internet Explorer 6 whirring fans combined. Upgrade to the metric
  // system already.
  window.map.addControl(new L.Control.Scale({position: 'topleft', imperial: false, maxWidth: 200}));
};

var setup =  window.plugin.scaleBar.setup;

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
