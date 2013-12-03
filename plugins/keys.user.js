// ==UserScript==
// @id             iitc-plugin-keys@xelio
// @name           IITC plugin: Keys
// @category       Keys
// @version        0.2.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Allow manual entry of key counts for each portal. Use 'keys-on-map' to show the numbers on the map, and 'sync' to share between multiple browsers or desktop/mobile.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.keys = function() {};

// delay in ms
window.plugin.keys.SYNC_DELAY = 10000;

window.plugin.keys.LOCAL_STORAGE_KEY = 'plugin-keys-data';

window.plugin.keys.KEY = {key: 'plugin-keys-data', field: 'keys'};
window.plugin.keys.UPDATE_QUEUE = {key: 'plugin-keys-data-queue', field: 'updateQueue'};
window.plugin.keys.UPDATING_QUEUE = {key: 'plugin-keys-data-updating-queue', field: 'updatingQueue'};

window.plugin.keys.keys = {};
window.plugin.keys.updateQueue = {};
window.plugin.keys.updatingQueue = {};

window.plugin.keys.enableSync = false;

window.plugin.keys.disabledMessage = null;
window.plugin.keys.contentHTML = null;

window.plugin.keys.addToSidebar = function() {
  if(typeof(Storage) === "undefined") {
    $('#portaldetails > .imgpreview').after(plugin.keys.disabledMessage);
    return;
  }

  $('#portaldetails > .imgpreview').after(plugin.keys.contentHTML);
  plugin.keys.updateDisplayCount();
}

window.plugin.keys.updateDisplayCount = function() {
  var guid = window.selectedPortal;
  var count = plugin.keys.keys[guid] || 0;
  $('#keys-count').html(count);
}

window.plugin.keys.addKey = function(addCount) {
  var guid = window.selectedPortal;
  var oldCount = plugin.keys.keys[guid];
  var newCount = Math.max((oldCount || 0) + addCount, 0);
  if(oldCount !== newCount) {
    if(newCount === 0) {
      delete plugin.keys.keys[guid];
      plugin.keys.updateQueue[guid] = null;
    } else {
      plugin.keys.keys[guid] = newCount;
      plugin.keys.updateQueue[guid] = newCount;
    }

    plugin.keys.storeLocal(plugin.keys.KEY);
    plugin.keys.storeLocal(plugin.keys.UPDATE_QUEUE);
    plugin.keys.updateDisplayCount();
    window.runHooks('pluginKeysUpdateKey', {guid: guid, count: newCount});
    plugin.keys.delaySync();
  }
}

// Delay the syncing to group a few updates in a single request
window.plugin.keys.delaySync = function() {
  if(!plugin.keys.enableSync) return;
  clearTimeout(plugin.keys.delaySync.timer);
  plugin.keys.delaySync.timer = setTimeout(function() {
      plugin.keys.delaySync.timer = null;
      window.plugin.keys.syncNow();
    }, plugin.keys.SYNC_DELAY);
}

// Store the updateQueue in updatingQueue and upload
window.plugin.keys.syncNow = function() {
  if(!plugin.keys.enableSync) return;
  $.extend(plugin.keys.updatingQueue, plugin.keys.updateQueue);
  plugin.keys.updateQueue = {};
  plugin.keys.storeLocal(plugin.keys.UPDATING_QUEUE);
  plugin.keys.storeLocal(plugin.keys.UPDATE_QUEUE);

  plugin.sync.updateMap('keys', 'keys', Object.keys(plugin.keys.updatingQueue));
}

// Call after IITC and all plugin loaded
window.plugin.keys.registerFieldForSyncing = function() {
  if(!window.plugin.sync) return;
  window.plugin.sync.registerMapForSync('keys', 'keys', window.plugin.keys.syncCallback, window.plugin.keys.syncInitialed);
}

