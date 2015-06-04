// ==UserScript==
// @id             iitc-plugin-hackrange@locriansoul
// @name           IITC plugin: Hackrange
// @category       Layer
// @version        0.1.4.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Shows the hack range of portals and where they overlap for farming and other purposes.
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

// PLUGIN START ///////////////////////////////////////////////////////

  // use own namespace for plugin
  window.plugin.hackrange = function() {};
  window.plugin.hackrange.hackLayers = {};
  window.plugin.hackrange.MINIMUM_MAP_ZOOM = 16;


  // Handle addition or removal of a portal
  // data - Portal action information
  window.plugin.hackrange.portalAdded = function(data) {
    data.portal.on('add', function() {
      window.plugin.hackrange.draw(this.options.guid);
    });

    data.portal.on('remove', function() {
      window.plugin.hackrange.remove(this.options.guid);
    });
  }


  // Remove a given portal from the hackrange layer
  // guid - The unique ID of the portal to be removed
  window.plugin.hackrange.remove = function(guid) {
    var previousLayer = window.plugin.hackrange.hackrangeLayers[guid];
    if(previousLayer) {
      window.plugin.hackrange.hackrangeLayers.removeLayer(previousLayer);
      delete window.plugin.hackrange.hackrangeLayers[guid];
    }
  }


  // Define and add the hackrange circles for a given portal
  // guid - The unique ID of the portal to be added
  window.plugin.hackrange.draw = function(guid) {
    var portal = window.portals[guid];

    // Create a new location object for the portal
    var coo = portal._latlng;
    var latlng = new L.LatLng(coo.lat, coo.lng);
    
    // Specify the hack circle options
    var circleOptions = {color:'purple', opacity:0.7, fillColor:'blue', fillOpacity:0.15, weight:1, clickable:false, dashArray: [6,3]};
    var range = 40; // Hardcoded to 40m, the universal hack range of a portal

    // Create the circle object with specified options 
    var circle = new L.Circle(latlng, range, circleOptions);

    // Add the new circle to the hackrange draw layer
    circle.addTo(window.plugin.hackrange.hackrangeLayers);
    window.plugin.hackrange.hackrangeLayers[guid] = circle;
  }


  // Either draw or remove the hackrange draw layer depending on the zoom level
  window.plugin.hackrange.showOrHide = function() {
      // If the current zoom level is below the minimum to display hack ranges then show the hackrange draw layer, else hide it
      if(map.getZoom() >= window.plugin.hackrange.MINIMUM_MAP_ZOOM) {
      // show the layer
          if(!window.plugin.hackrange.hackLayerHolderGroup.hasLayer(window.plugin.hackrange.hackrangeLayers)) {
              window.plugin.hackrange.hackLayerHolderGroup.addLayer(window.plugin.hackrange.hackrangeLayers);
        $('.leaflet-control-layers-list span:contains("Hackrange")').parent('label').removeClass('disabled').attr('title', '');
      }
    } else {
      // hide the layer
          if(window.plugin.hackrange.hackLayerHolderGroup.hasLayer(window.plugin.hackrange.hackrangeLayers)) {
              window.plugin.hackrange.hackLayerHolderGroup.removeLayer(window.plugin.hackrange.hackrangeLayers);
        $('.leaflet-control-layers-list span:contains("Hackrange")').parent('label').addClass('disabled').attr('title', 'Zoom in to show those.');
      }
    }
  }

  // Initilize the plugin and display hackranges if at an appropriate zoom level
  var setup =  function() {
    // this layer is added to the layer chooser, to be toggled on/off
    window.plugin.hackrange.hackLayerHolderGroup = new L.LayerGroup();

    // this layer is added into the above layer, and removed from it when we zoom out too far
    window.plugin.hackrange.hackrangeLayers = new L.LayerGroup();

    window.plugin.hackrange.hackLayerHolderGroup.addLayer(window.plugin.hackrange.hackrangeLayers);

    window.addLayerGroup('Hackrange', window.plugin.hackrange.hackLayerHolderGroup, true);

    window.addHook('portalAdded', window.plugin.hackrange.portalAdded);

    map.on('zoomend', window.plugin.hackrange.showOrHide);

    window.plugin.hackrange.showOrHide();
  }

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
