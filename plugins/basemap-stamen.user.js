// ==UserScript==
// @id             iitc-plugin-basemap-stamen@jonatkins
// @name           IITC plugin: Map layers from stamen.com
// @category       Map Tiles
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Adds the 'Toner' and 'Watercolor' map layers from maps.stamen.com
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.mapTileStamen = function() {};

window.plugin.mapTileStamen.setup = function() {

  load('http://maps.stamen.com/js/tile.stamen.js?v1.2.3').thenRun(window.plugin.mapTileStamen.addLayer);
}

window.plugin.mapTileStamen.addLayer = function() {

  var types = {
    'toner': 'Toner',
//    'toner-hybrid': 'Toner Hybrid',  // transparent layer. could be usefun over satelliate imagery or similar
//    'toner-labels': 'Toner Labels',  // transparent layer. could be usefun over satelliate imagery or similar
//    'toner-lines': 'Toner Lines',  // transparent layer. could be usefun over satelliate imagery or similar
    'toner-background': 'Toner Background',
    'toner-lite': 'Toner Lite',
    'watercolor': 'Watercolor',
  };

  for (var type in types) {
    var name = types[type];

    var layer = new L.StamenTileLayer(type);

    layerChooser.addBaseLayer(layer,'Stamen '+name);
  }

};

var setup =  window.plugin.mapTileStamen.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
