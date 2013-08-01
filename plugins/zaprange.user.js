// ==UserScript==
// @id             iitc-plugin-zaprange@zaso
// @name           IITC plugin: Zaprange
// @category       Layer
// @version        0.1.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Shows the maximum range of attack by the portals.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.zaprange = function() {};

window.plugin.zaprange.zapLayers = {};
window.plugin.zaprange.MIN_MAP_ZOOM = 15;


window.plugin.zaprange.portalAdded = function(data) {
  data.portal.on('add', function() {
    window.plugin.zaprange.draw(this.options.guid);
  });

  data.portal.on('remove', function() {
    window.plugin.zaprange.remove(this.options.guid);
  });
}

window.plugin.zaprange.remove = function(guid) {
  var previousLayer = window.plugin.zaprange.zapLayers[guid];
  if(previousLayer) {
    window.plugin.zaprange.zapCircleHolderGroup.removeLayer(previousLayer);
    delete window.plugin.zaprange.zapLayers[guid];
  }
}

window.plugin.zaprange.draw = function(guid) {
  var d = window.portals[guid];
  var dd = d.options.details;

  if(dd.controllingTeam.team !== "NEUTRAL") {
    var coo = d._latlng;
    var latlng = new L.LatLng(coo.lat,coo.lng);
    var portalLevel = parseInt(getPortalLevel(dd));
    var optCircle = {color:'red',opacity:0.7,fill:true,fillColor:'red',fillOpacity:0.1,weight:1,clickable:false, dashArray: [10,6]};
    var range = (5*portalLevel)+35;

    var circle = new L.Circle(latlng, range, optCircle);
    window.plugin.zaprange.zapLayers[guid] = circle;
    circle.addTo(window.plugin.zaprange.zapCircleHolderGroup);
  }
}

window.plugin.zaprange.showOrHide = function() {
  var ctrl = $('.leaflet-control-layers-selector + span:contains("Portal Attack Range")').parent();
  if (map.getZoom() >= window.plugin.zaprange.MIN_MAP_ZOOM) {
    // show the layer
    if(!window.plugin.zaprange.zapLayerHolderGroup.hasLayer(window.plugin.zaprange.zapCircleHolderGroup)) {
      window.plugin.zaprange.zapLayerHolderGroup.addLayer(window.plugin.zaprange.zapCircleHolderGroup);
    }
    ctrl.removeClass('disabled').attr('title', '');
  } else {
    // hide the layer
    if(window.plugin.zaprange.zapLayerHolderGroup.hasLayer(window.plugin.zaprange.zapCircleHolderGroup)) {
      window.plugin.zaprange.zapLayerHolderGroup.removeLayer(window.plugin.zaprange.zapCircleHolderGroup);
    }
    ctrl.addClass('disabled').attr('title', 'Zoom in to show those.');
  }
}

var setup =  function() {
  // this layer is added to tha layer chooser, to be toggled on/off
  window.plugin.zaprange.zapLayerHolderGroup = new L.LayerGroup();

  // this layer is added into the above layer, and removed from it when we zoom out too far
  window.plugin.zaprange.zapCircleHolderGroup = new L.LayerGroup();

  window.plugin.zaprange.zapLayerHolderGroup.addLayer(window.plugin.zaprange.zapCircleHolderGroup);

  window.addLayerGroup('Portal Attack Range', window.plugin.zaprange.zapLayerHolderGroup, true);
  window.addHook('portalAdded', window.plugin.zaprange.portalAdded);

  map.on('zoomend', window.plugin.zaprange.showOrHide);

  window.plugin.zaprange.showOrHide();

}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
