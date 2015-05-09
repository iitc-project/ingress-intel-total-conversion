// ==UserScript==
// @id             iitc-plugin-keys-on-map@xelio
// @name           IITC plugin: Keys on map
// @category       Keys
// @version        0.2.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Show the manually entered key counts from the 'keys' plugin on the map.
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

// use own namespace for plugin
window.plugin.keysOnMap = function() {};

window.plugin.keysOnMap.keyLayers = {};

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

window.plugin.keysOnMap.refreshAllKeys = function() {
  plugin.keysOnMap.keyLayerGroup.clearLayers();
  $.each(plugin.keys.keys, function(key, count) {
    plugin.keysOnMap.keyUpdate({guid: key});
  });
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
  window.plugin.keysOnMap.keyLayerGroup = new L.LayerGroup();
  window.addLayerGroup('Keys', window.plugin.keysOnMap.keyLayerGroup, false);
}

var setup =  function() {

  window.plugin.keysOnMap.setupCSS();
  window.plugin.keysOnMap.setupLayer();

  // Avoid error if this plugin load first
  if($.inArray('pluginKeysUpdateKey', window.VALID_HOOKS) < 0)
    window.VALID_HOOKS.push('pluginKeysUpdateKey');
  if($.inArray('pluginKeysRefreshAll', window.VALID_HOOKS) < 0)
    window.VALID_HOOKS.push('pluginKeysRefreshAll');

  window.addHook('portalAdded', window.plugin.keysOnMap.portalAdded);
  window.addHook('pluginKeysUpdateKey', window.plugin.keysOnMap.keyUpdate);
  window.addHook('pluginKeysRefreshAll', window.plugin.keysOnMap.refreshAllKeys);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
