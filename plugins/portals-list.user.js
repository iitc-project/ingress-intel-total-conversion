// ==UserScript==
// @id             iitc-plugin-portals-list@teo96
// @name           IITC plugin: show list of portals
// @category       Info
// @version        0.1.2.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Display a sortable list of all visible portals with full details about the team, resonators, links, etc.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

  /* whatsnew
   * 0.1.0 : Using the new data format
   * 0.0.15: Add 'age' column to display how long each portal has been controlled by its current owner.
   * 0.0.14: Add support to new mods (S:Shield - T:Turret - LA:Link Amp - H:Heat-sink - M:Multi-hack - FA:Force Amp)
   * 0.0.12: Use dialog() instead of alert so the user can drag the box around
   * 0.0.11: Add nominal energy column and # links, fix sort bug when opened even amounts of times, nits
   * 0.0.10: Fixed persistent css problem with alert
   * 0.0.9 : bugs hunt
   * 0.0.8 : Aborted to avoid problems with Niantic (export portals informations as csv or kml file)
   * 0.0.7 : more informations available via tooltips (who deployed, energy, ...), new E/AP column
   * 0.0.6 : Add power charge information into a new column + bugfix
   * 0.0.5 : Filter portals by clicking on 'All portals', 'Res Portals' or 'Enl Portals'
   * 0.0.4 : Add link to portals name, one click to display full information in portal panel, double click to zoom on portal, hover to show address
   * 0.0.3 : sorting ascending/descending and add numbers of portals by faction on top on table
   * 0.0.2 : add sorting feature when click on header column
   * 0.0.1 : initial release, show list of portals with level, team, resonators and shield information
   *
   * Display code inspired from @vita10gy's scoreboard plugin : iitc-plugin-scoreboard@vita10gy - https://github.com/breunigs/ingress-intel-total-conversion
   * Portal link code from xelio - iitc: AP List - https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/ap-list.user.js
   *
   * todo : export as GPX, Open in Google Maps, more statistics in the header, what else ?
   */

// use own namespace for plugin
window.plugin.portalslist = function() {};

window.plugin.portalslist.listPortals = [];
window.plugin.portalslist.sortBy = 'level';
window.plugin.portalslist.sortOrder = -1;
window.plugin.portalslist.enlP = 0;
window.plugin.portalslist.resP = 0;
window.plugin.portalslist.filter = 0;

//fill the listPortals array with portals avaliable on the map (level filtered portals will not appear in the table)
window.plugin.portalslist.getPortals = function() {
  //filter : 0 = All, 1 = Res, 2 = Enl
  var retval=false;

  var displayBounds = map.getBounds();

  window.plugin.portalslist.listPortals = [];
  $.each(window.portals, function(i, portal) {
    // eliminate offscreen portals (selected, and in padding)
    if(!displayBounds.contains(portal.getLatLng())) return true;

    retval=true;
    var d = portal.options.data;
    var teamN = portal.options.team;

    switch (teamN) {
      case TEAM_RES:
        window.plugin.portalslist.resP++;
        break;
      case TEAM_ENL:
        window.plugin.portalslist.enlP++;
        break;
    }
    var l = window.getPortalLinks(i);
    var f = window.getPortalFields(i);
    var ap = portalApGainMaths(d.resCount, l.in.length+l.out.length, f.length);

    var thisPortal = {
      'portal': portal,
      'guid': i,
      'teamN': teamN, // TEAM_NONE, TEAM_RES or TEAM_ENL
      'team': d.team, // "NEUTRAL", "RESISTANCE" or "ENLIGHTENED"
      'name': d.title || '(untitled)',
      'nameLower': d.title && d.title.toLowerCase(),
      'level': portal.options.level,
      'health': d.health,
      'resCount': d.resCount,
      'img': d.img,
      'linkCount': l.in.length + l.out.length,
      'link' : l,
      'fieldCount': f.length,
      'field' : f,
      'enemyAp': ap.enemyAp,
      'ap': ap,
    };
    window.plugin.portalslist.listPortals.push(thisPortal);
  });

  return retval;
}

window.plugin.portalslist.displayPL = function() {
  var html = '';
  window.plugin.portalslist.sortBy = 'level';
  window.plugin.portalslist.sortOrder = -1;
  window.plugin.portalslist.enlP = 0;
  window.plugin.portalslist.resP = 0;
  window.plugin.portalslist.filter = 0;

  if (window.plugin.portalslist.getPortals()) {
    html += window.plugin.portalslist.portalTable(window.plugin.portalslist.sortBy, window.plugin.portalslist.sortOrder,window.plugin.portalslist.filter);
  } else {
    html = '<table class="noPortals"><tr><td>Nothing to show!</td></tr></table>';
  };

  if(window.useAndroidPanes()) {
    $('<div id="portalslist" class="mobile">' + html + '</div>').appendTo(document.body);
  } else {
    dialog({
      html: '<div id="portalslist">' + html + '</div>',
      dialogClass: 'ui-dialog-portalslist',
      title: 'Portal list: ' + window.plugin.portalslist.listPortals.length + ' ' + (window.plugin.portalslist.listPortals.length == 1 ? 'portal' : 'portals'),
      id: 'portal-list',
      width: 700
    });
  }
}