// Call after local or remote change uploaded
window.plugin.keys.syncCallback = function(pluginName, fieldName, e, fullUpdated) {
  if(fieldName === 'keys') {
    plugin.keys.storeLocal(plugin.keys.KEY);
    // All data is replaced if other client update the data during this client offline, 
    // fire 'pluginKeysRefreshAll' to notify a full update
    if(fullUpdated) {
      plugin.keys.updateDisplayCount();
      window.runHooks('pluginKeysRefreshAll');
      return;
    }

    if(!e) return;
    if(e.isLocal) {
      // Update pushed successfully, remove it from updatingQueue
      delete plugin.keys.updatingQueue[e.property];
    } else {
      // Remote update
      delete plugin.keys.updateQueue[e.property];
      plugin.keys.storeLocal(plugin.keys.UPDATE_QUEUE);
      plugin.keys.updateDisplayCount();
      window.runHooks('pluginKeysUpdateKey', {guid: e.property, count: plugin.keys.keys[e.property]});
    }
  }
}

// syncing of the field is initialed, upload all queued update
window.plugin.keys.syncInitialed = function(pluginName, fieldName) {
  if(fieldName === 'keys') {
    plugin.keys.enableSync = true;
    if(Object.keys(plugin.keys.updateQueue).length > 0) {
      plugin.keys.delaySync();
    }
  }
}

window.plugin.keys.storeLocal = function(mapping) {
  if(typeof(plugin.keys[mapping.field]) !== 'undefined' && plugin.keys[mapping.field] !== null) {
    localStorage[mapping.key] = JSON.stringify(plugin.keys[mapping.field]);
  } else {
    localStorage.removeItem(mapping.key);
  }
}

window.plugin.keys.loadLocal = function(mapping) {
  var objectJSON = localStorage[mapping.key];
  if(!objectJSON) return;
  plugin.keys[mapping.field] = mapping.convertFunc 
                          ? mapping.convertFunc(JSON.parse(objectJSON))
                          : JSON.parse(objectJSON);
}

// For backward compatibility, will change to use loadLocal after a few version
window.plugin.keys.loadKeys = function() {
  var keysObjectJSON = localStorage[plugin.keys.KEY.key];
  if(!keysObjectJSON) return;
  var keysObject = JSON.parse(keysObjectJSON);
  // Move keys data up one level, it was {keys: keys_data} in localstorage in previous version
  plugin.keys.keys = keysObject.keys ? keysObject.keys : keysObject;
  if(keysObject.keys) plugin.keys.storeLocal(plugin.keys.KEY);
}

window.plugin.keys.setupCSS = function() {
  $("<style>")
    .prop("type", "text/css")
    .html("@@INCLUDESTRING:plugins/keys.css@@")
  .appendTo("head");
}

window.plugin.keys.setupContent = function() {
  plugin.keys.contentHTML = '<div id="keys-content-outer">'
                              + '<div id="keys-label" title="Problem? Point to the question mark!">Key(s):</div>'
                              + '<div id="keys-add" class="keys-button" '
                              + 'onclick="window.plugin.keys.addKey(-1);">'
                               + '<div class="keys-button-minus"></div>'
                              + '</div>'
                              + '<div id="keys-count" title="Problem? Point to the question mark!"></div>'
                              + '<div id="keys-subtract" class="keys-button" '
                              + 'onclick="window.plugin.keys.addKey(1);">'
                                + '<div class="keys-button-plus-v"></div>'
                                + '<div class="keys-button-plus-h"></div>'
                              + '</div>'
                              + '<div id="keys-help" title="You MUST manually input your count of keys!\n'
                              + 'This plugin CANNOT automatically get the keys from Ingress!">?</div>'
                          + '</div>';
  plugin.keys.disabledMessage = '<div id="keys-content-outer" title="Your browser do not support localStorage">Plugin Keys disabled</div>';
}

var setup =  function() {
  if($.inArray('pluginKeysUpdateKey', window.VALID_HOOKS) < 0)
    window.VALID_HOOKS.push('pluginKeysUpdateKey');
  if($.inArray('pluginKeysRefreshAll', window.VALID_HOOKS) < 0)
    window.VALID_HOOKS.push('pluginKeysRefreshAll');

  window.plugin.keys.setupCSS();
  window.plugin.keys.setupContent();
  window.plugin.keys.loadLocal(plugin.keys.UPDATE_QUEUE);
  window.plugin.keys.loadKeys();
  window.addHook('portalDetailsUpdated', window.plugin.keys.addToSidebar);
  window.addHook('iitcLoaded', window.plugin.keys.registerFieldForSyncing);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
