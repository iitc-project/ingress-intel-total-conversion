// ==UserScript==
// @id             iitc-plugin-scale-bar@breunigs
// @name           IITC plugin: scale bar
// @category       Controls
// @version        0.1.0.20181101.60209
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      none
// @downloadURL    none
// @description    [mobile-2018-11-01-060209] Show scale bar on the map.
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


function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

//PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
//(leaving them in place might break the 'About IITC' page or break update checks)
plugin_info.buildName = 'mobile';
plugin_info.dateTimeVersion = '20181101.60209';
plugin_info.pluginId = 'scale-bar';
//END PLUGIN AUTHORS NOTE



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


setup.info = plugin_info; //add the script info data to the function as a property
if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);


