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
  window.plugin.zaprange.zapLayerGroup = new L.LayerGroup();
  window.plugin.zaprange.zStart;
  window.plugin.zaprange.zEnd;

  window.plugin.zaprange.portalAdded = function(data) {
    data.portal.on('add', function() {
      window.plugin.zaprange.draw(this.options.guid);
      window.plugin.zaprange.hide();
    });

    data.portal.on('remove', function() {
      window.plugin.zaprange.remove(this.options.guid);
    });
  }

  window.plugin.zaprange.remove = function(guid) {
    var previousLayer = window.plugin.zaprange.zapLayers[guid];
    if(previousLayer) {
      window.plugin.zaprange.zapLayerGroup.removeLayer(previousLayer);
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
      var optCircle = {color:'red',fill:false,weight:2,clickable:false, dashArray: [10,6]};
      var range = (5*portalLevel)+35;

      var circle = new L.Circle(latlng, range, optCircle);
      window.plugin.zaprange.zapLayers[guid] = circle;
      circle.addTo(window.plugin.zaprange.zapLayerGroup);
    }
  }

  window.plugin.zaprange.hide = function() {
    var z1 = window.plugin.zaprange.zStart;
    var z2 = window.plugin.zaprange.zEnd;

    if((z1 > 15 && z2 <= 15) || (z1 <= 15 && z2 <= 15)) {
      window.plugin.zaprange.zapLayerGroup.eachLayer(function(layer) {
        layer.setStyle({opacity:0});
      });
    }else if(z1 <= 15 && z2 > 15) {
      window.plugin.zaprange.zapLayerGroup.eachLayer(function(layer) {
        layer.setStyle({opacity:0.7});
      });
    }
  }

  var setup =  function() {
    window.plugin.zaprange.zStart = window.plugin.zaprange.zEnd = map.getZoom();

    window.addLayerGroup('Zap range', window.plugin.zaprange.zapLayerGroup, true);
    window.addHook('portalAdded', window.plugin.zaprange.portalAdded);

    map.on('zoomstart', function(e) {
      window.plugin.zaprange.zStart = map.getZoom();
    });
    map.on('zoomend', function(e) {
      window.plugin.zaprange.zEnd = map.getZoom();
      window.plugin.zaprange.hide();
    });
  }

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@