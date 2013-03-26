// ==UserScript==
// @id             iitc-plugin-keys@xelio
// @name           IITC plugin: Keys
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Store portal keys
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
window.plugin.keys = function() {};

window.plugin.keys.LOCAL_STORAGE_KEY = 'plugin-keys-data';

window.plugin.keys.keys = {};
window.plugin.keys.disabledMessage;
window.plugin.keys.contentHTML;

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
    } else {
      plugin.keys.keys[guid] = newCount;
    }
    plugin.keys.storeKeys();
    plugin.keys.updateDisplayCount();
    window.runHooks('pluginKeysUpdateKey', {guid: guid, count: newCount});
  }
}

window.plugin.keys.storeKeys = function() {
  var keysObject = {keys: plugin.keys.keys};
  var keysObjectJSON = JSON.stringify(keysObject);
  localStorage[plugin.keys.LOCAL_STORAGE_KEY] = keysObjectJSON;
}

window.plugin.keys.loadKeys = function() {
  var keysObjectJSON = localStorage[plugin.keys.LOCAL_STORAGE_KEY]
  var keysObject = JSON.parse(keysObjectJSON);
  plugin.keys.keys = keysObject.keys;
}

window.plugin.keys.setupCSS = function() {
  $("<style>")
    .prop("type", "text/css")
    .html("@@INCLUDESTRING:plugins/keys.css@@")
  .appendTo("head");
}

window.plugin.keys.setupContent = function() {
  plugin.keys.contentHTML = '<div id="keys-content-outer">'
                              + '<div id="keys-label">Key(s):</div>'
                              + '<div id="keys-add" class="keys-button" '
                              + 'onclick="window.plugin.keys.addKey(-1);">'
                               + '<div class="keys-button-minus"></div>'
                              + '</div>'
                              + '<div id="keys-count"></div>'
                              + '<div id="keys-subtract" class="keys-button" '
                              + 'onclick="window.plugin.keys.addKey(1);">'
                                + '<div class="keys-button-plus-v"></div>'
                                + '<div class="keys-button-plus-h"></div>'
                              + '</div>'
                          + '</div>';
  plugin.keys.disabledMessage = '<div id="keys-content-outer" title="Your browser do not support localStorage">Plugin Keys disabled</div>';
}

var setup =  function() {
  if($.inArray('pluginKeysUpdateKey', window.VALID_HOOKS) < 0)
    window.VALID_HOOKS.push('pluginKeysUpdateKey');

  window.plugin.keys.setupCSS();
  window.plugin.keys.setupContent();
  window.plugin.keys.loadKeys();
  window.addHook('portalDetailsUpdated', window.plugin.keys.addToSidebar);
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
