// ==UserScript==
// @id             iitc-plugin-basemap-gmaps-gray@jacob1123
// @name           IITC plugin: Gray Google Roads
// @category       Map Tiles
// @version        0.1.2.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Add a simplified gray Version of Google map tiles as an optional layer.
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

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.grayGMaps = function() {};
window.plugin.grayGMaps.addLayer = function() {
  var grayGMapsOptions = {
    backgroundColor: '#0e3d4e', //or #dddddd ? - that's the Google tile layer default
    styles: [
      {featureType:"landscape.natural",stylers:[{visibility:"simplified"},{saturation:-100},{lightness:-80},{gamma:2.44}]},
      {featureType:"road",stylers:[{visibility:"simplified"},{color:"#bebebe"},{weight:.6}]},
      {featureType:"poi",stylers:[{saturation:-100},{visibility:"on"},{gamma:.14}]},
      {featureType:"water",stylers:[{color:"#32324f"}]},
      {featureType:"transit",stylers:[{visibility:"off"}]},
      {featureType:"road",elementType:"labels",stylers:[{visibility:"off"}]},
      {featureType:"poi",elementType:"labels",stylers:[{visibility:"off"}]},
      {featureType:"poi"},
      {featureType:"landscape.man_made",stylers:[{saturation:-100},{gamma:.13}]},
      {featureType:"water",elementType:"labels",stylers:[{visibility:"off"}]}
    ]
  };

  var grayGMaps = new L.Google('ROA#DMAP',{maxZoom:21, mapOptions: grayGMapsOptions});

  layerChooser.addBaseLayer(grayGMaps, "Google Gray");
};

var setup =  window.plugin.grayGMaps.addLayer;
	
// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
