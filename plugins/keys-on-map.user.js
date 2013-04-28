// ==UserScript==
// @id             iitc-plugin-keys-on-map@xelio
// @name           IITC plugin: Keys on map
// @version        0.2.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Show keys in keys plugin on map.
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
window.plugin.keysOnMap = function() {};

window.plugin.keysOnMap.keyLayers = {};
window.plugin.keysOnMap.keyLayerGroup = new L.LayerGroup();

// Use portal add and remove event to control render of keys
window.plugin.keysOnMap.portalAdded = function(data) {
  // Disable if Plugin Keys is not there
  if(!plugin.keys) {
    plugin.keysOnMap.disableMessage();
    return;
  }

  data.portal.on('add', function() {
    plugin.keysOnMap.renderKey(this.options.guid, this.getLatLng());
  });

  data.portal.on('remove', function() {
    plugin.keysOnMap.removeKey(this.options.guid);
  });
}

window.plugin.keysOnMap.keyUpdate = function(data) {
  // Disable if Plugin Keys is not there
  if(!plugin.keys) {
    plugin.keysOnMap.disableMessage();
    return;
  }
  var portal = window.portals[data.guid];
  if(!portal) return;
  var latLng = portal.getLatLng();

  plugin.keysOnMap.renderKey(data.guid, latLng)
}

window.plugin.keysOnMap.renderKey = function(guid,latLng) {
    plugin.keysOnMap.removeKey(guid);

    var keyCount = plugin.keys.keys[guid];
    if (keyCount > 0) {
      var key = L.marker(latLng, {
        icon: L.divIcon({
          className: 'plugin-keys-on-map-key',
          iconAnchor: [6,7],
          iconSize: [12,10],
          html: keyCount
          }),
        guid: guid
        });

      plugin.keysOnMap.keyLayers[guid] = key;
      key.addTo(plugin.keysOnMap.keyLayerGroup);
    }
}

window.plugin.keysOnMap.removeKey = function(guid) {
    var previousLayer = plugin.keysOnMap.keyLayers[guid];
    if(previousLayer) {
      plugin.keysOnMap.keyLayerGroup.removeLayer(previousLayer);
      delete plugin.keysOnMap.keyLayers[guid];
    }
}

window.plugin.keysOnMap.disableMessage = function() {
  if(!plugin.keysOnMap.messageShown) {
    alert('Plugin "Keys On Map" need plugin "Keys" to run!');
    plugin.keysOnMap.messageShown = true;
  }
}

window.plugin.keysOnMap.setupCSS = function() {
  $("<style>")
    .prop("type", "text/css")
    .html(".plugin-keys-on-map-key {\
            font-size: 10px;\
            color: #FFFFBB;\
            font-family: monospace;\
            text-align: center;\
            text-shadow: 0 0 0.5em black, 0 0 0.5em black, 0 0 0.5em black;\
            pointer-events: none;\
            -webkit-text-size-adjust:none;\
          }")
  .appendTo("head");
}

window.plugin.keysOnMap.setupLayer = function() {
  window.layerChooser.addOverlay(window.plugin.keysOnMap.keyLayerGroup, 'Keys');
  if(isLayerGroupDisplayed('Keys'))
    map.addLayer(window.plugin.keysOnMap.keyLayerGroup);
}

var setup =  function() {

  window.plugin.keysOnMap.setupCSS();
  window.plugin.keysOnMap.setupLayer();

  // Avoid error if this plugin load first
  if($.inArray('pluginKeysUpdateKey', window.VALID_HOOKS) < 0)
    window.VALID_HOOKS.push('pluginKeysUpdateKey');

  window.addHook('portalAdded', window.plugin.keysOnMap.portalAdded);
  window.addHook('pluginKeysUpdateKey', window.plugin.keysOnMap.keyUpdate);
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
