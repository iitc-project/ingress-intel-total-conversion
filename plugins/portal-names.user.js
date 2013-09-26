// ==UserScript==
// @id             iitc-plugin-portal-names@zaso
// @name           IITC plugin: Portal Names
// @category       Layer
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Show portal names on the map
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalNames = function() {};
window.plugin.portalNames.labelLayers = {};
window.plugin.portalNames.labelLayerGroup = null;

window.plugin.portalNames.setupCSS = function() {
  $("<style>").prop("type", "text/css").html(''
  +'.plugin-portal-names{'
    +'font-size:11px;color:#FFFFBB;text-align:center;line-height:12px;'
    +'text-shadow:1px 1px #000,1px -1px #000,-1px 1px #000,-1px -1px #000, 0 0 5px #000;'
    +'pointer-events:none;'
  +'}'
  ).appendTo("head");
}

window.plugin.portalNames.portalAdded = function(data) {
  data.portal.on('add', function() {
    window.plugin.portalNames.addLabel(this.options.guid, this.getLatLng());
  });
  data.portal.on('remove', function() {
    window.plugin.portalNames.removeLabel(this.options.guid);
  });
}

window.plugin.portalNames.removeLabel = function(guid) {
  var previousLayer = window.plugin.portalNames.labelLayers[guid];
  if(previousLayer) {
    window.plugin.portalNames.labelLayerGroup.removeLayer(previousLayer);
    delete plugin.portalNames.labelLayers[guid];
  }
}

window.plugin.portalNames.addLabel = function(guid, latLng) {
  window.plugin.portalNames.removeLabel(guid);

  var d = window.portals[guid].options.details;
  var portalName = d.portalV2.descriptiveText.TITLE;

  var label = L.marker(latLng, {
    icon: L.divIcon({
      className: 'plugin-portal-names',
      iconAnchor: [50,0],
      iconSize: [100,24],
      html: portalName
    }),
    guid: guid,
  });
  window.plugin.portalNames.labelLayers[guid] = label;
  label.addTo(window.plugin.portalNames.labelLayerGroup);
}

var setup = function() {
  window.plugin.portalNames.setupCSS();

  window.plugin.portalNames.labelLayerGroup = new L.LayerGroup();
  window.addLayerGroup('Portal Names', window.plugin.portalNames.labelLayerGroup, true);

  window.addHook('portalAdded', window.plugin.portalNames.portalAdded);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
