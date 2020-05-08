
// ==UserScript==
// @id             iitc-plugin-keys@xelio
// @name           IITC plugin: Keys
// @category       Keys
// @version        0.3.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Allow manual entry of key counts for each portal. Use the 'keys-on-map' plugin to show the numbers on the map, and 'sync' to share between multiple browsers or desktop/mobile.
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @include        https://*.ingress.com/mission/*
// @include        http://*.ingress.com/mission/*
// @match          https://*.ingress.com/mission/*
// @match          http://*.ingress.com/mission/*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.keys = function() {};

// delay in ms
window.plugin.keys.SYNC_DELAY = 5000;

window.plugin.keys.LOCAL_STORAGE_KEY = 'plugin-keys-data';

window.plugin.keys.KEY = {key: 'plugin-keys-data', field: 'keys'};
window.plugin.keys.UPDATE_QUEUE = {key: 'plugin-keys-data-queue', field: 'updateQueue'};
window.plugin.keys.UPDATING_QUEUE = {key: 'plugin-keys-data-updating-queue', field: 'updatingQueue'};

// Counter for the Capsule index
window.plugin.keys.CapsuleIndex=0
// Max number of Capsules
window.plugin.keys.MaxNCapsules=11;

// The keys variables are array of sets
// each set corresponds to a Capsule
// CapsuleIndex=0 corresponds to the total of all portal keys in all capsules
// CapsuleIndex=i (!=0) corresponds to the portal keys in the ith capsule
window.plugin.keys.keys = [];
window.plugin.keys.updateQueue = [];
window.plugin.keys.updatingQueue = [];

for(i = 0; i < plugin.keys.MaxNCapsules; i++) {
  window.plugin.keys.keys[i] = {"TOTAL":0};
  window.plugin.keys.updateQueue[i] = {"TOTAL":0};
  window.plugin.keys.updatingQueue[i] = {"TOTAL":0};
}

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
  var count = plugin.keys.keys[plugin.keys.CapsuleIndex][guid] || 0;
  $('#keys-count').html(count);
  // Optional Code for users who aquired the Key Lockers
  switch (plugin.keys.CapsuleIndex) {
    case 0:
        $('#Capsule-count').html("All");
        break;
    case 1:
        $('#Capsule-count').html("G");
        break;
    case 2:
        $('#Capsule-count').html("B");
        break;
    case 3:
        $('#Capsule-count').html("W");
        break;
    case 4:
        $('#Capsule-count').html("R");
        break;
    case 5:
        $('#Capsule-count').html("Y");
        break;
    default:
        $('#Capsule-count').html(plugin.keys.CapsuleIndex);
        break;
  }
  $('#Total-count').html(plugin.keys.keys[plugin.keys.CapsuleIndex]['TOTAL'] ||0 );
}

// To change the Capsule Index
window.plugin.keys.addCapsuleIndex = function(addCount) {
  plugin.keys.CapsuleIndex=Math.min(Math.max(plugin.keys.CapsuleIndex + addCount, 0),plugin.keys.MaxNCapsules-1);
  plugin.keys.updateDisplayCount();
  window.runHooks('pluginKeysRefreshAll');
}


