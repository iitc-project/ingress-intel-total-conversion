// ==UserScript==
// @id             iitc-plugin-ownership
// @name           IITC plugin: Ownership
// @category       Misc
// @version        0.0.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Allow manual entry of currently owned portals. Sync-enabled and owned portal data will be shared between browsers/mobile. Will try to guess portal ownership if COMM is available.  Highlights owned/unowned portals. Works with/without the uniques plugin, on which it is based.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@
//PLUGIN START ////////////////////////////////////////////////////////

// Create unique plugin namespace
window.plugin.ownership = function() {};

// Delay syncs for groups of data
window.plugin.ownership.SYNC_DELAY = 5000;

// Define storage keys for persisting data
window.plugin.ownership.FIELDS = {
	'ownership': 'plugin-ownership-data',
	'updateQueue': 'plugin-ownership-data-queue',
	'updatingQueue': 'plugin-ownership-data-updating-queue',
};

// Data sets for persisting data
window.plugin.ownership.ownership = {};
window.plugin.ownership.updateQueue = {};
window.plugin.ownership.updatingQueue = {};

// Disable sync intially
window.plugin.ownership.enableSync = false;

// Display objects
window.plugin.ownership.disabledMessage = null;
window.plugin.ownership.labelContentHTML = null;
window.plugin.ownership.contentHTML = null;

// Disable highlighter until selected
window.plugin.ownership.isHighlightActive = false;

window.plugin.ownership.daysOwned = function(guid) {
    var ownershipInfo = window.plugin.ownership.ownership[guid];
    if (ownershipInfo && ownershipInfo.owned && ownershipInfo.recordedDate)
        return Math.round((Date.now() - ownershipInfo.recordedDate) / 86400000);
    return 0;
}

window.plugin.ownership.onPortalDetailsUpdated = function() {

    // Alert user if there is no storage available
	if(typeof(Storage) === "undefined") {
		$('#portaldetails > .imgpreview').after(plugin.ownership.disabledMessage);
		return;
	}

	var guid = window.selectedPortal,
		details = portalDetail.get(guid),
		nickname = window.PLAYER.nickname;

	if(details && (details.owner == nickname))
		plugin.ownership.updateOwned(true);

    if($('#uniques-container').length) // If iitc-plugin-uniques is enabled, embed ownership data alongside unique data
        $('#uniques-container > label:first').before(plugin.ownership.labelContentHTML);
    else // Otherwise create own display container
        $('#portaldetails > .imgpreview').after(plugin.ownership.contentHTML);

    // Update portal-list data
	plugin.ownership.updateChecksAndHighlights(guid);
}

window.plugin.ownership.onPublicChatDataAvailable = function(data) {
	data.result.forEach(function(msg) {
		var plext = msg[2].plext,
			markup = plext.markup
            portal = null,
            guid = null,
            owned = false;

		if(plext.plextType == 'SYSTEM_BROADCAST'
		&& markup.length==3
		&& markup[0][0] == 'PLAYER'
		&& markup[0][1].plain == window.PLAYER.nickname
		&& markup[1][0] == 'TEXT'
		&& markup[1][1].plain == ' captured '
		&& markup[2][0] == 'PORTAL') {
			// Player has captured a portal within the bounded area
			portal = markup[2][1];
            owned = true;
		} else if(plext.plextType == 'SYSTEM_NARROWCAST'
		&& markup.length==4
		&& markup[0][0] == 'TEXT'
		&& markup[0][1].plain == 'Your Portal '
		&& markup[1][0] == 'PORTAL'
		&& markup[2][0] == 'TEXT'
		&& (markup[2][1].plain == ' neutralized by ')
		&& markup[3][0] == 'PLAYER') {
            // An owned portal has become neutralized
			portal = markup[1][1];
		}
        if(portal) {
            guid = window.findPortalGuidByPositionE6(portal.latE6, portal.lngE6);
            if(guid)
                plugin.ownership.updateOwned(owned,guid,portal);
        }    
	});
}

window.plugin.ownership.updateChecksAndHighlights = function(guid) {
	runHooks('pluginOwnershipUpdateOwnership', { guid: guid });

	if (guid == window.selectedPortal) {
		var ownershipInfo = plugin.ownership.ownership[guid],
            owned = (ownershipInfo && ownershipInfo.owned) || false;
		$('#owned').prop('checked', owned);
	}

	if (window.plugin.ownership.isHighlightActive && portals[guid])
		window.setMarkerStyle (window.portals[guid], guid == window.selectedPortal);
}

