// ==UserScript==
// @id             iitc-plugin-ownership
// @name           IITC plugin: Ownership
// @category       Misc
// @version        0.0.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Allow manual entry of currently owned portals. Sync-enabled and owned portal data will be shared between browsers/mobile. Will try to guess portal ownership if COMM is available.  Highlights owned/unowned portals. Works with/without the uniques plugin, on which it is based. Also provides a list of owned portals, through which the length of ownership can be modified.
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

// Keep track of portal that is being updated.
window.plugin.ownership.updatingPortalGUID = null;

window.plugin.ownership.daysOwnedByGUID = function(guid) {
  var portalInfo = window.plugin.ownership.ownership[guid];
  if(portalInfo)
    return window.plugin.ownership.daysOwnedByPortal(portalInfo);
  return 0;
}

window.plugin.ownership.daysOwnedByPortal = function(portal) {
  if(portal && portal.owned && portal.recordedDate)
    return Math.round((Date.now() - portal.recordedDate) / 86400000);
  return 0;
}

window.plugin.ownership.setPortalOwnershipDate = function(guid,numberOfDaysOwned) {
  var portalInfo = window.plugin.ownership.ownership[guid];
  if(portalInfo) {
    portalInfo.recordedDate = Date.now() - numberOfDaysOwned * 86400000;
    plugin.ownership.sync(guid);
  }
}

window.plugin.ownership.onPortalDetailsUpdated = function() {

  // Alert user if there is no storage available
  if(typeof(Storage) === "undefined"){
    $('#portaldetails > .imgpreview').after(plugin.ownership.disabledMessage);
    return;
  }

  var guid = window.selectedPortal,
      details = portalDetail.get(guid),
      nickname = window.PLAYER.nickname;

  if(details)
    plugin.ownership.updateOwned(details.owner == nickname);

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

    if(portal){
      guid = window.findPortalGuidByPositionE6(portal.latE6, portal.lngE6);
      if(guid)
        plugin.ownership.updateOwned(owned,guid,portal);
    }
  });
}

window.plugin.ownership.updateChecksAndHighlights = function(guid) {
  runHooks('pluginOwnershipUpdateOwnership', { guid: guid });

  if(guid == window.selectedPortal){
    var ownershipInfo = plugin.ownership.ownership[guid],
        owned = (ownershipInfo && ownershipInfo.owned) || false;
    $('#owned').prop('checked', owned);
  }

  if(window.plugin.ownership.isHighlightActive && portals[guid])
    window.setMarkerStyle (window.portals[guid], guid == window.selectedPortal);
}