window.plugin.keys.addKey = function(addCount, guid) {
  // If the (CapsuleIndex === 0) no manual changes should be done for the "ALL Capsule" array
  if (plugin.keys.CapsuleIndex === 0) return;

  if(guid == undefined) guid = window.selectedPortal;
  // The oldCount at the current CapsuleIndex
  var oldCount = (plugin.keys.keys[plugin.keys.CapsuleIndex][guid]|| 0);
  var newCount = Math.max(oldCount + addCount, 0);

  if(oldCount !== newCount) {
    if(newCount === 0) {
      delete plugin.keys.keys[plugin.keys.CapsuleIndex][guid];
      plugin.keys.updateQueue[plugin.keys.CapsuleIndex][guid] = null;
    } else {
      plugin.keys.keys[plugin.keys.CapsuleIndex][guid] = newCount
      plugin.keys.updateQueue[plugin.keys.CapsuleIndex][guid] = newCount;
    }
    // Update the ALL Capsule (CapsuleIndex=0)
    plugin.keys.keys[0][guid] = (plugin.keys.keys[0][guid] || 0) +newCount-oldCount;
    plugin.keys.updateQueue[0][guid] = plugin.keys.keys[0][guid];

    if (plugin.keys.keys[0][guid]==0){
      delete plugin.keys.keys[0][guid];
      plugin.keys.updateQueue[0][guid] = null;
    }

    plugin.keys.keys[plugin.keys.CapsuleIndex]['TOTAL']=plugin.keys.keys[plugin.keys.CapsuleIndex]['TOTAL']+newCount-oldCount;
    plugin.keys.keys[0]['TOTAL']=plugin.keys.keys[0]['TOTAL']+newCount-oldCount;

    plugin.keys.updateQueue[plugin.keys.CapsuleIndex]['TOTAL']=plugin.keys.updateQueue[plugin.keys.CapsuleIndex]['TOTAL']+newCount-oldCount;
    plugin.keys.updateQueue[0]['TOTAL']=plugin.keys.updateQueue[0]['TOTAL']+newCount-oldCount;

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
  window.plugin.keys.updateQueue = [];
  for (i = 0; i < plugin.keys.MaxNCapsules; i++) {
    window.plugin.keys.updateQueue[i] = {"TOTAL":0};
  }
  plugin.keys.storeLocal(plugin.keys.UPDATING_QUEUE);
  plugin.keys.storeLocal(plugin.keys.UPDATE_QUEUE);

  // Here we should submit the array to the sync plugin
  plugin.sync.updateMap('keys', 'keys', plugin.keys.updatingQueue);
}

// Call after IITC and all plugin loaded
window.plugin.keys.registerFieldForSyncing = function() {
  if(!window.plugin.sync) return;
  window.plugin.sync.registerMapForSync('keys', 'keys', window.plugin.keys.syncCallback, window.plugin.keys.syncInitialed);
}

// Call after local or remote change uploaded
// Just added the CapsuleInd variable to update the proper capsule
window.plugin.keys.syncCallback = function(pluginName, fieldName, e, CapsuleInd, fullUpdated) {
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
      delete plugin.keys.updatingQueue[CapsuleInd][e.property];
    } else {
      // Remote update
      delete plugin.keys.updateQueue[CapsuleInd][e.property];
      plugin.keys.storeLocal(plugin.keys.UPDATE_QUEUE);
      plugin.keys.updateDisplayCount();
      window.runHooks('pluginKeysUpdateKey', {guid: e.property, count: plugin.keys.keys[CapsuleInd][e.property]});
    }
  }
}

// syncing of the field is initialed, upload all queued update
window.plugin.keys.syncInitialed = function(pluginName, fieldName) {
  if(fieldName === 'keys') {
    plugin.keys.enableSync = true;
    if(Object.keys(plugin.keys.updateQueue[0]).length > 0) {
      plugin.keys.delaySync();
    }
  }
}

