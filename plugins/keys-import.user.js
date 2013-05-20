// ==UserScript==
// @id          iitc-plugin-keys-import@dnc
// @name        IITC plugin: Import keys
// @version     0.0.1@@DATETIMEVERSION@@
// @namespace   https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL   @@UPDATEURL@@
// @downloadURL @@DOWNLOADURL@@
// @description [@@BUILDNAME@@-@@BUILDDATE@@] Import the list of portal keys from your inventory. Install the 'Keys' plugin first.
// @include     https://www.ingress.com/intel*
// @include     http://www.ingress.com/intel*
// @include     https://m-dot-betaspike.appspot.com/handshake*
// @match       https://www.ingress.com/intel*
// @match       http://www.ingress.com/intel*
// @match       https://m-dot-betaspike.appspot.com/handshake*
// @grant       none
// ==/UserScript==

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.importkeys = function() {};

window.plugin.importkeys.APPSPOT_URL = 'https://m-dot-betaspike.appspot.com';

window.plugin.importkeys._dialog = null;

window.plugin.importkeys.messageCallback = function(event) {
  if (event.origin !== window.plugin.importkeys.APPSPOT_URL) {
    return;
  }
  try {
    var object = window.JSON.parse(event.data);
    localStorage[window.plugin.keys.LOCAL_STORAGE_KEY] = event.data;
    if (window.plugin.importkeys._dialog) {
      $(window.plugin.importkeys._dialog).dialog('close');
      window.plugin.importkeys._dialog = null;
    }
    window.plugin.keys.keys = object['keys'];
    window.plugin.keys.updateDisplayCount();
    window.runHooks('pluginKeysRefreshAll');
    alert('Inventory import was successful');
  } catch (e) {
    alert('There was an error parsing the inventory data\n' + e);
  }
};

window.plugin.importkeys.openDialog = function(event) {
  if (!window.plugin.keys) {
    alert('Error: The Keys plugin must be installed before using the Import Keys plugin');
    return;
  }
  if (window.plugin.importkeys._dialog) {
    return;
  }
  var handshakeUrl = window.plugin.importkeys.APPSPOT_URL + '/handshake?json='
    + encodeURIComponent(window.JSON.stringify({'nemesisSoftwareVersion': '2013-05-03T19:32:11Z 929c2cce62eb opt', 'deviceSoftwareVersion': '4.1.1'}));
  var div = document.createElement('div');
  var span = document.createElement('span');
  span.appendChild(document.createTextNode('Log in below to import your Ingress inventory'));
  div.appendChild(span);
  var br = document.createElement('br');
  div.appendChild(br);
  var iframe = document.createElement('iframe');
  iframe.style.width = '300px';
  iframe.style.height = '200px';
  iframe.setAttribute('src', handshakeUrl);
  div.appendChild(iframe);
  var html = div.innerHTML;
  var dialog = window.dialog({
    html: html,
    title: 'Import Keys',
    dialogClass: 'ui-dialog-import-keys',
    id: 'import-keys-dialog',
    closeCallback: function() {
      window.plugin.importkeys._dialog = null;
    }
  });
  window.plugin.importkeys._dialog = dialog;
}

var setup = function() {
  $('head').append('<style>' +
    '.ui-dialog-import-keys { max-width: 800px !important; width: auto !important; }' +
    '</style>');
  window.addEventListener('message', window.plugin.importkeys.messageCallback, false);
  var a = document.createElement('a');
  a.appendChild(document.createTextNode('Import keys'));
  a.setAttribute('title', 'Import all the portal keys from your Ingress inventory');
  a.addEventListener('click', window.plugin.importkeys.openDialog, false);
  document.getElementById('toolbox').appendChild(a);
};

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

@@INCLUDERAW:plugins/keys-import-inject.js@@

