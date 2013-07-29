// ==UserScript==
// @id             iitc-plugin-defense@gluckies
// @name           IITC plugin: portal defense 
// @category       Layer
// @version        0.2.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Shows the defense values of every portal
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// ==/UserScript==


function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalDefense = function() {};

window.plugin.portalDefense.MIN_MAP_ZOOM = 15;
window.plugin.portalDefense.DETAIL_MAP_ZOOM = 17;
window.plugin.portalDefense.DisplayEnum = {
  OFF : 0,
  SIMPLE : 1,
  DETAIL : 2
};

window.plugin.portalDefense.regionLayers = {};

// Use portal add and remove event to control render of regions
window.plugin.portalDefense.portalAdded = function(data) {
  data.portal.on('add', function() {
    plugin.portalDefense.renderAttackRegion(this);
  });

  data.portal.on('remove', function() {
    plugin.portalDefense.removeAttackRegion(this);
  });
}

window.plugin.portalDefense.getDisplay = function() {
  if (map.getZoom() >= window.plugin.portalDefense.DETAIL_MAP_ZOOM) {
    return window.plugin.portalDefense.DisplayEnum.DETAIL;
  } else if (map.getZoom() >= window.plugin.portalDefense.MIN_MAP_ZOOM) {
    return window.plugin.portalDefense.DisplayEnum.SIMPLE;
  }
  return window.plugin.portalDefense.DisplayEnum.OFF;
}

window.plugin.portalDefense.computeDef = function(portal) {
  var m = portal.options.details.portalV2.linkedModArray;
  var ret = {};
  ret.mod = 0;
  ret.links = 0;
  var display = "";
  $.each(m, function(ind, mod) {
    if (!mod) return true;
    if(!mod.stats.MITIGATION)
      return true;
    ret.mod += parseInt(mod.stats.MITIGATION);
  });
  var link = 0;
  $(portal.options.details.portalV2.linkedEdges).each(function () {
    link++;
  });
  if (link > 0) {
    ret.links = Math.round(400/9*Math.atan(link/Math.E));
  }
  ret.total = Math.min(95, ret.mod + ret.links);
    
  return ret;
}

window.plugin.portalDefense.renderAttackRegion = function(portal) {
  plugin.portalDefense.removeAttackRegion(portal);
  if (window.plugin.portalDefense.currentDisplay == window.plugin.portalDefense.DisplayEnum.OFF) return;
    
  plugin.portalDefense.regionLayers[portal.options.guid] = [];
  var defense = window.plugin.portalDefense.computeDef(portal);
  if (defense.total) {
    var display = defense.total;
    if (window.plugin.portalDefense.currentDisplay == window.plugin.portalDefense.DisplayEnum.DETAIL) {
	  if(defense.mod) {
        display += "<br>"+"\u2297"+defense.mod;
      }
      if(defense.links) {
        display += "<br>"+"\u21b1"+defense.links;
	  }
    }
    var region = L.marker(portal.getLatLng(), {
      icon: L.divIcon({
        className: 'plugin-iic-defense',
        clickable: false,
        iconAnchor: [-10,10],
        html: "<div class='defense-label'>"+display+"</div>"
        }),
      guid: portal.options.guid
    });
    plugin.portalDefense.regionLayers[portal.options.guid].push(region);
    region.addTo(plugin.portalDefense.regionLayerGroup);
  }
}

window.plugin.portalDefense.reload = function() {
  $.each(window.portals, function(ind, portal){
    window.plugin.portalDefense.renderAttackRegion(portal)
  });
}

window.plugin.portalDefense.removeAttackRegion = function(portal) {
  var previousLayers = plugin.portalDefense.regionLayers[portal.options.guid];
  if (previousLayers) {
    for (var i = 0; i < previousLayers.length; i++) {
      plugin.portalDefense.regionLayerGroup.removeLayer(previousLayers[i]);
    }
    delete plugin.portalDefense.regionLayers[portal.options.guid];
  }
}

window.plugin.portalDefense.regions = {}

window.plugin.portalDefense.showOrHide = function() {
  var ctrl = $('.leaflet-control-layers-selector + span:contains("Portal Defense")').parent();
  var display = window.plugin.portalDefense.getDisplay();
  if (display != window.plugin.portalDefense.DisplayEnum.OFF) {
    // show the layer
    if(!window.plugin.portalDefense.regionLayerGroup.hasLayer(window.plugin.portalDefense.defenseLayerGroup)) {
      window.plugin.portalDefense.regionLayerGroup.addLayer(window.plugin.portalDefense.defenseLayerGroup);
    }
    ctrl.removeClass('disabled').attr('title', '');
  } else {
    // hide the layer
    if(window.plugin.portalDefense.regionLayerGroup.hasLayer(window.plugin.portalDefense.defenseLayerGroup)) {
      window.plugin.portalDefense.regionLayerGroup.removeLayer(window.plugin.portalDefense.defenseLayerGroup);
    }
    ctrl.addClass('disabled').attr('title', 'Zoom in to show those.');
  }
  if (window.plugin.portalDefense.currentDisplay != display) {
    window.plugin.portalDefense.currentDisplay = display;
    window.plugin.portalDefense.reload()
  }
}

var setup =  function() {
  $('#toolbox').append(' <a onclick="window.plugin.portalDefense.reload()">Reload Defense</a>');
  $("<style>")
    .prop("type", "text/css")
    .html(".plugin-iic-defense {\
            font-size: 10px;\
            color: #FFFFBB;\
            font-family: monospace;\
            text-align: center;\
            text-shadow: 0 0 0.5em black, 0 0 0.5em black, 0 0 0.5em black;\
            pointer-events: none;\
            -webkit-text-size-adjust:none;\
           }\
           .defense-label {\
            position:relative;\
            background-color:#1B3E59;\
            opacity:.6;\
            border:0.5px solid #FFCE00;\
            width:22px;\
            text-align:center;\
            color:#FFFFFF;\
            text-align:center;\
            border-radius:6px;\
           }")
    .appendTo("head");

  window.plugin.portalDefense.currentDisplay = window.plugin.portalDefense.getDisplay();
  map.on('zoomend', window.plugin.portalDefense.showOrHide);
    
  // this layer is added to tha layer chooser, to be toggled on/off
  window.plugin.portalDefense.regionLayerGroup = new L.LayerGroup();

  // this layer is added into the above layer, and removed from it when we zoom out too far
  window.plugin.portalDefense.defenseLayerGroup = new L.LayerGroup();

  window.plugin.portalDefense.regionLayerGroup.addLayer(window.plugin.portalDefense.defenseLayerGroup);
  window.addLayerGroup('Portal Defense', window.plugin.portalDefense.regionLayerGroup, true);
    
  window.addHook('portalAdded', window.plugin.portalDefense.portalAdded);
    
  window.plugin.portalDefense.showOrHide();
}

// PLUGIN END //////////////////////////////////////////////////////////

if(window.iitcLoaded && typeof setup === 'function') {
  setup();
} else {
  if(window.bootPlugins)
    window.bootPlugins.push(setup);
  else
    window.bootPlugins = [setup];
}
} // wrapper end
// inject code into site context
var script = document.createElement('script');
script.appendChild(document.createTextNode('('+ wrapper +')();'));
(document.body || document.head || document.documentElement).appendChild(script);
