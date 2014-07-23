// ==UserScript==
// @id             iitc-plugin-uniques@3ch01c
// @name           IITC plugin: Uniques
// @category       Misc
// @version        0.2.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/3ch01c/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Allow manual entry of portals visited/captured. Use the 'highlighter-uniques' plugin to show the uniques on the map, and 'sync' to share between multiple browsers or desktop/mobile.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@
//PLUGIN START ////////////////////////////////////////////////////////

//use own namespace for plugin
window.plugin.uniques = function() {};

//delay in ms
window.plugin.uniques.SYNC_DELAY = 10000;

window.plugin.uniques.LOCAL_STORAGE_KEY = 'plugin-uniques-data';

window.plugin.uniques.KEY = {key: window.plugin.uniques.LOCAL_STORAGE_KEY, field: 'uniques'};
window.plugin.uniques.UPDATE_QUEUE = {key: 'plugin-uniques-data-queue', field: 'updateQueue'};
window.plugin.uniques.UPDATING_QUEUE = {key: 'plugin-uniques-data-updating-queue', field: 'updatingQueue'};

window.plugin.uniques.uniques = {};
window.plugin.uniques.updateQueue = {};
window.plugin.uniques.updatingQueue = {};

window.plugin.uniques.enableSync = false;

window.plugin.uniques.disabledMessage = null;
window.plugin.uniques.contentHTML = null;

window.plugin.uniques.onPortalDetailsUpdated = function() {
	if(typeof(Storage) === "undefined") {
		$('#portaldetails > .imgpreview').after(plugin.uniques.disabledMessage);
		return;
	}

	var guid = window.selectedPortal,
		details = portalDetail.get(guid),
		nickname = window.PLAYER.nickname;
	if(details) {
		if(details.owner == nickname) {
			plugin.uniques.updateCaptured(true);
			// no further logic required
		} else {
			function installedByPlayer(entity) {
				return entity && entity.owner == nickname;
			}
			
			if(details.resonators.some(installedByPlayer) || details.mods.some(installedByPlayer)) {
				plugin.uniques.updateVisited(true);
			}
		}
	}

	$('#portaldetails > .imgpreview').after(plugin.uniques.contentHTML);
	plugin.uniques.updateChecked();
}

window.plugin.uniques.updateChecked = function() {
	var guid = window.selectedPortal,
		uniqueInfo = plugin.uniques.uniques[guid];
		visited = (uniqueInfo && uniqueInfo.visited) || false,
		captured = (uniqueInfo && uniqueInfo.captured) || false;
	$('#visited').prop('checked', visited);
	$('#captured').prop('checked', captured);
	plugin.uniques.highlight({portal: portals[guid]});
}

window.plugin.uniques.updateVisited = function(visited) {
	var guid = window.selectedPortal;
	var uniqueInfo = plugin.uniques.uniques[guid];
	if (!uniqueInfo) {
		plugin.uniques.uniques[guid] = uniqueInfo = {
			visited: false,
			captured: false
		};
	}

	if (visited) {
		uniqueInfo.visited = true;
	} else { // not visited --> not captured
		uniqueInfo.visited = false;
		uniqueInfo.captured = false;
	}

	plugin.uniques.updateChecked();
	plugin.uniques.storeLocal(plugin.uniques.KEY);
	plugin.uniques.storeLocal(plugin.uniques.UPDATE_QUEUE);
	plugin.uniques.delaySync();
}

window.plugin.uniques.updateCaptured = function(captured) {
	var guid = window.selectedPortal;
	var uniqueInfo = plugin.uniques.uniques[guid];
	if (!uniqueInfo) {
		plugin.uniques.uniques[guid] = uniqueInfo = {
			visited: false,
			captured: false
		};
	}

	if (captured) { // captured --> visited
		uniqueInfo.captured = true;
		uniqueInfo.visited = true;
	} else {
		uniqueInfo.captured = false;
	}

	plugin.uniques.updateChecked();
	plugin.uniques.storeLocal(plugin.uniques.KEY);
	plugin.uniques.storeLocal(plugin.uniques.UPDATE_QUEUE);
	plugin.uniques.delaySync();
}

//Delay the syncing to group a few updates in a single request
window.plugin.uniques.delaySync = function() {
	if(!plugin.uniques.enableSync) return;
	clearTimeout(plugin.uniques.delaySync.timer);
	plugin.uniques.delaySync.timer = setTimeout(function() {
		plugin.uniques.delaySync.timer = null;
		window.plugin.uniques.syncNow();
	}, plugin.uniques.SYNC_DELAY);
}

