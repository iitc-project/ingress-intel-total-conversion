// ==UserScript==
// @id             iitc-inventory-import-keys@qnstie
// @name           IITC plugin: Import keys from inventory (a plugin for iitc-inventory-import)
// @category       Inventory
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Imports keys from player's inventory and syncs them with Keys plugin.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// ==/UserScript==



function wrapper() {
	// ensure plugin framework is there, even if iitc is not yet imported
	if(typeof window.plugin !== 'function') window.plugin = function() {};
	if(typeof window.plugin.inventory !== 'function') window.plugin.inventory = function() {};
	if(typeof window.plugin.inventory.import !== 'function') window.plugin.inventory.import = function() {};
	
	
	// PLUGIN START ////////////////////////////////////////////////////////
	
	// use own namespace for plugin
	window.plugin.inventory.import.keys = function() {};
	
	window.plugin.inventory.import.keys.handler = function(inventory) {
		try {
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
			var keys_json = JSON.stringify({'keys':hash});

			localStorage[window.plugin.keys.LOCAL_STORAGE_KEY] = keys_json;
			window.plugin.keys.keys = hash;
			window.plugin.keys.updateDisplayCount();
			window.runHooks('pluginKeysRefreshAll');
			window.plugin.inventory.import.message('Key list updated from your inventory');
		} catch (e) {
			alert('There was an error parsing the inventory data\n' + e);
		}
	};

	var setup =  function() {
		window.plugin.inventory.import.addHandler(window.plugin.inventory.import.keys.handler);
	}
	
	// PLUGIN END //////////////////////////////////////////////////////////
	
	if(window.iitcimported && typeof setup === 'function') {
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