window.plugin.ownership.updateOwned = function(owned, guid, portal) {
  if(guid == undefined)
    guid = window.selectedPortal;

  var ownershipInfo = plugin.ownership.ownership[guid];
  if(owned){ // If creating/updating an owned portal
    if(!ownershipInfo){ // Creating one that doesn't exist
      plugin.ownership.ownership[guid] = ownershipInfo = {
        owned: owned,
      };
    }

    if(!portal)
      portal = window.portalDetail.get(guid);

    if(portal){
      if(!ownershipInfo.title){ // May not already have portal information
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
        // Only update if the portal has provided informations (i.e. not just from a capture)
        // This presents overwriting of previously known information with 'undefined's
        if (portal.health && portal.resCount && portal.level) {
          ownershipInfo.health = portal.health;
          ownershipInfo.resonatorCount = portal.resCount;
          ownershipInfo.level = portal.level;
        }
      }
    }
  }
  else { // Removing a portal as ownership has been removed
    if(ownershipInfo)
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
  if(!plugin.ownership.enableSync)
    return;
	
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
  if(!window.plugin.sync)
    return;
  window.plugin.sync.registerMapForSync('ownership', 'ownership', window.plugin.ownership.syncCallback, window.plugin.ownership.syncInitialed);
}

//Call after local or remote change uploaded
window.plugin.ownership.syncCallback = function(pluginName, fieldName, e, fullUpdated) {
  if(fieldName === 'ownership'){
    plugin.ownership.storeLocal('ownership');
    // All data is replaced if it has been updated while this client is offline
    // Run 'pluginOwnershipRefreshAll' to trigger a full update
    if(fullUpdated){
      // a full update - update the selected portal sidebar
      if(window.selectedPortal)
        plugin.ownership.updateChecksAndHighlights(window.selectedPortal);
            
      if(window.plugin.ownership.isHighlightActive)
        resetHighlightedPortals();

      window.runHooks('pluginOwnershipRefreshAll');
      return;
    }

    if(!e)
      return;

    if(e.isLocal){
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
  if(fieldName === 'ownership'){
    plugin.ownership.enableSync = true;
    if(Object.keys(plugin.ownership.updateQueue).length > 0)
      plugin.ownership.syncQueue();
  }
}

window.plugin.ownership.storeLocal = function(name) {
  var key = window.plugin.ownership.FIELDS[name];
  if(key === undefined)
    return;

  var value = plugin.ownership[name];

  if(typeof value !== 'undefined' && value !== null)
    localStorage[key] = JSON.stringify(plugin.ownership[name]);
  else
    localStorage.removeItem(key);
}

window.plugin.ownership.loadLocal = function(name) {
  var key = window.plugin.ownership.FIELDS[name];
  if(key === undefined)
    return;

  if(localStorage[key] !== undefined)
    plugin.ownership[name] = JSON.parse(localStorage[key]);
}

window.plugin.ownership.highlighter = {
  highlight: function(data) {
    var guid = data.portal.options.ent[0];
    var ownershipInfo = window.plugin.ownership.ownership[guid];

    var style = {};

    if(ownershipInfo && ownershipInfo.owned){
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
    if(!info)
      info = { owned: false };

    // Update the owned portals list neccessary
    var shouldRemove = !info.owned && $('[ownership-dialog-level="'+data.guid+'"]').length > 0;
    var shouldAdd = info.owned && $('[ownership-dialog-level="'+data.guid+'"]').length == 0;
    var shouldUpdate = info.owned && $('[ownership-dialog-level="'+data.guid+'"]').length > 0;

    if (shouldAdd || shouldRemove || shouldUpdate) {
      window.plugin.ownership.resetOwnedPortalsList();
    }

    $('[data-list-ownership="'+data.guid+'"].owned').prop('checked', info.owned);
  });

  window.addHook('pluginOwnershipRefreshAll', function() {
    $('[data-list-ownership]').each(function(i, element) {
      var guid = element.getAttribute("data-list-ownership");

      var info = plugin.ownership.ownership[guid];
      if(!info)
        info = { owned: false };

      var e = $(element);
      if(e.hasClass('owned'))
        e.prop('checked', info.owned);

      // Update the owned portal list information as it is encountered
      if (info.level && info.health && info.resonatorCount) {
        $('[ownership-dialog-level="'+guid+'"]').css('background-color', COLORS_LVL[info.level]).text("L" + info.level);
        $('[ownership-dialog-health="'+guid+'"]').text(info.health + "%");
        $('[ownership-dialog-resonatorCount="'+guid+'"]').text(info.resonatorCount);
      }
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
      if(!info)
        info = { owned: false };

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

// Owned Portal List Begin
window.plugin.ownership.listPortals = [];
window.plugin.ownership.sortBy = 4; // Sort by Days Owned, Descending
window.plugin.ownership.sortOrder = -1;

/*
 * plugins may add fields by appending their specifiation to the following list. The following members are supported:
 * title: String
 *     Name of the column. Required.
 * value: function(portal)
 *     The raw value of this field. Can by anything. Required, but can be dummy implementation if sortValue and format
 *     are implemented.
 * sortValue: function(value, portal)
 *     The value to sort by. Optional, uses value if omitted. The raw value is passed as first argument.
 * sort: function(valueA, valueB, portalA, portalB)
 *     Custom sorting function. See Array.sort() for details on return value. Both the raw values and the portal objects
 *     are passed as arguments. Optional. Set to null to disable sorting
 * format: function(cell, portal, value)
 *     Used to fill and format the cell, which is given as a DOM node. If omitted, the raw value is put in the cell.
 * defaultOrder: -1|1
 *     Which order should by default be used for this column. -1 means descending. Default: 1
 */


window.plugin.ownership.fields = [
  {
    title: "Portal Name",
    value: function(portal) { return portal.title; },
    sortValue: function(value, portal) { return value.toLowerCase(); },
    format: function(cell, portalGUID, portal, value) {
      $(cell)
        .append(plugin.ownership.getPortalLink(portalGUID, portal))
        .addClass("portalTitle");
    }
  },
  {
    title: "Level",
    value: function(portal) { return portal.level; },
    format: function(cell, portalGUID, portal, value) {
      var text = value ? ('L' + value) : '-';
      $(cell)
        .attr('ownership-dialog-level', portalGUID)
        .css('background-color', COLORS_LVL[value])
        .text(text);
    },
    defaultOrder: -1,
  },
  {
    title: "Health",
    value: function(portal) { return portal.health; },
    sortValue: function(value, portal) { return value; },
    format: function(cell, portalGUID, portal, value) {
      var text = value ? (value + "%") : "-";
      $(cell)
        .attr('ownership-dialog-health', portalGUID)
        .addClass("alignR")
        .text(text);
    },
    defaultOrder: -1,
  },
  {
    title: "Resonators",
    value: function(portal) { return portal.resonatorCount; },
    format: function(cell, portalGUID, portal, value) {
      var text = value ? value : "-";
      $(cell)
        .attr('ownership-dialog-resonatorCount', portalGUID)
        .addClass("alignR")
        .text(text);
    },
    defaultOrder: -1,
  },
  {
    title: "Days Owned",
    value: function(portal) { return window.plugin.ownership.daysOwnedByPortal(portal)},
    format: function(cell, guid, portal, value) {
      $(cell)
        .addClass("alignR")
        .addClass("help")
        .attr('title', 'Double-click to modify.')
        .text(value);
      cell.addEventListener("dblclick", function(ev) {
        var actualNumberOfDays = prompt("How many days have you owned " + portal.title + "?","");
        var parsedNumberOfDays = parseInt(actualNumberOfDays);
        if(!isNaN(parsedNumberOfDays) && parsedNumberOfDays >= 0){
          window.plugin.ownership.setPortalOwnershipDate(guid,parsedNumberOfDays);
          window.plugin.ownership.resetOwnedPortalsList();
        }
        ev.preventDefault();
        return false;
      });
    },
    defaultOrder: -1,
  },
];

window.plugin.ownership.resetOwnedPortalsList = function() {
  window.plugin.ownership.getPortals();
  $('#ownershiplist').empty().append(window.plugin.ownership.portalTable(window.plugin.ownership.sortBy, window.plugin.ownership.sortOrder));
}

// Construct the set of portals to be used, based on data obtained from the set of 'owned' portals.
window.plugin.ownership.getPortals = function() {

  window.plugin.ownership.listPortals = [];
  // Iterate through each known owned portal.
  $.each(Object.keys(window.plugin.ownership.ownership), function(i, portalGUID) {
    var portal = window.plugin.ownership.ownership[portalGUID];
    if(portal && portal.owned){
      // Cache of values for presentation and sorting
      var obj = { portal: portal, values: [], sortValues: [] };

      // Create the row, background color adjusted for team
      var row = document.createElement('tr');
      row.className = window.PLAYER.team == 'RESISTANCE' ? 'res' : 'enl';
      var idAtt = document.createAttribute('portal-id');
      idAtt.value = portalGUID;
      row.setAttributeNode(idAtt);
      obj.row = row;

      // Cell for portal number
      var cell = row.insertCell(-1);
      cell.className = 'alignR';

      // Populate a cell for each field created previously
      window.plugin.ownership.fields.forEach(function(field, i) {
        // Create a cell for this field
        cell = row.insertCell(-1);

        // Get the value to be used in this field
        var value = field.value(portal);
        obj.values.push(value);

        // Create set of values to use when sorting based on this field
        obj.sortValues.push(field.sortValue ? field.sortValue(value, portal) : value);

        // If the value is formatted, use that, otherwise just the value
        if(field.format)
          field.format(cell, portalGUID, portal, value);
        else
          cell.textContent = value;
      });

      window.plugin.ownership.listPortals.push(obj);
    }
  });

  return window.plugin.ownership.listPortals.length > 0; // Used to decide whether or not to display the list.
}

window.plugin.ownership.displayPL = function() {
  var list;
  // plugins (e.g. bookmarks) can insert fields before the standard ones - so we need to search for the 'Days Owned' column
  window.plugin.ownership.sortBy = window.plugin.ownership.fields.map(function(f){return f.title;}).indexOf('Days Owned');
  window.plugin.ownership.sortOrder = -1;

  if(window.plugin.ownership.getPortals())
    list = window.plugin.ownership.portalTable(window.plugin.ownership.sortBy, window.plugin.ownership.sortOrder);
  else
    list = $('<table class="noPortals"><tr><td>No currently owned portals are known!</td></tr></table>');

  if(window.useAndroidPanes())
    $('<div id="ownershiplist" class="mobile">').append(list).appendTo(document.body);
  else {
    dialog({
      html: $('<div id="ownershiplist">').append(list),
      dialogClass: 'ui-dialog-ownershiplist',
      title: window.plugin.ownership.ownedPortalListTitle(),
      id: 'portal-list',
      width: 700,
      buttons: {'Refresh All': function() {
        $.each(Object.keys(window.plugin.ownership.ownership), function(i, portalGUID) {
          // Only update the portal information if it is cache-stale
          if (!window.portalDetail.isFresh(portalGUID))
            window.plugin.ownership.updatePortalFromRefreshAll(portalGUID);
        });
      }}
    });
  }
}

window.plugin.ownership.ownedPortalListTitle = function() {
  return 'Portal list: ' + window.plugin.ownership.listPortals.length + ' ' + (window.plugin.ownership.listPortals.length == 1 ? 'portal' : 'portals');
}

window.plugin.ownership.setOwnedPortalListTitle = function(title) {
  if(!title)
    title = window.plugin.ownership.ownedPortalListTitle();

  $('.ui-dialog-ownershiplist > .ui-dialog-titlebar > span').text(title);
}

window.plugin.ownership.updatePortalFromRefreshAll = function(portalGUID) {
  if (!window.plugin.ownership.updatingPortalGUID) {
    window.plugin.ownership.updatingPortalGUID = portalGUID;
    var portal = window.plugin.ownership.ownership[portalGUID];
    window.plugin.ownership.setOwnedPortalListTitle('Updating: ' + portal.title);
    window.plugin.ownership.navigateToAndSelectPortal(portalGUID, portal);
    $('[portal-id="' + portalGUID + '"]').addClass('updating');
  }

  // Non-blocking wait until the portal details have been loaded
  var details = window.portalDetail.get(portalGUID);
  if (!details)
    setTimeout(window.plugin.ownership.updatePortalFromRefreshAll,1000,portalGUID);
  else {
    window.plugin.ownership.setOwnedPortalListTitle();
    window.plugin.ownership.updatingPortalGUID = null;
    return true;
  }
}

window.plugin.ownership.portalTable = function(sortBy, sortOrder) {
  window.plugin.ownership.sortBy = sortBy;
  window.plugin.ownership.sortOrder = sortOrder;

  var portals = window.plugin.ownership.listPortals;
  var sortField = window.plugin.ownership.fields[sortBy];

  // Sort the set of functions according to the saved column & order
  portals.sort(function(a, b) {
    var valueA = a.sortValues[sortBy];
    var valueB = b.sortValues[sortBy];

    if(sortField.sort)
      return sortOrder * sortField.sort(valueA, valueB, a.portal, b.portal);

    //FIXME: sort isn't stable, should be based on guids or something stable.
    return sortOrder * ((valueA < valueB) ? -1 : ((valueA > valueB) ?  1 : 0));
  });

  // Create table & container
  var table, row, cell;
  var container = $('<div>');

  table = document.createElement('table');
  table.className = 'portals';
  container.append(table);

  // Create header with first row
  var thead = table.appendChild(document.createElement('thead'));
  row = thead.insertRow(-1);

  // Set up column for portal numbers
  cell = row.appendChild(document.createElement('th'));
  cell.textContent = '#';

  // Set up column headers for presentation and enable 'click-to-sort'
  window.plugin.ownership.fields.forEach(function(field, i) {
    // Add column header
    cell = row.appendChild(document.createElement('th'));
    cell.textContent = field.title;

    // Format the header based on its content
    if(field.title == "Portal Name" || field.title == "Level")
      cell.classList.add('alignL');
    else
      cell.classList.add('alignR');

    // Format cell based on sortability and if it is sorted
    if(field.sort !== null){
      cell.classList.add("sortable");
      if(i == window.plugin.ownership.sortBy)
        cell.classList.add("sorted");

      // Add a listener to sort if the header is clicked
      $(cell).click(function() {
        var order;
        if(i == sortBy)
          order = -sortOrder;
        else
          order = field.defaultOrder < 0 ? -1 : 1;

        // Repopulate the table if freshly sorted as values may have been updated
        window.plugin.ownership.getPortals();
        $('#ownershiplist').empty().append(window.plugin.ownership.portalTable(i, order));
      });
    }
  });

  // Add rows for each portal
  portals.forEach(function(obj, i) {
    var row = obj.row
    if(row.parentNode) row.parentNode.removeChild(row);

    // Add portal number & add row to table
    row.cells[0].textContent = i+1;
    table.appendChild(row);
  });

  container.append('<div class="information">Information generated from the latest known data (the last time the portal detail was shown).<br>'
    + 'Click \'Refresh All\' to update all portal information or click a portal name to update information for that portal.<br>'
    + 'Click on portals table headers to sort by that column.<br>'
    + 'Double click on the number of days owned for a portal to adjust manually</div>');

  return container;
}

window.plugin.ownership.navigateToAndSelectPortal = function(guid, portal) {
  var mapBounds = map.getBounds();
  // No point reloading the map if this portal is within map bounds
  if (mapBounds.contains([portal.latE6/1E6, portal.lngE6/1E6]))
    renderPortalDetails(guid);
  else
    zoomToAndShowPortal(guid, [portal.latE6/1E6, portal.lngE6/1E6]);
}

// Constructs a link to the given portal.
// Always moves the map to the portal location and displays its details.
// based on code from getPortalLink function by xelio from iitc: AP List - https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/ap-list.user.js
window.plugin.ownership.getPortalLink = function(guid, portal) {
  // jQuery's event handlers seem to be removed when the nodes are remove from the DOM
  var link = document.createElement("a");
  link.textContent = portal.title;
  link.href = '/intel?latE6='+portal.latE6+'&lngE6='+portal.lngE6+'&z=17';
  link.addEventListener("click", function(ev) {
    window.plugin.ownership.navigateToAndSelectPortal(guid, portal);
    ev.preventDefault();
    return false;
  }, false);
  return link;
}

window.plugin.ownership.onPaneChanged = function(pane) {
  if(pane == "plugin-ownership")
    window.plugin.ownership.displayPL();
  else
    $("#ownershiplist").remove()
};

// Owned Portal List End

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

  if(window.plugin.portalslist)
    window.plugin.ownership.setupPortalsList();
  else {
    setTimeout(function() {
      if(window.plugin.portalslist)
        window.plugin.ownership.setupPortalsList();
    }, 500);
  }

  if(window.useAndroidPanes()){
    android.addPane("plugin-ownership", "Owned Portals", "ic_action_paste");
    addHook("paneChanged", window.plugin.ownership.onPaneChanged);
  } else {
    $('#toolbox').append('<a onclick="window.plugin.ownership.displayPL()" title="Display a list of portals in the current view [g]" accesskey="g">Owned Portals</a>');
  }
}

//PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
