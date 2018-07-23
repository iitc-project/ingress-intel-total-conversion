// ==UserScript==
// @id             iitc-plugin-scale-bar@breunigs
// @name           IITC plugin: scale bar
// @category       Controls
// @version        0.1.0.@@DATETIMEVERSION@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Show scale bar on the map.
@@METAINFO@@
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.scaleBar = function() {};

window.plugin.scaleBar.setup  = function() {
  // Before you ask: yes, I explicitely turned off imperial units. Imperial units
  // are worse than Internet Explorer 6 whirring fans combined. Upgrade to the metric
  // system already.
  if (window.isSmartphone()) {
      $('head').append('<style>.leaflet-control-scale { position: absolute; bottom: 15px; right: 0px; margin-bottom: 20px !important; } </style>');
      window.map.addControl(new L.Control.Scale({position: 'bottomright', imperial: false, maxWidth: 100}));
  } else {
      $('head').append('<style>.leaflet-control-scale { position: absolute; top: 2px; left: 40px; } </style>');
      window.map.addControl(new L.Control.Scale({position: 'topleft', imperial: false, maxWidth: 200}));
  }
};

var setup =  window.plugin.scaleBar.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
