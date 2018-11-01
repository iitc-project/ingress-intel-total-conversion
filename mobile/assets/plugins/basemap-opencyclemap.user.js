// ==UserScript==
// @id             iitc-plugin-basemap-opencyclepam@jonatkins
// @name           IITC plugin: OpenCycleMap.org map tiles
// @category       Map Tiles
// @version        0.2.0.20181101.60209
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      none
// @downloadURL    none
// @description    [mobile-2018-11-01-060209] Add the OpenCycleMap.org map tiles as an optional layer.
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
plugin_info.pluginId = 'basemap-opencyclemap';
//END PLUGIN AUTHORS NOTE



// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.mapTileOpenCycleMap = {
  addLayer: function() {
    //the Thunderforest (OpenCycleMap) tiles are free to use - http://www.thunderforest.com/terms/

    var ocmOpt = {
      attribution: 'Tiles © OpenCycleMap, Map data © OpenStreetMap',
      maxNativeZoom: 18,
      maxZoom: 21,
    };

    var layers = {
      'cycle': 'OpenCycleMap',
      'transport': 'Transport',
      'transport-dark': 'Transport Dark',
      'outdoors': 'Outdoors',
      'landscape': 'Landscape',
    };

    for(var i in layers) {
      var layer = new L.TileLayer('http://{s}.tile.thunderforest.com/' + i + '/{z}/{x}/{y}.png', ocmOpt);
      layerChooser.addBaseLayer(layer, 'Thunderforest ' + layers[i]);
    }
  },
};

var setup =  window.plugin.mapTileOpenCycleMap.addLayer;

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