window.plugin.keys.storeLocal = function(mapping) {
  if(typeof(plugin.keys[mapping.field]) !== 'undefined' && plugin.keys[mapping.field] !== null) {
    var len=plugin.keys[mapping.field].length
    // The "ALL Capsule" (CapsuleIndex=0) is not stored but it will be constructed again when loading keys
    localStorage[mapping.key] = JSON.stringify(plugin.keys[mapping.field].slice(1,len));
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
  if(plugin.keys[mapping.field].length==0) {
    plugin.keys[mapping.field][0]={"TOTAL":0};
  } else {
    plugin.keys[mapping.field].splice(0 , 0, {});
    plugin.keys[mapping.field][0]=Object.assign({}, plugin.keys[mapping.field][1]);
    for(i = 2; i < plugin.keys[mapping.field].length; i++) {
      plugin.keys[mapping.field][0] = window.plugin.keys.mergeKeys(plugin.keys[mapping.field][0] , plugin.keys[mapping.field][i]);
    }
  }
}

// For backward compatibility, will change to use loadLocal after a few version
// window.plugin.keys.loadKeys = function() {
//   var keysObjectJSON = localStorage[plugin.keys.KEY.key];
//   if(!keysObjectJSON) return;
//   var keysObject = JSON.parse(keysObjectJSON);
//   // Move keys data up one level, it was {keys: keys_data} in localstorage in previous version
//   plugin.keys.keys = keysObject.keys ? keysObject.keys : keysObject;
//   if(keysObject.keys) plugin.keys.storeLocal(plugin.keys.KEY);
// }

window.plugin.keys.setupCSS = function() {
  $("<style>")
    .prop("type", "text/css")
    .html("@@INCLUDESTRING:plugins/keys.css@@")
    .appendTo("head");
}

window.plugin.keys.setupContent = function() {
  plugin.keys.contentHTML = '<div id="keys-content-outer">'
                              + '<div id="Capsule-add" class="Capsule-button" '
                              + 'onclick="window.plugin.keys.addCapsuleIndex(-1);">'
                               + '<div class="Capsule-button-minus"></div> </div>'
                              + '<div id="Capsule-count" title="Choose a Capsule"></div>'
                              + '<div id="Capsule-subtract" class="Capsule-button" '
                              + 'onclick="window.plugin.keys.addCapsuleIndex(1);">'
                               + '<div class="Capsule-button-plus-v"></div>'
                               + '<div class="Capsule-button-plus-h"></div> </div>'
                              + '<div>  &nbsp&nbsp&nbsp </div>'
                              // + '<div id="keys-label" title="Problem? Point to the question mark!">Key(s):</div>'
                              + '<div id="keys-add" class="keys-button" '
                              + 'onclick="window.plugin.keys.addKey(-1);">'
                               + '<div class="keys-button-minus"></div>'
                              + '</div>'
                              + '<div id="keys-count" title="Number of keys for this Portal in Capsule"></div>'
                              + '<div id="keys-subtract" class="keys-button" '
                              + 'onclick="window.plugin.keys.addKey(1);">'
                                + '<div class="keys-button-plus-v"></div>'
                                + '<div class="keys-button-plus-h"></div>'
                              + '</div>'
                              + '<div>  &nbsp&nbsp&nbsp </div>'
                              + '<div id="Total-count" title="Total number of keys in Capsule"></div>'
                              // These are commented just to save space in the Tab
                              // + '<div id="keys-help" title="You MUST manually input your count of keys!\n'
                              // + 'This plugin CANNOT automatically get the keys from Ingress!">?</div>'
                          + '</div>';
  plugin.keys.disabledMessage = '<div id="keys-content-outer" title="Your browser do not support localStorage">Plugin Keys disabled</div>';
}

window.plugin.keys.setupPortalsList = function() {
  if(!window.plugin.portalslist) return;

  window.addHook('pluginKeysUpdateKey', function(data) {
    $('[data-list-keycount="'+data.guid+'"]').text(data.count);
  });

  window.addHook('pluginKeysRefreshAll', function() {
    $('[data-list-keycount]').each(function(i, element) {
      var guid = element.getAttribute("data-list-keycount");
      $(element).text(plugin.keys.keys[plugin.keys.CapsuleIndex][guid] || 0);
    });
  });

  window.plugin.portalslist.fields.push({
    title: "Keys",
    value: function(portal) { return portal.options.guid; }, // we store the guid, but implement a custom comparator so the list does sort properly without closing and reopening the dialog
    sort: function(guidA, guidB) {
      var keysA = plugin.keys.keys[plugin.keys.CapsuleIndex][guidA] || 0;
      var keysB = plugin.keys.keys[plugin.keys.CapsuleIndex][guidB] || 0;
      return keysA - keysB;
    },
    format: function(cell, portal, guid) {
      $(cell)
        .addClass("alignR portal-list-keys ui-dialog-buttonset") // ui-dialog-buttonset for proper button styles
        .append($('<span>')
          .text(plugin.keys.keys[plugin.keys.CapsuleIndex][guid] || 0)
          .attr({
            "class": "value",
            "data-list-keycount": guid
          }));
      // for some reason, jQuery removes event listeners when the list is sorted. Therefore we use DOM's addEventListener
      $('<button>')
        .text('+')
        .addClass("plus")
        .appendTo(cell)
        [0].addEventListener("click", function() { window.plugin.keys.addKey(1, guid); }, false);
      $('<button>')
        .text('-')
        .addClass("minus")
        .appendTo(cell)
        [0].addEventListener("click", function() { window.plugin.keys.addKey(-1, guid); }, false);
    },
  });
}

var setup =  function() {
  if($.inArray('pluginKeysUpdateKey', window.VALID_HOOKS) < 0)
    window.VALID_HOOKS.push('pluginKeysUpdateKey');
  if($.inArray('pluginKeysRefreshAll', window.VALID_HOOKS) < 0)
    window.VALID_HOOKS.push('pluginKeysRefreshAll');

  window.plugin.keys.setupCSS();
  window.plugin.keys.setupContent();
  // For backward compatibility, the loadLocal function can be changed to copy the old
  // portal keys in one of the sets of the array
  window.plugin.keys.loadLocal(plugin.keys.KEY);
  window.plugin.keys.loadLocal(plugin.keys.UPDATE_QUEUE);
  // window.plugin.keys.loadKeys();
  window.addHook('portalDetailsUpdated', window.plugin.keys.addToSidebar);
  window.addHook('iitcLoaded', window.plugin.keys.registerFieldForSyncing);

  if(window.plugin.portalslist) {
    window.plugin.keys.setupPortalsList();
  } else {
    setTimeout(function() {
      if(window.plugin.portalslist)
        window.plugin.keys.setupPortalsList();
    }, 500);
  }
}

window.plugin.keys.mergeKeys = function(obj, src) {
  for(var key in src){
    if (src.hasOwnProperty(key)) obj[key] = (obj[key]||0) + src[key];
  }
  return obj;
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
