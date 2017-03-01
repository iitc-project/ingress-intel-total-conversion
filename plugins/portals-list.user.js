// ==UserScript==
// @id             iitc-plugin-portals-list@teo96
// @name           IITC plugin: show list of portals
// @category       Info
// @version        0.2.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Display a sortable list of all visible portals with full details about the team, resonators, links, etc.
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @include        https://*.ingress.com/mission/*
// @include        http://*.ingress.com/mission/*
// @match          https://*.ingress.com/mission/*
// @match          http://*.ingress.com/mission/*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalslist = function() {};

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


window.plugin.portalslist.fields = [
  {
    title: "Lat",
    titleClass: "hiddenColumn",
    value: function(portal) { return portal.getLatLng().lat; },
    format: function(cell, portal, value) {
      $(cell)
        .addClass("alignR")
        .addClass("hiddenColumn")
        .text(value);
    },
    defaultOrder: -1,
  },
  {
    title: "Lng",
    titleClass: "hiddenColumn",
    value: function(portal) { return portal.getLatLng().lng; },
    format: function(cell, portal, value) {
      $(cell)
        .addClass("alignR")
        .addClass("hiddenColumn")
        .text(value);
    },
    defaultOrder: -1,
  },
  {
    title: "Portal Name",
    value: function(portal) { return portal.options.data.title; },
    sortValue: function(value, portal) { return value.toLowerCase(); },
    format: function(cell, portal, value) {
      $(cell)
        .append(plugin.portalslist.getPortalLink(portal))
        .addClass("portalTitle");
    }
  },
  {
    title: "Level",
    value: function(portal) { return portal.options.data.level; },
    format: function(cell, portal, value) {
      $(cell)
        .css('background-color', COLORS_LVL[value])
        .text('L' + value);
    },
    defaultOrder: -1,
  },
  {
    title: "Team",
    value: function(portal) { return portal.options.team; },
    format: function(cell, portal, value) {
      $(cell).text(['NEU', 'RES', 'ENL'][value]);
    }
  },
  {
    title: "Health",
    value: function(portal) { return portal.options.data.health; },
    sortValue: function(value, portal) { return portal.options.team===TEAM_NONE ? -1 : value; },
    format: function(cell, portal, value) {
      $(cell)
        .addClass("alignR")
        .text(portal.options.team===TEAM_NONE ? '-' : value+'%');
    },
    defaultOrder: -1,
  },
  {
    title: "Res",
    value: function(portal) { return portal.options.data.resCount; },
    format: function(cell, portal, value) {
      $(cell)
        .addClass("alignR")
        .text(value);
    },
    defaultOrder: -1,
  },
  {
    title: "Links",
    value: function(portal) { return window.getPortalLinks(portal.options.guid); },
    sortValue: function(value, portal) { return value.in.length + value.out.length; },
    format: function(cell, portal, value) {
      $(cell)
        .addClass("alignR")
        .addClass('help')
        .attr('title', 'In:\t' + value.in.length + '\nOut:\t' + value.out.length)
        .text(value.in.length+value.out.length);
    },
    defaultOrder: -1,
  },
  {
    title: "Fields",
    value: function(portal) { return getPortalFieldsCount(portal.options.guid); },
    format: function(cell, portal, value) {
      $(cell)
        .addClass("alignR")
        .text(value);
    },
    defaultOrder: -1,
  },
  {
    title: "AP",
    value: function(portal) {
      var links = window.getPortalLinks(portal.options.guid);
      var fields = getPortalFieldsCount(portal.options.guid);
      return portalApGainMaths(portal.options.data.resCount, links.in.length+links.out.length, fields);
    },
    sortValue: function(value, portal) { return value.enemyAp; },
    format: function(cell, portal, value) {
      var title = '';
      if (teamStringToId(PLAYER.team) == portal.options.team) {
        title += 'Friendly AP:\t'+value.friendlyAp+'\n'
               + '- deploy '+(8-portal.options.data.resCount)+' resonator(s)\n'
               + '- upgrades/mods unknown\n';
      }
      title += 'Enemy AP:\t'+value.enemyAp+'\n'
             + '- Destroy AP:\t'+value.destroyAp+'\n'
             + '- Capture AP:\t'+value.captureAp;

      $(cell)
        .addClass("alignR")
        .addClass('help')
        .prop('title', title)
        .html(/* digits */ (value.enemyAp)); // XXX removed thinspace for export
    },
    defaultOrder: -1,
  },
];

