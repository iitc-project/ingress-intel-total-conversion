// ==UserScript==
// @id             iitc-plugin-basemap-yandex@jonatkins
// @name           IITC plugin: Yandex maps
// @category       Map Tiles
// @version        0.2.0.@@DATETIMEVERSION@@
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

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.mapTileYandex = function() {};

window.plugin.mapTileYandex.leafletSetup = function() {

//include Yandex.js start
@@INCLUDERAW:external/Yandex.js@@
//include Yandex.js end

}



window.plugin.mapTileYandex.setup = function() {

  var yStyles = {
    'map': "Map",
    'satellite': "Satellite",
    'hybrid': "Hybrid",
//    'publicMap': "Public Map",
//    'publicMapHybrid': "Public Hybrid",
  };


  // we can't directly create the L.Yandex object, as we need to async load the yandex map API
  // so we'll add empty layer groups, then in the callback we can add the yandex layers to the layer groups
  var layers = {};

  $.each(yStyles, function(key,value) {
    layers[key] = new L.LayerGroup();
    layerChooser.addBaseLayer(layers[key], 'Yandex '+value);
  });

  var callback = function() {
    window.plugin.mapTileYandex.leafletSetup();
    var yOpt = {maxZoom: 18};
    $.each(layers, function(key,layer) {
      var yMap = new L.Yandex(key, yOpt);
      layer.addLayer(yMap);
    });
  }


//a few options on language are available, including en-US. Oddly, the detail available on the maps varies
//depending on the language
  var yandexApiJs = '//api-maps.yandex.ru/2.0-stable/?load=package.standard&lang=ru-RU'

  load(yandexApiJs).thenRun(callback);
}


var setup =  window.plugin.mapTileYandex.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
