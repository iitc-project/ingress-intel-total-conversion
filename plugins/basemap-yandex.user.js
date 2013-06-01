// ==UserScript==
// @id             iitc-plugin-basemap-yandex@jonatkins
// @name           IITC plugin: Yandex maps
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Add Yandex.com (Russian/Русский) map layers
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
window.plugin.mapTileYandex = function() {};


window.plugin.mapTileYandex.setup = function() {
//a few options on language are available, including en-US. Oddly, the detail available on the maps varies
//dependong on the language
  var yandexApiJs = '//api-maps.yandex.ru/2.0-stable/?load=package.standard&lang=ru-RU'

  load(yandexApiJs).thenRun(window.plugin.mapTileYandex.addLayer);
}

window.plugin.mapTileYandex.addLayer = function() {

//include Yandex.js start
@@INCLUDERAW:external/Yandex.js@@
//include Yandex.js end

  var yStyles = {
    'map': "Map",
    'satellite': "Satellite",
    'hybrid': "Hybrid",
//    'publicMap': "Public Map",
//    'publicMapHybrid': "Public Hybrid",
  };


  var yOpt = {maxZoom: 18};

  $.each(yStyles, function(key,value) {
    var yMap = new L.Yandex(key, yOpt);
    layerChooser.addBaseLayer(yMap, 'Yandex '+value);
  });

};

var setup =  window.plugin.mapTileYandex.setup;

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
