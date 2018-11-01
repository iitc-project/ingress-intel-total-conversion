// ==UserScript==
// @id             iitc-plugin-nokia-ovi-maps
// @name           IITC plugin: Nokia OVI maps
// @category       Map Tiles
// @version        0.1.3.20181101.60209
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      none
// @downloadURL    none
// @description    [mobile-2018-11-01-060209] Add various map layers from Nokia OVI Maps.
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
plugin_info.pluginId = 'basemap-nokia-ovi';
//END PLUGIN AUTHORS NOTE



// PLUGIN START ////////////////////////////////////////////////////////

window.plugin.mapNokiaOvi = function() {};

window.plugin.mapNokiaOvi.setup = function() {
  //the list of styles you'd like to see
  var oviStyles = {
    'normal.day': { name: "Normal", type: 'png8' },
    'normal.day.grey': { name: "Normal (grey)", type: 'png8' },
    'normal.day.transit': { name: "Normal (transit)", type: 'png8' },
    'satellite.day': { name: "Satellite", type: 'jpg' },
    'terrain.day': { name: "Terrain", type: 'png8' }, //would jpg be better?
    'normal.night.grey': { name: "Normal Night (grey)", type: 'png8' },
  };


  var oviOpt = {attribution: 'Imagery © Nokia OVI', maxNativeZoom: 20, maxZoom: 21};

  $.each(oviStyles, function(style,data) {
    oviOpt['style'] = style;
    oviOpt['type'] = data.type;
    var oviMap = new L.TileLayer('http://{s}.maptile.maps.svc.ovi.com/maptiler/maptile/newest/{style}/{z}/{x}/{y}/256/{type}', oviOpt);
    layerChooser.addBaseLayer(oviMap, 'Nokia OVI '+data.name);
  });

};

var setup = window.plugin.mapNokiaOvi.setup;

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