window.plugin.ownership.updateOwned = function(owned, guid, portal) {
	if(guid == undefined) 
        guid = window.selectedPortal;

	var ownershipInfo = plugin.ownership.ownership[guid];
    if(owned) { // If creating/updating an owned portal
        if(!ownershipInfo) { // Creating one that doesn't exist
    		plugin.ownership.ownership[guid] = ownershipInfo = {
    			owned: owned,
    		};
        }

        if(!portal)
            portal = window.portalDetail.get(guid);

        if(portal) {
            if (!ownershipInfo.title) { // May not already have portal information
                // Add in most recently known portal information
                ownershipInfo.title = (!portal.name) ? portal.title : portal.name;
                ownershipInfo.latE6 = portal.latE6;
                ownershipInfo.lngE6 = portal.lngE6;
                ownershipInfo.health = portal.health;
                ownershipInfo.level = portal.level;
                ownershipInfo.resonatorCount = portal.resCount;
                ownershipInfo.recordedDate = Date.now();
            }
            else { // One that is already owned and has information
                // Update with most recently known information
                ownershipInfo.health = portal.health;
                ownershipInfo.resonatorCount = portal.resCount;
                ownershipInfo.level = portal.level;
            }
        }
    }
    else { // Removing a portal as ownership has been removed
        if (ownershipInfo)
            delete plugin.ownership.ownership[guid];
    }

	plugin.ownership.updateChecksAndHighlights(guid);
	plugin.ownership.sync(guid);
}

// stores the gived GUID for sync
plugin.ownership.sync = function(guid) {
	plugin.ownership.updatingQueue[guid] = true;
	plugin.ownership.storeLocal('ownership');
	plugin.ownership.storeLocal('updateQueue');
	plugin.ownership.syncQueue();
}

// sync the queue, but delay the actual sync to group a few updates in a single request
window.plugin.ownership.syncQueue = function() {
	if(!plugin.ownership.enableSync) return;
	
	clearTimeout(plugin.ownership.syncTimer);
	
	plugin.ownership.syncTimer = setTimeout(function() {
		plugin.ownership.syncTimer = null;

		$.extend(plugin.ownership.updatingQueue, plugin.ownership.updateQueue);
		plugin.ownership.updateQueue = {};
		plugin.ownership.storeLocal('updatingQueue');
		plugin.ownership.storeLocal('updateQueue');

		plugin.sync.updateMap('ownership', 'ownership', Object.keys(plugin.ownership.updatingQueue));
	}, plugin.ownership.SYNC_DELAY);
}

//Call after IITC and all plugin loaded
window.plugin.ownership.registerFieldForSyncing = function() {
	if(!window.plugin.sync) return;
	window.plugin.sync.registerMapForSync('ownership', 'ownership', window.plugin.ownership.syncCallback, window.plugin.ownership.syncInitialed);
}

//Call after local or remote change uploaded
window.plugin.ownership.syncCallback = function(pluginName, fieldName, e, fullUpdated) {
	if(fieldName === 'ownership') {
		plugin.ownership.storeLocal('ownership');
		// All data is replaced if it has been updated while this client is offline
		// Run 'pluginOwnershipRefreshAll' to trigger a full update
		if(fullUpdated) {
			// a full update - update the selected portal sidebar
			if (window.selectedPortal)
				plugin.ownership.updateChecksAndHighlights(window.selectedPortal);
            
            if (window.plugin.ownership.isHighlightActive)
                resetHighlightedPortals();

			window.runHooks('pluginOwnershipRefreshAll');
			return;
		}

		if(!e) return;
		if(e.isLocal) {
			// Update pushed successfully, remove it from updatingQueue
			delete plugin.ownership.updatingQueue[e.property];
		} else {
			// Remote update
			delete plugin.ownership.updateQueue[e.property];
			plugin.ownership.storeLocal('updateQueue');
			plugin.ownership.updateChecksAndHighlights(e.property);
			window.runHooks('pluginOwnershipUpdateOwnership', {guid: e.property});
		}
	}
}

//syncing of the field is initialed, upload all queued update
window.plugin.ownership.syncInitialed = function(pluginName, fieldName) {
	if(fieldName === 'ownership') {
		plugin.ownership.enableSync = true;
		if(Object.keys(plugin.ownership.updateQueue).length > 0) {
			plugin.ownership.syncQueue();
		}
	}
}

window.plugin.ownership.storeLocal = function(name) {
	var key = window.plugin.ownership.FIELDS[name];
	if(key === undefined) return;

	var value = plugin.ownership[name];

	if(typeof value !== 'undefined' && value !== null) {
		localStorage[key] = JSON.stringify(plugin.ownership[name]);
	} else {
		localStorage.removeItem(key);
	}
}

window.plugin.ownership.loadLocal = function(name) {
	var key = window.plugin.ownership.FIELDS[name];
	if(key === undefined) return;

	if(localStorage[key] !== undefined) {
		plugin.ownership[name] = JSON.parse(localStorage[key]);
	}
}

window.plugin.ownership.highlighter = {
	highlight: function(data) {
		var guid = data.portal.options.ent[0];
		var ownershipInfo = window.plugin.ownership.ownership[guid];

		var style = {};

		if (ownershipInfo && ownershipInfo.owned) {
			// No highlight
		} else {
			// Portal not owned
			style.fillColor = 'red';
			style.fillOpacity = 0.5;
		}

		data.portal.setStyle(style);
	},

	setSelected: function(active) {
		window.plugin.ownership.isHighlightActive = active;
	}
}