/*
pnpoly Copyright (c) 1970-2003, Wm. Randolph Franklin

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:

  1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
     disclaimers.
  2. Redistributions in binary form must reproduce the above copyright notice in the documentation and/or other
     materials provided with the distribution.
  3. The name of W. Randolph Franklin may not be used to endorse or promote products derived from this Software without
     specific prior written permission.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
window.plugin.portalslist.pnpoly = function(latlngs, point) {
	var length = latlngs.length, c = false;

	for(var i = 0, j = length - 1; i < length; j = i++) {
		if(((latlngs[i].lat > point.lat) != (latlngs[j].lat > point.lat)) &&
		  (point.lng < latlngs[i].lng
		  + (latlngs[j].lng - latlngs[i].lng) * (point.lat - latlngs[i].lat)
		  / (latlngs[j].lat - latlngs[i].lat))) {
			c = !c;
		}
	}

	return c;
};

// interesting layer to us?
window.plugin.portalslist.closedLayer = function (layer) {
  return layer instanceof L.GeodesicPolygon ||
         layer instanceof L.Polygon ||
         layer instanceof L.GeodesicCircle ||
         layer instanceof L.Circle;
};

// is the portal inside any polygon
window.plugin.portalslist.portalInDrawnItems = function (portal) {
  var InDrawnItem = false;
  var point = portal.getLatLng();

  window.plugin.drawTools.drawnItems.eachLayer(function(layer) {
    if (window.plugin.portalslist.closedLayer(layer) &&
        window.plugin.portalslist.pnpoly(layer.getLatLngs(), point)) {
      InDrawnItem = true;
    }
  });
  return InDrawnItem;
};

// turn on polygon filtering if
// we have draw tools, that layer group is visible, there are layers,
// and at least one layer has some sort of a closed polygon
window.plugin.portalslist.checkPolygons = function() {
  filter_by_polygon = false;

  if (window.plugin.drawTools &&
      window.isLayerGroupDisplayed('Drawn Items', true) &&
      window.plugin.drawTools.drawnItems.getLayers().length > 0) {
    window.plugin.drawTools.drawnItems.eachLayer(function(layer) {
      if (window.plugin.portalslist.closedLayer(layer)) {
        filter_by_polygon = true;
      }
    });
  }

  return filter_by_polygon;
};

//fill the listPortals array with portals avaliable on the map (level filtered portals will not appear in the table)
window.plugin.portalslist.getPortals = function(mode) {
  //filter : 0 = All, 1 = Neutral, 2 = Res, 3 = Enl, -x = all but x
  var displayBounds = map.getBounds();
  var checkPoly = window.plugin.portalslist.checkPolygons();

  window.plugin.portalslist.listPortals = [];
  window.plugin.portalslist.filter = 0;
  window.plugin.portalslist.portalcount = [ 0, 0, 0 ];
  window.plugin.portalslist.levelcount = [
    [ 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ] ];

  var storage = {};

  $.each(window.portals, function(i, portal) {
    // eliminate offscreen portals (selected, and in padding)
    if(!displayBounds.contains(portal.getLatLng()))
      return;

    // eliminate portals outside of polygons if drawn items are present
    if(checkPoly && !window.plugin.portalslist.portalInDrawnItems(portal))
      return;

    window.plugin.portalslist.portalcount[portal.options.team]++;

    // count the number of portals at a particular level for a summary
    window.plugin.portalslist.levelcount[portal.options.team][portal.options.level]++;

    if (mode) {
      if (mode == "full")
	  storage[portal.options.guid] = portal.options.data;
      return;
    }

    // cache values and DOM nodes
    var obj = { portal: portal, values: [], sortValues: [] };

    var row = document.createElement('tr');
    row.className = TEAM_TO_CSS[portal.options.team];
    obj.row = row;

    // first column is always GUID (hidden, but exported)
    var cell = row.insertCell(-1);
    cell.textContent = portal.options.guid;
    cell.classList.add("hiddenColumn");

    // empty number column (to be filled in later)
    cell = row.insertCell(-1);
    cell.className = 'alignR';

    window.plugin.portalslist.fields.forEach(function(field, i) {
      cell = row.insertCell(-1);

      var value = field.value(portal);
      obj.values.push(value);

      obj.sortValues.push(field.sortValue ? field.sortValue(value, portal) : value);

      if(field.format) {
        field.format(cell, portal, value);
      } else {
        cell.textContent = value;
      }
    });

    window.plugin.portalslist.listPortals.push(obj);
  });

  if (mode) {
    var flattened = window.plugin.portalslist.levelcount.reduce(function (a, b) {
	return a.concat(b);
    });
    var total = flattened.reduce(function(a, b) {
	return a + b;
    });

    var data = {
      'type': 'portal-census',
      'timestamp': Date.now(),
      'total-count': total,
      'level-summary': window.plugin.portalslist.levelcount,
    }
    if (mode == 'full')
      data.portals = storage

    return data;
  }
};

// Export the portal list in a CSV format file.
// First line is current date presented three ways (unixtime, ISO8601, and DOW, Human Readable)
// Second line is headers
// Rest is table data
window.plugin.portalslist.exportCSV = function() {
  // Temporary delimiter characters unlikely to be typed by keyboard
  // This is to avoid accidentally splitting the actual contents
  var tmpColDelim = String.fromCharCode(11), // vertical tab character
      tmpRowDelim = String.fromCharCode(0),  // null character
      colDelim = ',',		// actual delimiters
      rowDelim = '\n';

  var date = new Date();
  var csv = date.getTime() + colDelim + date.toISOString() + colDelim + date + rowDelim;

  ["th", "td"].forEach(function(label, i) {
    var $rows = $('table.portals').find('tr:has(' + label + ')');

    // Grab text from table into CSV formatted string
    csv += $rows.map(function (i, row) {
      var $row = $(row),
	  $cols = $row.find(label);

      return $cols.map(function (j, col) {
	var $col = $(col),
	    text = $col.text();
	    text = text.replace(/,/g, '');
	    text = text.replace(/ +$/, ''); // remove trailing whitespace
//          text = text.replace(/(\d) (?=(\d\d\d)+(?!\d))/g,"$1"); // remove digit spaces
	    text = text.replace(/\+\-$/,''); // remove key +/- if present

	return text.replace(/"/g, '""'); // escape double quotes
       }).get().join(tmpColDelim);
     }).get().join(tmpRowDelim)
	     .split(tmpRowDelim).join(rowDelim)
	     .split(tmpColDelim).join(colDelim) + rowDelim;
   });

   // Data URI
   var csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csv);

   // If we're running a sane browser, we can specify a nice filename
   // If there's no support for the html a download tag, fall back to window.open
   try {
     var a = document.createElement('a');
     if (!('download' in a)) throw 'a does not support download';
     a.href = csvData;
     a.target = '_self';
     a.class = 'dataURLdownloader';
     a.download = 'export-' + date.toISOString() + '.csv';
     document.body.appendChild(a);
     a.click();
   } catch(e) {
     errormsg = 'error on CSV export: ' + e;
     console.log(errormsg);
     if (strict) throw errormsg;
     window.open(csvData, '_self');
   }
};

window.plugin.portalslist.displayPL = function() {
  var list;
  // plugins (e.g. bookmarks) can insert fields before the standard ones - so we need to search for the 'level' column
  window.plugin.portalslist.sortBy = window.plugin.portalslist.fields.map(function(f){return f.title;}).indexOf('Level');
  window.plugin.portalslist.sortOrder = -1;

  window.plugin.portalslist.getPortals(false);
  if (window.plugin.portalslist.listPortals.length > 0) {
    list = window.plugin.portalslist.portalTable(window.plugin.portalslist.sortBy, window.plugin.portalslist.sortOrder,window.plugin.portalslist.filter);
  } else {
    list = $('<table class="noPortals"><tr><td>Nothing to show!</td></tr></table>');
  };

  if(window.useAndroidPanes()) {
    $('<div id="portalslist" class="mobile">').append(list).appendTo(document.body);
  } else {
    dialog({
      html: $('<div id="portalslist">').append(list),
      dialogClass: 'ui-dialog-portalslist',
      title: 'Portal list: ' + window.plugin.portalslist.listPortals.length + ' ' + (window.plugin.portalslist.listPortals.length == 1 ? 'portal' : 'portals') + (window.plugin.portalslist.checkPolygons() ? " (inside visible polygons)" : ""),
      id: 'portal-list',
      width: 700
    }).dialog('option', 'buttons', {
      'Export': function() { window.plugin.portalslist.exportCSV(); },
      'OK': function() { $(this).dialog('close'); },
    });
  }
};

window.plugin.portalslist.portalTable = function(sortBy, sortOrder, filter) {
  // save the sortBy/sortOrder/filter
  window.plugin.portalslist.sortBy = sortBy;
  window.plugin.portalslist.sortOrder = sortOrder;
  window.plugin.portalslist.filter = filter;

  var portals = window.plugin.portalslist.listPortals;
  var sortField = window.plugin.portalslist.fields[sortBy];

  portals.sort(function(a, b) {
    var valueA = a.sortValues[sortBy];
    var valueB = b.sortValues[sortBy];

    if(sortField.sort) {
      return sortOrder * sortField.sort(valueA, valueB, a.portal, b.portal);
    }

//FIXME: sort isn't stable, so re-sorting identical values can change the order of the list.
//fall back to something constant (e.g. portal name?, portal GUID?),
//or switch to a stable sort so order of equal items doesn't change
    return sortOrder *
      (valueA < valueB ? -1 :
      valueA > valueB ?  1 :
      0);
  });

  if(filter !== 0) {
    portals = portals.filter(function(obj) {
      return filter < 0
        ? obj.portal.options.team+1 != -filter
        : obj.portal.options.team+1 == filter;
    });
  }

  var table, row, cell;
  var container = $('<div>');

  table = document.createElement('table');
  table.className = 'filter';
  container.append(table);

  row = table.insertRow(-1);

  var length = window.plugin.portalslist.listPortals.length;

  ["All", "Neutral", "Resistance", "Enlightened"].forEach(function(label, i) {
    cell = row.appendChild(document.createElement('th'));
    cell.className = 'filter' + label.substr(0, 3);
    cell.textContent = label+':';
    cell.title = 'Show only portals of this color';
    $(cell).click(function() {
      $('#portalslist').empty().append(window.plugin.portalslist.portalTable(sortBy, sortOrder, i));
    });


    cell = row.insertCell(-1);
    cell.className = 'filter' + label.substr(0, 3);
    if(i != 0) cell.title = 'Hide portals of this color';
    $(cell).click(function() {
      $('#portalslist').empty().append(window.plugin.portalslist.portalTable(sortBy, sortOrder, -i));
    });

    if (i == 0) {
	cell.textContent = length; // all portals
    } else {
        cell.textContent = window.plugin.portalslist.portalcount[i-1] + ' (' + Math.round(window.plugin.portalslist.portalcount[i-1]/length*100) + '%)';
    }
  });

  table = document.createElement('table');
  table.className = 'levelcount';
  container.append(table);

  row = table.insertRow(-1);

  cell = row.appendChild(document.createElement('th'));
  cell.textContent = 'Team Count';
  for (var level = 1; level <= MAX_PORTAL_LEVEL; level++) {
    cell = row.appendChild(document.createElement('th'));
    $(cell)
      .text('L' + level)
      .css('background-color', COLORS_LVL[level])
      .addClass('alignR');
  }

  ["Neutral", "Resistance", "Enlightened"].forEach(function(label, team) {
    if (team > 0) { // Neutral is redundant
      row = table.insertRow(-1);
	  row.className = TEAM_TO_CSS[team];
	  cell = row.appendChild(document.createElement('td'));
	  $(cell)
	    .addClass('filter' + label.substr(0, 3))
		.text(label);
	  for (var level = 1; level <= MAX_PORTAL_LEVEL; level++) {
		cell = row.appendChild(document.createElement('td'));
		$(cell)
		  .addClass('alignR')
		  .text(window.plugin.portalslist.levelcount[team][level]);
	  }
    }
  });

  table = document.createElement('table');
  table.className = 'portals';
  container.append(table);

  var thead = table.appendChild(document.createElement('thead'));
  row = thead.insertRow(-1);

  cell = row.appendChild(document.createElement('th'));
  cell.textContent = 'GUID';
  cell.classList.add("hiddenColumn");

  cell = row.appendChild(document.createElement('th'));
  cell.textContent = '#';

  window.plugin.portalslist.fields.forEach(function(field, i) {
    cell = row.appendChild(document.createElement('th'));
    cell.textContent = field.title;
    if(field.titleClass) {
      cell.classList.add(field.titleClass);
    }
    if(field.sort !== null) {
      cell.classList.add("sortable");
      if(i == window.plugin.portalslist.sortBy) {
        cell.classList.add("sorted");
      }

      $(cell).click(function() {
        var order;
        if(i == sortBy) {
          order = -sortOrder;
        } else {
          order = field.defaultOrder < 0 ? -1 : 1;
        }

        $('#portalslist').empty().append(window.plugin.portalslist.portalTable(i, order, filter));
      });
    }
  });

  portals.forEach(function(obj, i) {
    var row = obj.row
    if(row.parentNode) row.parentNode.removeChild(row);

    // second column in table, but first visible column is the # field
    row.cells[1].textContent = i+1;

    table.appendChild(row);
  });

  container.append('<div class="disclaimer">Click on portals table headers to sort by that column. '
    + 'Click on <b>All, Neutral, Resistance, Enlightened</b> to only show portals owner by that faction or on the number behind the factions to show all but those portals.</div>');

  return container;
};

// portal link - single click: select portal
//               double click: zoom to and select portal
// code from getPortalLink function by xelio from iitc: AP List - https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/ap-list.user.js
window.plugin.portalslist.getPortalLink = function(portal) {
  var coord = portal.getLatLng();
  var perma = '/intel?ll='+coord.lat+','+coord.lng+'&z=17&pll='+coord.lat+','+coord.lng;

  // jQuery's event handlers seem to be removed when the nodes are remove from the DOM
  var link = document.createElement("a");
  link.textContent = portal.options.data.title;
  link.href = perma;
  link.addEventListener("click", function(ev) {
    renderPortalDetails(portal.options.guid);
    ev.preventDefault();
    return false;
  }, false);
  link.addEventListener("dblclick", function(ev) {
    zoomToAndShowPortal(portal.options.guid, [coord.lat, coord.lng]);
    ev.preventDefault();
    return false;
  });
  return link;
};

window.plugin.portalslist.onPaneChanged = function(pane) {
  if(pane == "plugin-portalslist")
    window.plugin.portalslist.displayPL();
  else
    $("#portalslist").remove()
};

var setup =  function() {
  if(window.useAndroidPanes()) {
    android.addPane("plugin-portalslist", "Portals list", "ic_action_paste");
    addHook("paneChanged", window.plugin.portalslist.onPaneChanged);
  } else {
    $('#toolbox').append('<a onclick="window.plugin.portalslist.displayPL()" title="Display a list of portals in the current view [t]" accesskey="t">Portals list</a>');
  }

  $("<style>")
    .prop("type", "text/css")
    .html("@@INCLUDESTRING:plugins/portals-list.css@@")
    .appendTo("head");

};

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
