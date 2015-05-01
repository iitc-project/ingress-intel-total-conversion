// ==UserScript==
// @id             iitc-plugin-bing-maps
// @name           IITC plugin: Bing maps
// @category       Map Tiles
// @version        0.1.3.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Add the maps.bing.com map layers.
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

  // bing maps has an annual usage limit, which will likely be hit in 6 months at this time.
  // it seems that the usage is counted on initialising the L.BingLayer, when the metadata is retrieved.
  // so, we'll create some dummy layers and add those to the map, then, the first time a layer is added,
  // create the L.BingLayer. This will eliminate all usage for users who install but don't use the map,
  // and only create usage for the map layers actually selected in use

  var bingMapContainers = [];

  for (type in bingTypes) {
    var name = bingTypes[type];

    bingMapContainers[type] = new L.LayerGroup();
    layerChooser.addBaseLayer(bingMapContainers[type], 'Bing '+name);
  }

  // now a leaflet event to catch base layer changes and create a L.BingLayer when needed
  map.on('baselayerchange', function(e) {
    for (type in bingMapContainers) {
      if (e.layer == bingMapContainers[type]) {
        if (bingMapContainers[type].getLayers().length == 0) {
          // dummy layer group is empty - create the bing layer
          console.log('basemap-bing: creating '+type+' layer');
          var bingMap = new L.BingLayer (bingApiKey, {type: type, maxNativeZoom: 19, maxZoom: 21});
          bingMapContainers[type].addLayer(bingMap);
        }
      }
    }
  });

};

var setup = window.plugin.mapBing.setup;

// PLUGIN END //////////////////////////////////////////////////////////


@@PLUGINEND@@
