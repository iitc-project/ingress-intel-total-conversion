// ==UserScript==
// @id             iitc-plugin-nokia-ovi-maps
// @name           IITC plugin: Nokia OVI maps
// @category       Map Tiles
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Add various map layers from Nokia OVI Maps.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

window.plugin.mapNokiaOvi = function() {};

window.plugin.mapNokiaOvi.setup = function() {
  //the list of styles you'd like to see
  var oviStyles = {
    'normal.day': "Normal",
    'normal.day.grey': "Normal (grey)",
    'normal.day.transit': "Normal (transit)",
    'satellite.day': "Satellite",
    'terrain.day': "Terrain",
  };


  var oviOpt = {attribution: 'Imagery © Nokia OVI', maxZoom: 20};

  $.each(oviStyles, function(key,value) {
    oviOpt['style'] = key;
    var oviMap = new L.TileLayer('http://maptile.maps.svc.ovi.com/maptiler/maptile/newest/{style}/{z}/{x}/{y}/256/png8', oviOpt);
    layerChooser.addBaseLayer(oviMap, 'Nokia OVI '+value);
  });

};

var setup = window.plugin.mapNokiaOvi.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
