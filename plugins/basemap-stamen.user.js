// ==UserScript==
// @id             iitc-plugin-basemap-stamen@jonatkins
// @name           IITC plugin: Map layers from stamen.com
// @category       Map Tiles
// @version        0.2.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Add the 'Toner' and 'Watercolor' map layers from maps.stamen.com.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @include        https://www.ingress.com/mission/*
// @include        http://www.ingress.com/mission/*
// @match          https://www.ingress.com/mission/*
// @match          http://www.ingress.com/mission/*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.mapTileStamen = function() {};


window.plugin.mapTileStamen.addLayer = function() {

  var types = {
    'toner': [ 'Toner', 'png', 0, 20 ],
//    'toner-hybrid': [ ' Toner Hybrid', 'png', 0, 20 ],  // transparent layer. could be useful over satellite imagery or similar
//    'toner-labels': [ 'Toner Labels', 'png', 0, 20 ],  // transparent layer. could be useful over satellite imagery or similar
//    'toner-lines': [ 'Toner Lines', 'png', 0, 20 ],  // transparent layer. could be useful over satellite imagery or similar
    'toner-background': [ 'Toner Background', 'png', 0, 20 ],
    'toner-lite': [ 'Toner Lite', 'png', 0, 20 ],
    'watercolor': [ 'Watercolor', 'jpg', 1, 16 ],
  };

  var baseUrl = window.location.protocol == 'https:' ? 'https://stamen-tiles-{s}.a.ssl.fastly.net/' : 'http://{s}.tile.stamen.com/';


  for (var layer in types) {
    var info = types[layer];

    var name = info[0];
    var type = info[1];
    var minZoom = info[2];
    var maxZoom = info[3];

    var mapLayer = new L.TileLayer (baseUrl+'{layer}/{z}/{x}/{y}.{type}', {
      attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.',
      subdomains: 'abcd',    
      layer: layer,
      type: type,
      minZoom: minZoom,
      maxNativeZoom: maxZoom,
      maxZoom: 21
    });

    layerChooser.addBaseLayer(mapLayer,'Stamen '+name);
  }

};

var setup =  window.plugin.mapTileStamen.addLayer;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
