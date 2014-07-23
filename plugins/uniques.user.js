//==UserScript==
//@id             iitc-plugin-uniques@3ch01c
//@name           IITC plugin: Uniques
//@category       Misc
//@version        0.2.0.@@DATETIMEVERSION@@
//@namespace      https://github.com/3ch01c/ingress-intel-total-conversion
//@updateURL      @@UPDATEURL@@
//@downloadURL    @@DOWNLOADURL@@
//@description    [@@BUILDNAME@@-@@BUILDDATE@@] Allow manual entry of portals visited/captured. Use the 'highlighter-uniques' plugin to show the uniques on the map, and 'sync' to share between multiple browsers or desktop/mobile.
//@include        https://www.ingress.com/intel*
//@include        http://www.ingress.com/intel*
//@match          https://www.ingress.com/intel*
//@match          http://www.ingress.com/intel*
//@grant          none
//==/UserScript==

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

window.plugin.uniques.addToSidebar = function() {
	if(typeof(Storage) === "undefined") {
		$('#portaldetails > .imgpreview').after(plugin.uniques.disabledMessage);
		return;
	}

	$('#portaldetails > .imgpreview').after(plugin.uniques.contentHTML);
	plugin.uniques.updateChecked();
}

window.plugin.uniques.updateChecked = function() {
	var guid = window.selectedPortal,
		visited = (plugin.uniques.uniques[guid] && plugin.uniques.uniques[guid].visited) || false,
		captured = (plugin.uniques.uniques[guid] && plugin.uniques.uniques[guid].captured) || false;
	$('#visited').prop('checked', visited);
	$('#captured').prop('checked', captured);
}

window.plugin.uniques.updateVisited = function(visited) {
	var guid = window.selectedPortal;
	if (visited) {
		// add entry
		if (guid in plugin.uniques.uniques) { plugin.uniques.uniques[guid].visited = true; }
		else { plugin.uniques.uniques[guid] = {visited: true}; }
		if (guid in plugin.uniques.updateQueue) { plugin.uniques.updateQueue[guid].visited = true; }
		else { plugin.uniques.updateQueue[guid] = {visited: true}; }
	} else if (guid in plugin.uniques.uniques) {
		// remove entry
		if (plugin.uniques.uniques[guid].captured === undefined) { delete plugin.uniques.uniques[guid]; }
		else { delete plugin.uniques.uniques[guid].visited; }
	}
	plugin.uniques.storeLocal(plugin.uniques.KEY);
	plugin.uniques.storeLocal(plugin.uniques.UPDATE_QUEUE);
	plugin.uniques.delaySync();
}

window.plugin.uniques.updateCaptured = function(captured) {
	var guid = window.selectedPortal;
	if (captured) {
		// add entry
		if (guid in plugin.uniques.uniques) { plugin.uniques.uniques[guid].captured = true; }
		else { plugin.uniques.uniques[guid] = {captured: true}; }
		if (guid in plugin.uniques.updateQueue) { plugin.uniques.updateQueue[guid].captured = true; }
		else { plugin.uniques.updateQueue[guid] = {captured: true}; }
	} else if (guid in plugin.uniques.uniques) {
		// remove entry
		if (plugin.uniques.uniques[guid].captured === undefined) { delete plugin.uniques.uniques[guid]; }
		else { delete plugin.uniques.uniques[guid].captured; }
	}
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
	if((uniqueInfo = window.plugin.uniques.uniques[guid]) !== undefined) {
		if (!uniqueInfo.visited && !uniqueInfo.captured) { data.portal.setStyle({fillColor:'magenta', fillOpacity:1}); }
		else if (uniqueInfo.captured && !uniqueInfo.visited) { data.portal.setStyle({fillColor:'red', fillOpacity:.75}); }
		else if (uniqueInfo.visited && !uniqueInfo.captured) { data.portal.setStyle({fillColor:'yellow', fillOpacity:.5}); }
	} else {
		data.portal.setStyle({fillColor:'magenta', fillOpacity:1});
	}
}

window.plugin.uniques.setupCSS = function() {
	$("<style>")
	.prop("type", "text/css")
	.html("@@INCLUDESTRING:plugins/uniques.css@@")
	.appendTo("head");
}

window.plugin.uniques.setupContent = function() {
	plugin.uniques.contentHTML = '<div id="uniques-content-outer">'
		+ '<div id="uniques-label">'
		+ 'Visited <input type="checkbox" id="visited" style="vertical-align: middle;" onclick="window.plugin.uniques.updateVisited($(this).prop(\'checked\'))">'
		+ 'Captured <input type="checkbox" id="captured" style="vertical-align: middle;" onclick="window.plugin.uniques.updateCaptured($(this).prop(\'checked\'))">'
		+ '</div></div>';
	plugin.uniques.disabledMessage = '<div id="uniques-content-outer" title="Your browser does not support localStorage">Plugin Uniques disabled</div>';
}

var setup = function() {
	if($.inArray('pluginUniquesUpdateUniques', window.VALID_HOOKS) < 0)
		window.VALID_HOOKS.push('pluginUniquesUpdateUniques');
	if($.inArray('pluginUniquesRefreshAll', window.VALID_HOOKS) < 0)
		window.VALID_HOOKS.push('pluginUniquesRefreshAll');
	window.plugin.uniques.setupCSS();
	window.plugin.uniques.setupContent();
	window.plugin.uniques.loadLocal(window.plugin.uniques.KEY);
	window.addHook('portalDetailsUpdated', window.plugin.uniques.addToSidebar);
	window.addHook('iitcLoaded', window.plugin.uniques.registerFieldForSyncing);
    window.addPortalHighlighter('Uniques', window.plugin.uniques.highlight);
}

//PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
