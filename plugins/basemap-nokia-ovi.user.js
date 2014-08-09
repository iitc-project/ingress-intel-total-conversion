// ==UserScript==
// @id             iitc-plugin-nokia-ovi-maps
// @name           IITC plugin: Nokia OVI maps
// @category       Map Tiles
// @version        0.1.3.@@DATETIMEVERSION@@
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

@@PLUGINEND@@
