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
  var keysObjectJSON = localStorage[plugin.keys.LOCAL_STORAGE_KEY];
  if(!keysObjectJSON) return;
  var keysObject = JSON.parse(keysObjectJSON);
  plugin.keys.keys = keysObject.keys;
}

window.plugin.keys.setupCSS = function() {
  $("<style>")
    .prop("type", "text/css")
    .html("\n#ap-list {\n  color: #ffce00;\n  font-size: 90%;\n  padding: 4px 2px;\n}\n\n#ap-list-side-labels {\n  display: inline-block;\n  width: 90%;\n}\n\n#ap-list-eny {\n  display: inline-block;\n  text-align: center;\n  width: 50%;\n  opacity: 1.0;\n}\n\n#ap-list-frd {\n  display: inline-block;\n  text-align: center;\n  width: 50%;\n  opacity: 0.5;\n}\n\n#ap-list-reload {\n  display: inline-block;\n  text-align: right;\n  width: 10%;\n}\n\n#ap-list-table {\n  width: 100%;\n  table-layout:fixed;\n}\n\n.ap-list-td-checkbox {\n  width: 18px;\n  height: 1px;\n}\n\n.ap-list-td-link {\n  overflow:hidden;\n  white-space:nowrap;\n}\n\n.ap-list-td-link-eny {\n}\n\n.ap-list-td-link-frd {\n}\n\n.ap-list-td-ap {\n  width: 44px;\n  white-space:nowrap;\n}\n\n.ap-list-td-eff-lv {\n  width: 20px;\n}\n\n.ap-list-checkbox-outer {\n  display: table;\n  height: 100%;\n  width: 100%;\n}\n\n.ap-list-checkbox-inner {\n  display: table-cell;\n  vertical-align: middle;\n  text-align: center;\n  width: 12px;\n  height: 12px;\n  border: 1px solid rgb(32, 168, 177);\n  margin: 0 auto;\n}\n\n.ap-list-checkbox-selected {\n  background-color: rgb(32, 168, 177);\n}\n\n.ap-list-checkbox-header {\n  width: 8px;\n  height: 0px;\n  margin: auto;\n  border: 1px solid rgb(32, 168, 177);\n}\n\n.ap-list-link {\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n\n.ap-list-link-selected {\n  font-style:italic;\n}\n\n.ap-list-center-div {\n  width: 55%;\n  margin: 0px auto;\n}\n\n.ap-list-page-control {\n  float:left;\n  padding: 0 5px;\n}\n\n.ap-list-page-text {\n  float:left;\n  text-align: center;\n  color: rgb(32, 168, 177);\n}\n\n#ap-list-current-p {\n  width: 20px;\n}\n\n#ap-list-total-p {\n  width: 20px;\n}\n\n.ap-list-triangle {\n  float:left;\n  clear:none;\n  border-style:solid;\n}\n\n.ap-list-triangle-left {\n  border-color: transparent rgb(32, 168, 177) transparent transparent;\n}\n\n.ap-list-triangle-left-half {\n  border-width: 7.5px 7.5px 7.5px 0px;\n}\n\n.ap-list-triangle-left-full {\n  border-width: 7.5px 13px 7.5px 0px;\n}\n\n.ap-list-triangle-right {\n  border-color: transparent transparent transparent rgb(32, 168, 177);\n}\n\n.ap-list-triangle-right-half {\n  border-width: 7.5px 0px 7.5px 7.5px;\n}\n\n.ap-list-triangle-right-full {\n  border-width: 7.5px 0px 7.5px 13px;\n}\n#ap-list-pagination {\n  display: inline-block;\n  width: 90%;\n  vertical-align: bottom;\n}\n\n#ap-list-misc-info {\n  display: inline-block;\n  vertical-align: bottom;\n  padding: 0px 6px;\n}\n")
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
