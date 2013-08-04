// ==UserScript==
// @id             iitc-inventory-import@qnstie
// @name           IITC plugin: Import player inventory from Niantic API
// @category       Inventory
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Imports automatically the player's inventory. Uses unsafe, cross-domain access methods to access Niantic API. Bases on work by https://github.com/divergentdave, but uses a complately different approach for API access. Provides pluggable handler mechanism for other plugins to do something with the inventory.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          GM_xmlhttpRequest
// @grant          unsafeWindow
// @grant          GM_openInTab
// ==/UserScript==



@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////
	if(typeof window.plugin.inventory !== 'function') window.plugin.inventory = function() {};
	
	// use own namespace for plugin
	window.plugin.inventory.import = function() {};
	
	window.plugin.inventory.import.handlers = [];
	
	window.plugin.inventory.import.addHandler = function(handler) {
		if (typeof handler == 'function') {
			window.plugin.inventory.import.handlers.push(handler);
		}
	};
	
	window.plugin.inventory.import.messageCallback = function(event) {
		if (typeof event.data.inventory_json == 'undefined') {
			return;
		}
        
		try {
			var result = JSON.parse(event.data.inventory_json);
			var inventory = result.gameBasket.inventory;

			if (window.plugin.inventory.import.handlers.length == 0) {
				alert('Inventory import was successful, but no inventory handlers are defined.\nPlease install inventory handler plugins of your choice');
				return;
			} else {
				window.plugin.inventory.import.message('Inventory import was successful - running inventory handlers');
			}
			
			for (handler in window.plugin.inventory.import.handlers) {
				window.plugin.inventory.import.handlers[handler](inventory);
			}
		} catch (e) {
			alert('Error executing inventory handlers\n' + e);
		}
	};
	
	window.plugin.inventory.import.askForInventory = function(event) {
		window.plugin.inventory.import.message("Importing inventory - please wait");
        window.inventoryImportInventoryRequest = true;
	};
	
	var setup = function() {
		$('head').append('<style>' +
		'.ui-dialog-import-inventory { max-width: 300px !important; width: auto !important; }' +
		'</style>');
		window.addEventListener('message', window.plugin.inventory.import.messageCallback, false);
		var a = document.createElement('a');
		a.appendChild(document.createTextNode('Import inventory'));
		a.setAttribute('title', 'Import your Ingress inventory');
		a.addEventListener('click', window.plugin.inventory.import.askForInventory, false);
		document.getElementById('toolbox').appendChild(a);
        
        window.inventoryImportInventoryRequest = false;
		
		$('body').append('<div id="invImpDial" title="Inventory import message"></div>');
	};
	
	window.plugin.inventory.import.message = function(msg, timeout) {
        timeout = timeout || 10000;
		msg = $( "#invImpDial" ).html() + "<br/>" + msg;
		$( "#invImpDial" ).html(msg).dialog({
			open: function(event, ui){
				setTimeout("$('#invImpDial').html('').dialog('close')", timeout);
			}
		});
	}
	
// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@

// Niantic API access code follows.
// Will be executed in GreaseMonkey/Tampermonkey sandbox when window.inventoryImportInventoryRequest in the IITC windows is set to true

window.setInterval(function(){
    if (typeof unsafeWindow.inventoryImportInventoryRequest != 'undefined' && unsafeWindow.inventoryImportInventoryRequest == true) {
        unsafeWindow.inventoryImportInventoryRequest = false;
        inventoryImportGetInventory();
    }
}, 300);    
    
var inventoryImportGetInventory = function() {
	var APPSPOT_URL = 'https://m-dot-betaspike.appspot.com';
    
    var handshakeUrl = APPSPOT_URL + '/handshake?json='
    + encodeURIComponent(JSON.stringify({'nemesisSoftwareVersion': '2013-07-29T18:57:27Z 7af0d9a744b7 opt', 'deviceSoftwareVersion': '4.1.1'}));
    
    console.log("Trying to access Niantic API at "+handshakeUrl);
    
    GM_xmlhttpRequest({
        method: "GET",
        url: handshakeUrl,
        onload: function(response) {
            var xsrf = '';
            var re_match = response.responseText.match(/"xsrfToken":"((?:\\"|[^"])*)"/);
            if (!re_match) {
				if (response.responseText.match("CLIENT_MUST_UPGRADE")!=null) {
					alert("Error: Niantic has recently updated the server.\nThis version of the plugin cannot support it yet.\nPlease try to update the plugin or wait patiently for an automated update!");
                    console.log("Incorrect server version while processing handshake with Niantic API");
				} else if ((response.responseText.substring(0, 15)==='<!DOCTYPE html>') || (response.responseText.match("Google Accounts")!=null)) {
					alert("You need to log-in to the Niantic API in order to access your inventory.\nPlease log-in to Google Apps using your Google account\nthen close the page and sync the inventory again.\nThe login page will open in a new tab.");
					console.log("User logged out of Niantic API. Redirecting to Google Accounts login page");
					GM_openInTab(handshakeUrl);
				} else {
					alert("Error: Couldn't understand Niantic API response.\nSee Javascript console log for details.");
                    console.log("Error: Couldn't parse XSRF Token from Ingress handshake reply. Response text: "+response.responseText);
				}
            } else {
                xsrf = re_match[1];
                
                var params = {'lastQueryTimestamp': 0};
                var body = JSON.stringify({'params': params});
                
                console.log("XSRF Token retrieved, retrieving inventory form Niantic API");
                
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: 'https://m-dot-betaspike.appspot.com/rpc/playerUndecorated/getInventory',
                    data: body,
                    headers: {'X-XsrfToken': xsrf,
                              'Content-Type': 'application/json;charset=UTF-8',
                              'Accept-Encoding': 'gzip',
                              'User-Agent': 'Nemesis (gzip)'},
                    onload: inventoryImportCallback
                });
            }
        }});
};   
var inventoryImportCallback = function(response) {
    if (response.status == 200) {
        console.log('Inventory retrieved OK, calling handlers');
        var msg = {'inventory_json': response.responseText};
        window.top.postMessage(msg, 'http://www.ingress.com/');
        window.top.postMessage(msg, 'https://www.ingress.com/');
    } else {
        alert('An error was received from the server\n' + event.target.status + ' ' + event.target.statusText);
    }
};
