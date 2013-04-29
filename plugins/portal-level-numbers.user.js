// ==UserScript==
// @id             iitc-plugin-portal-level-numbers@rongou
// @name           IITC plugin: Portal Level Numbers
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Show portal level numbers on map.
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
window.plugin.portalLevelNumbers = function() {};

window.plugin.portalLevelNumbers.levelLayers = {};
window.plugin.portalLevelNumbers.levelLayerGroup = new L.LayerGroup();

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

    var d = window.portals[guid].options.details;
    var levelNumber = Math.floor(window.getPortalLevel(d));
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

  window.layerChooser.addOverlay(window.plugin.portalLevelNumbers.levelLayerGroup, 'Portal Levels');
  map.addLayer(window.plugin.portalLevelNumbers.levelLayerGroup);

  window.addHook('portalAdded', window.plugin.portalLevelNumbers.portalAdded);
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