window.plugin.ownership.setupCSS = function() {
	$("<style>")
	.prop("type", "text/css")
	.html("@@INCLUDESTRING:plugins/portal-ownership.css@@")
	.appendTo("head");
}

window.plugin.ownership.setupContent = function() {
    plugin.ownership.labelContentHTML = '<label><input type="checkbox" id="owned" onclick="window.plugin.ownership.updateOwned($(this).prop(\'checked\'))"> Owner</label>';
	plugin.ownership.contentHTML = '<div id="ownership-container">'
        + plugin.ownership.labelContentHTML
		+ '</div>';
	plugin.ownership.disabledMessage = '<div id="ownership-container" class="help" title="Your browser does not support localStorage">Ownership plugin disabled</div>';
}

window.plugin.ownership.setupPortalsList = function() {
	if(!window.plugin.portalslist) 
        return;

	window.addHook('pluginOwnershipUpdateOwnership', function(data) {
		var info = plugin.ownership.ownership[data.guid];
		if(!info) info = { owned: false };

		$('[data-list-ownership="'+data.guid+'"].owned').prop('checked', info.owned);
	});

	window.addHook('pluginOwnershipRefreshAll', function() {
		$('[data-list-ownership]').each(function(i, element) {
			var guid = element.getAttribute("data-list-ownership");

			var info = plugin.ownership.ownership[guid];
			if(!info) info = { owned: false };

			var e = $(element);
			if(e.hasClass('owned')) e.prop('checked', info.owned);
		});
	});

	function uniqueValue(guid) {
		var info = plugin.ownership.ownership[guid];

		if(info && info.owned) 
            return 1;
        return 0;
	}

    var ownershipField = {
		title: "Owner",
		value: function(portal) { return portal.options.guid; }, // we store the guid, but implement a custom comparator so the list does sort properly without closing and reopening the dialog
		sort: function(guidA, guidB) {
			return uniqueValue(guidA) - uniqueValue(guidB);
		},
		format: function(cell, portal, guid) {
			var info = plugin.ownership.ownership[guid];
			if(!info) info = { owned: false };

			$(cell).addClass("portal-list-ownership");

			// for some reason, jQuery removes event listeners when the list is sorted. Therefore we use DOM's addEventListener
			$('<input>')
				.prop({
					type: "checkbox",
					className: "owned",
					title: "Portal owned?",
					checked: info.owned,
				})
				.attr("data-list-ownership", guid)
				.appendTo(cell)
				[0].addEventListener("change", function(ev) {
					window.plugin.ownership.updateOwned(this.checked, guid);
					ev.preventDefault();
					return false;
				}, false);
		},
	}

    // Ensure that the ownership field appears after the uniques field.
    if(window.plugin.uniques) {
        var uniqueField = window.plugin.portalslist.fields.filter(function(element) {
            return (element.title == "Visit");
        })[0];
        var uniqueFieldIndex = window.plugin.portalslist.fields.indexOf(uniqueField);
        // Uniques field is last field or not in the set of fields yet
        if(uniqueFieldIndex < 0 || uniqueFieldIndex == (window.plugin.portalslist.fields.length - 1)) 
            window.plugin.portalslist.fields.push(ownershipField);
        else // Uniques appears somewhere in the list of fields, splice in after it.
            window.plugin.portalslist.fields.splice(uniqueFieldIndex+1, 0, ownershipField);
    }
    else // Uniques isn't defined (yet?)
        window.plugin.portalslist.fields.push(ownershipField);
}

var setup = function() {
	if($.inArray('pluginOwnershipUpdateOwnership', window.VALID_HOOKS) < 0)
		window.VALID_HOOKS.push('pluginOwnershipUpdateOwnership');
	if($.inArray('pluginOwnershipRefreshAll', window.VALID_HOOKS) < 0)
		window.VALID_HOOKS.push('pluginOwnershipRefreshAll');
    window.plugin.ownership.setupCSS();
	window.plugin.ownership.setupContent();
	window.plugin.ownership.loadLocal('ownership');

	window.addHook('portalDetailsUpdated', window.plugin.ownership.onPortalDetailsUpdated);
	window.addHook('publicChatDataAvailable', window.plugin.ownership.onPublicChatDataAvailable);
	window.addHook('iitcLoaded', window.plugin.ownership.registerFieldForSyncing);
    window.addPortalHighlighter('Owned Portals', window.plugin.ownership.highlighter);

	if(window.plugin.portalslist) {
		window.plugin.ownership.setupPortalsList();
	} else {
		setTimeout(function() {
			if(window.plugin.portalslist)
				window.plugin.ownership.setupPortalsList();
		}, 500);
	}
}

//PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