//Store the updateQueue in updatingQueue and upload
window.plugin.uniques.syncNow = function() {
	if(!plugin.uniques.enableSync) return;
	$.extend(plugin.uniques.updatingQueue, plugin.uniques.updateQueue);
	plugin.uniques.updateQueue = {};
	plugin.uniques.storeLocal(plugin.uniques.UPDATING_QUEUE);
	plugin.uniques.storeLocal(plugin.uniques.UPDATE_QUEUE);

	plugin.sync.updateMap('uniques', 'uniques', plugin.uniques.updatingQueue);
}

//Call after IITC and all plugin loaded
window.plugin.uniques.registerFieldForSyncing = function() {
	if(!window.plugin.sync) return;
	window.plugin.sync.registerMapForSync('uniques', 'uniques', window.plugin.uniques.syncCallback, window.plugin.uniques.syncInitialed);
}

//Call after local or remote change uploaded
window.plugin.uniques.syncCallback = function(pluginName, fieldName, e, fullUpdated) {
	if(fieldName === 'uniques') {
		plugin.uniques.storeLocal(plugin.uniques.KEY);
		// All data is replaced if other client update the data during this client
		// offline,
		// fire 'pluginUniquesRefreshAll' to notify a full update
		if(fullUpdated) {
			plugin.uniques.updateChecked();
			window.runHooks('pluginUniquesRefreshAll');
			return;
		}

		if(!e) return;
		if(e.isLocal) {
			// Update pushed successfully, remove it from updatingQueue
			delete plugin.uniques.updatingQueue[e.property];
		} else {
			// Remote update
			delete plugin.uniques.updateQueue[e.property];
			plugin.uniques.storeLocal(plugin.uniques.UPDATE_QUEUE);
			plugin.uniques.updateChecked();
			window.runHooks('pluginUniquesUpdateUniques', {guid: e.property});
		}
	}
}

//syncing of the field is initialed, upload all queued update
window.plugin.uniques.syncInitialed = function(pluginName, fieldName) {
	if(fieldName === 'uniques') {
		plugin.uniques.enableSync = true;
		if(Object.keys(plugin.uniques.updateQueue).length > 0) {
			plugin.uniques.delaySync();
		}
	}
}

window.plugin.uniques.storeLocal = function(mapping) {
	if(typeof(plugin.uniques[mapping.field]) !== 'undefined' && plugin.uniques[mapping.field] !== null) {
		localStorage[mapping.key] = JSON.stringify(plugin.uniques[mapping.field]);
	} else {
		localStorage.removeItem(mapping.key);
	}
}

window.plugin.uniques.loadLocal = function(mapping) {
	if (localStorage[mapping.key] !== undefined) { plugin.uniques[mapping.field] = JSON.parse(localStorage[mapping.key]); }
}

/***************************************************************************************************************************************************************/
/** HIGHLIGHTER ************************************************************************************************************************************************/
/***************************************************************************************************************************************************************/
window.plugin.uniques.highlight = function(data) {
	var guid = data.portal.options.ent[0];
	
	var fillColor = '#F00'; // not visited
	
	if((uniqueInfo = window.plugin.uniques.uniques[guid]) !== undefined) {
		if(uniqueInfo.captured) {
			fillColor = '#0F0';
		} else if (uniqueInfo.visited) {
			fillColor = '#FF0';
		}
	}

	data.portal.setStyle({fillColor: fillColor, fillOpacity: 0.75});
}

window.plugin.uniques.setupCSS = function() {
	$("<style>")
	.prop("type", "text/css")
	.html("@@INCLUDESTRING:plugins/uniques.css@@")
	.appendTo("head");
}

window.plugin.uniques.setupContent = function() {
	plugin.uniques.contentHTML = '<div id="uniques-container">'
		+ '<label><input type="checkbox" id="visited" onclick="window.plugin.uniques.updateVisited($(this).prop(\'checked\'))"> Visited</label>'
		+ '<label><input type="checkbox" id="captured" onclick="window.plugin.uniques.updateCaptured($(this).prop(\'checked\'))"> Captured</label>'
		+ '</div>';
	plugin.uniques.disabledMessage = '<div id="uniques-container" class="help" title="Your browser does not support localStorage">Plugin Uniques disabled</div>';
}

var setup = function() {
	if($.inArray('pluginUniquesUpdateUniques', window.VALID_HOOKS) < 0)
		window.VALID_HOOKS.push('pluginUniquesUpdateUniques');
	if($.inArray('pluginUniquesRefreshAll', window.VALID_HOOKS) < 0)
		window.VALID_HOOKS.push('pluginUniquesRefreshAll');
	window.plugin.uniques.setupCSS();
	window.plugin.uniques.setupContent();
	window.plugin.uniques.loadLocal(window.plugin.uniques.KEY);
	window.addHook('portalDetailsUpdated', window.plugin.uniques.onPortalDetailsUpdated);
	window.addHook('iitcLoaded', window.plugin.uniques.registerFieldForSyncing);
    window.addPortalHighlighter('Uniques', window.plugin.uniques.highlight);
}

//PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
