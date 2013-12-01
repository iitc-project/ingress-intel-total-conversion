// ==UserScript==
// @id             iitc-plugin-portal-level-numbers@rongou
// @name           IITC plugin: Portal Level Numbers
// @category       Layer
// @version        0.1.2.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Show portal level numbers on map.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalLevelNumbers = function() {};

window.plugin.portalLevelNumbers.levelLayers = {};
window.plugin.portalLevelNumbers.levelLayerGroup = null;

// Use portal add and remove event to control render of portal level numbers
window.plugin.portalLevelNumbers.portalAdded = function(data) {
  data.portal.on('add', function() {
    plugin.portalLevelNumbers.renderLevel(this.options.guid, this.getLatLng());
  });

  data.portal.on('remove', function() {
    plugin.portalLevelNumbers.removeLevel(this.options.guid);
  });
}

window.plugin.portalLevelNumbers.renderLevel = function(guid,latLng) {
    plugin.portalLevelNumbers.removeLevel(guid);

    var p = window.portals[guid];
    var levelNumber = p.options.level;
    var level = L.marker(latLng, {
      icon: L.divIcon({
        className: 'plugin-portal-level-numbers',
        iconAnchor: [6,7],
        iconSize: [12,10],
        html: levelNumber
        }),
      guid: guid
      });

    plugin.portalLevelNumbers.levelLayers[guid] = level;
    level.addTo(plugin.portalLevelNumbers.levelLayerGroup);
}

window.plugin.portalLevelNumbers.removeLevel = function(guid) {
    var previousLayer = plugin.portalLevelNumbers.levelLayers[guid];
    if(previousLayer) {
      plugin.portalLevelNumbers.levelLayerGroup.removeLayer(previousLayer);
      delete plugin.portalLevelNumbers.levelLayers[guid];
    }
}

var setup =  function() {
  $("<style>")
    .prop("type", "text/css")
    .html(".plugin-portal-level-numbers {\
            font-size: 10px;\
            color: #FFFFBB;\
            font-family: monospace;\
            text-align: center;\
            text-shadow: 0 0 0.5em black, 0 0 0.5em black, 0 0 0.5em black;\
            pointer-events: none;\
            -webkit-text-size-adjust:none;\
          }")
  .appendTo("head");

  window.plugin.portalLevelNumbers.levelLayerGroup = new L.LayerGroup();

  window.addLayerGroup('Portal Levels', window.plugin.portalLevelNumbers.levelLayerGroup, true);

  window.addHook('portalAdded', window.plugin.portalLevelNumbers.portalAdded);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