window.plugin.portalslist.portalTable = function(sortBy, sortOrder, filter) {
  // save the sortBy/sortOrder/filter
  window.plugin.portalslist.sortBy = sortBy;
  window.plugin.portalslist.sortOrder = sortOrder;
  window.plugin.portalslist.filter = filter;

  var portals=window.plugin.portalslist.listPortals;

  //Array sort
  window.plugin.portalslist.listPortals.sort(function(a, b) {
    var retVal = 0;

    var aComp = a[sortBy];
    var bComp = b[sortBy];

    if (aComp < bComp) {
      retVal = -1;
    } else if (aComp > bComp) {
      retVal = 1;
    } else {
      // equal - compare GUIDs to ensure consistent (but arbitrary) order
      retVal = a.guid < b.guid ? -1 : 1;
    }

    // sortOrder is 1 (normal) or -1 (reversed)
    retVal = retVal * sortOrder;
    return retVal;
  });

  var sortAttr = window.plugin.portalslist.portalTableHeaderSortAttr;
  var html = window.plugin.portalslist.stats();
  html += '<table class="portals">'
    + '<tr class="header">'
    + '<th>#</th>'
    + '<th ' + sortAttr('nameLower', sortBy, 1, 'portalTitle') + '>Portal Name</th>'
    + '<th ' + sortAttr('level', sortBy, -1) + '>Level</th>'
    + '<th ' + sortAttr('teamN', sortBy, 1) + '>Team</th>'
    + '<th ' + sortAttr('health', sortBy, -1) + '>Health</th>'
    + '<th ' + sortAttr('resCount', sortBy, -1) + '>Res</th>'
    + '<th ' + sortAttr('linkCount', sortBy, -1) + '>Links</th>'
    + '<th ' + sortAttr('fieldCount', sortBy, -1) + '>Fields</th>'
    + '<th ' + sortAttr('enemyAp', sortBy, -1) + '>AP</th>'
    + '</tr>\n';

  var rowNum = 1;

  $.each(portals, function(ind, portal) {
    if (filter === TEAM_NONE || filter === portal.teamN) {

      html += '<tr class="' + (portal.teamN === window.TEAM_RES ? 'res' : (portal.teamN === window.TEAM_ENL ? 'enl' : 'neutral')) + '">'
        + '<td>'+rowNum+'</td>'
        + '<td class="portalTitle" style="">' + window.plugin.portalslist.getPortalLink(portal, portal.guid) + '</td>'
        + '<td class="L' + portal.level +'" style="background-color: '+COLORS_LVL[portal.level]+'">' + portal.level + '</td>'
        + '<td style="text-align:center;">' + portal.team.substr(0,3) + '</td>';

      html += '<td>' + (portal.teamN!=TEAM_NONE?portal.health+'%':'-') + '</td>'
        + '<td>' + portal.resCount + '</td>'
        + '<td class="help" title="In: ' + portal.link.in.length + ' Out: ' + portal.link.out.length + '">' + (portal.linkCount?portal.linkCount:'-') + '</td>'
        + '<td>' + (portal.fieldCount?portal.fieldCount:'-') + '</td>';

      var apTitle = '';
      if (PLAYER.team == portal.team) {
        apTitle += 'Friendly AP:\t'+portal.ap.friendlyAp+'\n'
                 + '- deploy '+(8-portal.resCount)+' resonator(s)\n'
                 + '- upgrades/mods unknown\n';
      }
      apTitle += 'Enemy AP:\t'+portal.ap.enemyAp+'\n'
               + '- Destroy AP:\t'+portal.ap.destroyAp+'\n'
               + '- Capture AP:\t'+portal.ap.captureAp;

      html += '<td class="help apGain" title="' + apTitle + '">' + digits(portal.ap.enemyAp) + '</td>';

      html+= '</tr>';

      rowNum++;
    }
  });
  html += '</table>';

  html += '<div class="disclaimer">Click on portals table headers to sort by that column. '
    + 'Click on <b>All Portals, Resistance Portals, Enlightened Portals</b> to filter</div>';

  return html;
}

window.plugin.portalslist.stats = function(sortBy) {
  var html = '<table class="teamFilter"><tr>'
    + '<td class="filterAll" style="cursor:pointer"><a href=""></a>All Portals : (click to filter)</td><td class="filterAll">' + window.plugin.portalslist.listPortals.length + '</td>'
    + '<td class="filterRes" style="cursor:pointer" class="sorted">Resistance Portals : </td><td class="filterRes">' + window.plugin.portalslist.resP +' (' + Math.floor(window.plugin.portalslist.resP/window.plugin.portalslist.listPortals.length*100) + '%)</td>'
    + '<td class="filterEnl" style="cursor:pointer" class="sorted">Enlightened Portals : </td><td class="filterEnl">'+ window.plugin.portalslist.enlP +' (' + Math.floor(window.plugin.portalslist.enlP/window.plugin.portalslist.listPortals.length*100) + '%)</td>'
    + '</tr>'
    + '</table>';
  return html;
}

