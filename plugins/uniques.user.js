// ==UserScript==
// @id             iitc-plugin-uniques@3ch01c
// @name           IITC plugin: Uniques
// @category       Misc
// @version        0.2.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/3ch01c/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Allow manual entry of portals visited/captured. Use the 'highlighter-uniques' plugin to show the uniques on the map, and 'sync' to share between multiple browsers or desktop/mobile. It will try and guess which portals you have captured from COMM/portal details, but this will not catch every case.
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

window.plugin.uniques.isHighlightActive = false;

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
	plugin.uniques.updateCheckedAndHighlight(guid);
}

window.plugin.uniques.onPublicChatDataAvailable = function(data) {
	var nick = window.PLAYER.nickname;
	data.raw.success.forEach(function(msg) {
		var plext = msg[2].plext,
			markup = plext.markup;

		// search for "x deployed an Ly Resonator on z"
		if(plext.plextType == 'SYSTEM_BROADCAST'
		&& markup.length==5
		&& markup[0][0] == 'PLAYER'
		&& markup[0][1].plain == nick
		&& markup[1][0] == 'TEXT'
		&& markup[1][1].plain == ' deployed an '
		&& markup[2][0] == 'TEXT'
		&& markup[3][0] == 'TEXT'
		&& markup[3][1].plain == ' Resonator on '
		&& markup[4][0] == 'PORTAL') {
			plugin.uniques.setPortalVisited(markup[4][1].guid);
		}

		// search for "x captured y"
		if(plext.plextType == 'SYSTEM_BROADCAST'
		&& markup.length==3
		&& markup[0][0] == 'PLAYER'
		&& markup[0][1].plain == nick
		&& markup[1][0] == 'TEXT'
		&& markup[1][1].plain == ' captured '
		&& markup[2][0] == 'PORTAL') {
			plugin.uniques.setPortalCaptured(markup[2][1].guid);
		}

		// search for "x linked y to z"
		if(plext.plextType == 'SYSTEM_BROADCAST'
		&& markup.length==5
		&& markup[0][0] == 'PLAYER'
		&& markup[0][1].plain == nick
		&& markup[1][0] == 'TEXT'
		&& markup[1][1].plain == ' linked '
		&& markup[2][0] == 'PORTAL'
		&& markup[3][0] == 'TEXT'
		&& markup[3][1].plain == ' to '
		&& markup[4][0] == 'PORTAL') {
			plugin.uniques.setPortalVisited(markup[2][1].guid);
		}

		// search for "Your Lx Resonator on y was destroyed by z"
		if(plext.plextType == 'SYSTEM_NARROWCAST'
		&& markup.length==6
		&& markup[0][0] == 'TEXT'
		&& markup[0][1].plain == 'Your '
		&& markup[1][0] == 'TEXT'
		&& markup[2][0] == 'TEXT'
		&& markup[2][1].plain == ' Resonator on '
		&& markup[3][0] == 'PORTAL'
		&& markup[4][0] == 'TEXT'
		&& markup[4][1].plain == ' was destroyed by '
		&& markup[5][0] == 'PLAYER') {
			plugin.uniques.setPortalVisited(markup[3][1].guid);
		}

		// search for "Your Portal x neutralized by y"
		// search for "Your Portal x is under attack by y"
		if(plext.plextType == 'SYSTEM_NARROWCAST'
		&& markup.length==4
		&& markup[0][0] == 'TEXT'
		&& markup[0][1].plain == 'Your Portal '
		&& markup[1][0] == 'PORTAL'
		&& markup[2][0] == 'TEXT'
		&& (markup[2][1].plain == ' neutralized by ' || markup[2][1].plain == ' is under attack by ')
		&& markup[3][0] == 'PLAYER') {
			plugin.uniques.setPortalVisited(markup[1][1].guid);
		}
	});
}

window.plugin.uniques.updateCheckedAndHighlight = function(guid) {
	if (guid == window.selectedPortal) {

		var uniqueInfo = plugin.uniques.uniques[guid];
			visited = (uniqueInfo && uniqueInfo.visited) || false,
			captured = (uniqueInfo && uniqueInfo.captured) || false;
		$('#visited').prop('checked', visited);
		$('#captured').prop('checked', captured);
	}

	if (window.plugin.uniques.isHighlightActive) {
		if (portals[guid]) {
			window.setMarkerStyle (portals[guid], guid == selectedPortal);
		}
	}
}


window.plugin.uniques.setPortalVisited = function(guid) {
	var uniqueInfo = plugin.uniques.uniques[guid];
	if (uniqueInfo) {
		uniqueInfo.visited = true;
	} else {
		plugin.uniques.uniques[guid] = {
			visited: true,
			captured: false
		};
	}

	plugin.uniques.updateCheckedAndHighlight(guid);
	plugin.uniques.storeLocal(plugin.uniques.KEY);
	plugin.uniques.storeLocal(plugin.uniques.UPDATE_QUEUE);
	plugin.uniques.delaySync();
}

window.plugin.uniques.setPortalCaptured = function(guid) {
	var uniqueInfo = plugin.uniques.uniques[guid];
	if (uniqueInfo) {
		uniqueInfo.visited = true;
		uniqueInfo.captured = true;
	} else {
		plugin.uniques.uniques[guid] = {
			visited: true,
			captured: true
		};
	}

	plugin.uniques.updateCheckedAndHighlight(guid);
	plugin.uniques.storeLocal(plugin.uniques.KEY);
	plugin.uniques.storeLocal(plugin.uniques.UPDATE_QUEUE);
	plugin.uniques.delaySync();
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

	plugin.uniques.updateCheckedAndHighlight(guid);
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

	plugin.uniques.updateCheckedAndHighlight(guid);
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
			// a full update - update the selected portal sidebar
			if (window.selectedPortal) {
				plugin.uniques.updateCheckedAndHighlight(window.selectedPortal);
			}
			// and also update all highlights, if needed
			if (window.plugin.uniques.isHighlightActive) {
				resetHighlightedPortals();
			}

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
			plugin.uniques.updateCheckedAndHighlight(e.property);
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
window.plugin.uniques.highlighter = {
	highlight: function(data) {
		var guid = data.portal.options.ent[0];
		var uniqueInfo = window.plugin.uniques.uniques[guid];

		var style = {};

		if (uniqueInfo) {
			if (uniqueInfo.captured) {
				// captured (and, implied, visited too) - no highlights

			} else if (uniqueInfo.visited) {
				style.fillColor = 'yellow';
				style.fillOpacity = 0.6;
			} else {
				// we have an 'uniqueInfo' entry for the portal, but it's not set visited or captured?
				// could be used to flag a portal you don't plan to visit, so use a less opaque red
				style.fillColor = 'red';
				style.fillOpacity = 0.5;
			}
		} else {
			// no visit data at all
			style.fillColor = 'red';
			style.fillOpacity = 0.7;
		}

		data.portal.setStyle(style);
	},

	setSelected: function(active) {
		window.plugin.uniques.isHighlightActive = active;
	}
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
	window.addHook('publicChatDataAvailable', window.plugin.uniques.onPublicChatDataAvailable);
	window.addHook('iitcLoaded', window.plugin.uniques.registerFieldForSyncing);
    window.addPortalHighlighter('Uniques', window.plugin.uniques.highlighter);
}

//PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
