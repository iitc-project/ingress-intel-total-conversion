// ==UserScript==
// @name        IITC plugin: Import keys
// @namespace   dnc
// @description Import the list of portal keys from your inventory
// @include     https://www.ingress.com/intel*
// @include     http://www.ingress.com/intel*
// @include     https://m-dot-betaspike.appspot.com/handshake*
// @version     0.0.1
// @grant       none
// ==/UserScript==

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.importkeys = function() {};

window.plugin.importkeys.APPSPOT_URL = 'https://m-dot-betaspike.appspot.com';

window.plugin.importkeys.messageCallback = function(event) {
  console.log(event);
  if (event.origin !== window.plugin.importkeys.APPSPOT_URL) {
    return;
  }
  try {
    var object = window.JSON.parse(event.data);
    var dialog = document.getElementById('importkeysdialog');
    if (dialog && dialog.parentNode) {
      dialog.parentNode.removeChild(dialog);
    }
    localStorage[window.plugin.keys.LOCAL_STORAGE_KEY] = event.data;
    var keys = object['keys'];
    window.plugin.keys.keys = keys;
    window.plugin.keys.updateDisplayCount();
    var guids = Object.keys(keys);
    for (var i = 0; i < guids.length; i++) {
      window.runHooks('pluginKeysUpdateKey', {guid: guids[i], count: keys[guids[i]]});
    }
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
  var handshakeUrl = window.plugin.importkeys.APPSPOT_URL + '/handshake?json='
    + encodeURIComponent(window.JSON.stringify({'nemesisSoftwareVersion': '2013-05-03T19:32:11Z 929c2cce62eb opt', 'deviceSoftwareVersion': '4.1.1'}));
  var div = document.createElement('div');
  var span = document.createElement('span');
  span.appendChild(document.createTextNode('Log in below to import your Ingress inventory'));
  div.appendChild(span);
  var a = document.createElement('a');
  a.appendChild(document.createTextNode('Close window'));
  a.style.cssFloat = 'right';
  a.addEventListener('click', function(event) {
    document.body.removeChild(div);
  }, false);
  div.appendChild(a);
  var br = document.createElement('br');
  div.appendChild(br);
  var iframe = document.createElement('iframe');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.setAttribute('src', handshakeUrl);
  div.appendChild(iframe);
  div.style.position = 'fixed';
  div.style.width = '80%';
  div.style.height = '80%';
  div.style.top = '10%';
  div.style.left = '10%';
  div.style.zIndex = '9999';
  div.style.backgroundColor = 'white';
  div.setAttribute('id', 'importkeysdialog');
  // TODO: Look into dialog toolkit in use
  document.body.appendChild(div);
}

var setup = function() {
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

// EXTRA STUFF, SORRY GUYS /////////////////////////////////////////////
(function(){
function inventoryCallback(event)
{
  if (event.target.readyState == 4) {
    if (event.target.status == 200) {
      var json_text = event.target.response;
      var result = window.JSON.parse(json_text);
      var inventory = result['gameBasket']['inventory'];
      var hash = {};
      for (var i = 0; i < inventory.length; i++) {
        if (inventory[i][2]['portalCoupler']) {
          var guid = inventory[i][2]['portalCoupler']['portalGuid'];
          if (hash[guid]) {
            hash[guid]++;
          } else {
            hash[guid] = 1;
          }
        }
      }
      var uniqueCount = Object.keys(hash).length;
      var json_out = window.JSON.stringify({'keys':hash});
      window.top.postMessage(json_out, 'http://www.ingress.com');
    } else {
      alert('An error was received from the server\n' + event.target.statusText);
    }
  }
}

if (window.location.host == 'm-dot-betaspike.appspot.com') {
  if (window.location.pathname == '/handshake') {
    console.log('Starting request', window.location, window.referrer);
    var xsrf;
    var re_match = document.body.innerHTML.match(/"xsrfToken":"((?:\\"|[^"])*)"/);
    if (!re_match) {
      alert("Error: Couldn't parse XSRF Token from Ingress handshake reply");
      xsrf = '';
    } else {
      xsrf = re_match[1];
    }
    var xhr = new XMLHttpRequest();
    var url = 'https://m-dot-betaspike.appspot.com/rpc/playerUndecorated/getInventory';
    var params = {'lastQueryTimestamp': 0};
    var body = window.JSON.stringify({'params': params});
    xhr.onreadystatechange = inventoryCallback;
    xhr.open('POST', url, true);
    xhr.setRequestHeader('X-XsrfToken', xsrf);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.setRequestHeader('Accept-Encoding', 'gzip');
    xhr.setRequestHeader('User-Agent', 'Nemesis (gzip)');
    xhr.send(body);
  }
}
})();