// ==UserScript==
// @id             iitc-plugin-bing-maps
// @name           IITC plugin: Bing maps
// @category       Map Tiles
// @version        0.1.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Add the maps.bing.com map layers (
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

window.plugin.mapBing = function() {};

window.plugin.mapBing.setupBingLeaflet = function() {
@@INCLUDERAW:external/Bing.js@@
}
	

window.plugin.mapBing.setup = function() {
  window.plugin.mapBing.setupBingLeaflet();
	
  //set this to your API key
  var bingApiKey = 'ArR2hTa2C9cRQZT-RmgrDkfvh3PwEVRl0gB34OO4wJI7vQNElg3DDWvbo5lfUs3p';

  var bingTypes = {
    'Road': "Road",
    'Aerial': "Aerial",
    'AerialWithLabels': "Aerial with labels",
  };

  for (type in bingTypes) {
    var name = bingTypes[type];
    var bingMap = new L.BingLayer(bingApiKey, {type: type, maxZoom:20});
    layerChooser.addBaseLayer(bingMap, 'Bing '+name);
  }

};

var setup = window.plugin.mapBing.setup;

// PLUGIN END //////////////////////////////////////////////////////////


@@PLUGINEND@@
