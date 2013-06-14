// ==UserScript==
// @id             iitc-plugin-basemap-blank@jonatkins
// @name           IITC plugin: Blank map
// @category       Map Tiles
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Add a blank map layer - no roads or other features.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.mapTileBlank = function() {};

window.plugin.mapTileBlank.addLayer = function() {

  var blankOpt = {attribution: '', maxZoom: 20};
  var blank = new L.TileLayer('@@INCLUDEIMAGE:plugins/basemap-blank-tile.png@@', blankOpt);

  layerChooser.addBaseLayer(blank, "Blank Map");
};

var setup =  window.plugin.mapTileBlank.addLayer;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