// A little helper function so the above isn't so messy
window.plugin.portalslist.portalTableHeaderSortAttr = function(name, by, defOrder, extraClass) {
  // data-sort attr: used by jquery .data('sort') below
  var retVal = 'data-sort="'+name+'" data-defaultorder="'+defOrder+'" class="'+(extraClass?extraClass+' ':'')+'sortable'+(name==by?' sorted':'')+'"';

  return retVal;
};

// portal link - single click: select portal
//               double click: zoom to and select portal
//               hover: show address
// code from getPortalLink function by xelio from iitc: AP List - https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/ap-list.user.js
window.plugin.portalslist.getPortalLink = function(portal,guid) {
  var coord = portal.portal.getLatLng();
  var latlng = [coord.lat, coord.lng].join();
  var jsSingleClick = 'window.renderPortalDetails(\''+guid+'\');return false';
  var jsDoubleClick = 'window.zoomToAndShowPortal(\''+guid+'\', ['+latlng+']);return false';
  var perma = '/intel?ll='+coord.lat+','+coord.lng+'&z=17&pll='+coord.lat+','+coord.lng;

  //Use Jquery to create the link, which escape characters in TITLE and ADDRESS of portal
  var a = $('<a>',{
    text: portal.name,
//    title: portal.name,
    href: perma,
    onClick: jsSingleClick,
    onDblClick: jsDoubleClick
  })[0].outerHTML;

  return a;
}

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
    $('#toolbox').append(' <a onclick="window.plugin.portalslist.displayPL()" title="Display a list of portals in the current view">Portals list</a>');
  }

  $('head').append('<style>' +
    '#portalslist.mobile {background: transparent; border: 0 none !important; height: 100% !important; width: 100% !important; left: 0 !important; top: 0 !important; position: absolute; overflow: auto; }' +
    '#portalslist table { margin-top:5px; border-collapse: collapse; empty-cells: show; width: 100%; clear: both; }' +
    '#portalslist table td, #portalslist table th {border-bottom: 1px solid #0b314e; padding:3px; color:white; background-color:#1b415e}' +
    '#portalslist table tr.res td { background-color: #005684; }' +
    '#portalslist table tr.enl td { background-color: #017f01; }' +
    '#portalslist table tr.neutral td { background-color: #000000; }' +
    '#portalslist table th { text-align: center; }' +
    '#portalslist table td { text-align: center; }' +
    '#portalslist table.portals td { white-space: nowrap; }' +
    '#portalslist table td.portalTitle { text-align: left;}' +
    '#portalslist table th.sortable { cursor:pointer;}' +
    '#portalslist table th.portalTitle { text-align: left;}' +
    '#portalslist table .portalTitle { min-width: 120px !important; max-width: 240px !important; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }' +
    '#portalslist table .apGain { text-align: right !important; }' +
    '#portalslist .sorted { color:#FFCE00; }' +
    '#portalslist .filterAll { margin-top: 10px;}' +
    '#portalslist .filterRes { margin-top: 10px; background-color: #005684  }' +
    '#portalslist .filterEnl { margin-top: 10px; background-color: #017f01  }' +
    '#portalslist .disclaimer { margin-top: 10px; font-size:10px; }' +
    '</style>');

  // Setup sorting
  $(document).on('click.portalslist', '#portalslist table th.sortable', function() {
    var sortBy = $(this).data('sort');
    // if this is the currently selected column, toggle the sort order - otherwise use the columns default sort order
    var sortOrder = sortBy == window.plugin.portalslist.sortBy ? window.plugin.portalslist.sortOrder*-1 : parseInt($(this).data('defaultorder'));
    $('#portalslist').html(window.plugin.portalslist.portalTable(sortBy,sortOrder,window.plugin.portalslist.filter));
  });

  $(document).on('click.portalslist', '#portalslist .filterAll', function() {
    $('#portalslist').html(window.plugin.portalslist.portalTable(window.plugin.portalslist.sortBy,window.plugin.portalslist.sortOrder,0));
  });
  $(document).on('click.portalslist', '#portalslist .filterRes', function() {
    $('#portalslist').html(window.plugin.portalslist.portalTable(window.plugin.portalslist.sortBy,window.plugin.portalslist.sortOrder,1));
  });
  $(document).on('click.portalslist', '#portalslist .filterEnl', function() {
    $('#portalslist').html(window.plugin.portalslist.portalTable(window.plugin.portalslist.sortBy,window.plugin.portalslist.sortOrder,2));
  });
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
