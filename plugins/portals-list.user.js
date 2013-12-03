// ==UserScript==
// @id             iitc-plugin-portals-list@teo96
// @name           IITC plugin: show list of portals
// @category       Info
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Display a sortable list of all visible portals with full details about the team, resonators, shields, etc.
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
window.plugin.portalslist.sortOrder=-1;
window.plugin.portalslist.enlP = 0;
window.plugin.portalslist.resP = 0;
window.plugin.portalslist.filter=0;

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
    var teamN = window.TEAM_NONE;

    switch (d.team){
      case 'RESISTANCE' :
        window.plugin.portalslist.resP++;
        teamN = window.TEAM_RES
        break;
      case 'ENLIGHTENED' :
        window.plugin.portalslist.enlP++;
        teamN = window.TEAM_ENL;
        break;
    }
    var l = window.getPortalLinks(i);
    var f = window.getPortalFields(i);

    var thisPortal = {
      'portal': portal,
      'guid': i,
      'teamN': teamN,
      'name': d.title,
      'team': d.team,
      'level': portal.options.level,
      'health': d.health,
      'resCount': d.resCount,
      'img': d.img,
      'linkCount': l.in.length + l.out.length,
      'link' : l,
      'fieldCount': f.length,
      'field' : f
    };
    window.plugin.portalslist.listPortals.push(thisPortal);
  });

  return retval;
}

window.plugin.portalslist.displayPL = function() {
  var html = '';
  window.plugin.portalslist.sortOrder=-1;
  window.plugin.portalslist.enlP = 0;
  window.plugin.portalslist.resP = 0;

  if (window.plugin.portalslist.getPortals()) {
    html += window.plugin.portalslist.portalTable('level', window.plugin.portalslist.sortOrder,window.plugin.portalslist.filter);
  } else {
    html = '<table><tr><td>Nothing to show!</td></tr></table>';
  };

  dialog({
    html: '<div id="portalslist">' + html + '</div>',
    dialogClass: 'ui-dialog-portalslist',
    title: 'Portal list: ' + window.plugin.portalslist.listPortals.length + ' ' + (window.plugin.portalslist.listPortals.length == 1 ? 'portal' : 'portals'),
    id: 'portal-list',
    width: 700
  });

  //run the name resolving process
  //resolvePlayerNames();
}

window.plugin.portalslist.portalTable = function(sortBy, sortOrder, filter) {
  // sortOrder <0 ==> desc, >0 ==> asc, i use sortOrder * -1 to change the state
  window.plugin.portalslist.filter=filter;
  var portals=window.plugin.portalslist.listPortals;

  //Array sort
  window.plugin.portalslist.listPortals.sort(function(a, b) {
    var retVal = 0;
    switch (sortBy) {
      case 'names':
        retVal = a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
        break;
      default:
        retVal = b[sortBy] - a[sortBy];
        break;
    }
    if (sortOrder > 0) retVal = -retVal; //thx @jonatkins
    return retVal;
  });

  var sort = window.plugin.portalslist.portalTableSort;
  var html = window.plugin.portalslist.stats();
  html += '<table>'
    + '<tr><th ' + sort('names', sortBy, -1) + '>Portal</th>'
    + '<th ' + sort('level', sortBy, -1) + '>Level</th>'
    + '<th title="Team" ' + sort('teamN', sortBy, -1) + '>Team</th>'
    + '<th ' + sort('health', sortBy, -1) + '>Health</th>'
    + '<th ' + sort('resCount', sortBy, -1) + '>Resonator Count</th>'
    + '<th ' + sort('linkCount', sortBy, -1) + '>Link Count</th>'
    + '<th ' + sort('fieldCount', sortBy, -1) + '>Field Count</th>'


  $.each(portals, function(ind, portal) {
    if (filter === TEAM_NONE || filter === portal.teamN) {
      html += '<tr class="' + (portal.teamN === window.TEAM_RES ? 'res' : (portal.teamN === window.TEAM_ENL ? 'enl' : 'neutral')) + '">'
        + '<td style="">' + window.plugin.portalslist.getPortalLink(portal, portal.guid) + '</td>'
        + '<td class="L' + Math.floor(portal.level) +'">' + portal.level + '</td>'
        + '<td style="text-align:center;">' + portal.team + '</td>';

      html += '<td style="cursor:help" title="'+ portal.health +'">' + portal.health + '</td>'
        + '<td>' + portal.resCount + '</td>'
        + '<td title="In: ' + portal.link.in.length + ' Out: ' + portal.link.out.length + '">' + portal.linkCount + '</td>'
        + '<td>' + portal.fieldCount + '</td>';

      html+= '</tr>';
    }
  });
  html += '</table>';

  html += '<div class="disclaimer">Click on portals table headers to sort by that column. '
    + 'Click on <b>All Portals, Resistance Portals, Enlightened Portals</b> to filter<br>'
    + 'Thanks to @vita10gy & @xelio for their IITC plugins who inspired me. A <a href="https://plus.google.com/113965246471577467739">@teo96</a> production. Vive la Résistance !</div>';

  window.plugin.portalslist.sortOrder = window.plugin.portalslist.sortOrder*-1;
  return html;
}

window.plugin.portalslist.stats = function(sortBy) {
  var html = '<table><tr>'
    + '<td class="filterAll" style="cursor:pointer"  onclick="window.plugin.portalslist.portalTable(\'level\',-1,0)"><a href=""></a>All Portals : (click to filter)</td><td class="filterAll">' + window.plugin.portalslist.listPortals.length + '</td>'
    + '<td class="filterRes" style="cursor:pointer" class="sorted" onclick="window.plugin.portalslist.portalTable(\'level\',-1,1)">Resistance Portals : </td><td class="filterRes">' + window.plugin.portalslist.resP +' (' + Math.floor(window.plugin.portalslist.resP/window.plugin.portalslist.listPortals.length*100) + '%)</td>'
    + '<td class="filterEnl" style="cursor:pointer" class="sorted" onclick="window.plugin.portalslist.portalTable(\'level\',-1,2)">Enlightened Portals : </td><td class="filterEnl">'+ window.plugin.portalslist.enlP +' (' + Math.floor(window.plugin.portalslist.enlP/window.plugin.portalslist.listPortals.length*100) + '%)</td>'
    + '</tr>'
    + '</table>';
  return html;
}

// A little helper function so the above isn't so messy
window.plugin.portalslist.portalTableSort = function(name, by) {
  var retVal = 'data-sort="' + name + '"';
  if(name === by) {
    retVal += ' class="sorted"';
  }
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
  var perma = '/intel?latE6='+coord.lat+'&lngE6='+coord.lng+'&z=17&pguid='+guid;

  //Use Jquery to create the link, which escape characters in TITLE and ADDRESS of portal
  var a = $('<a>',{
    "class": 'help',
    text: portal.name,
    title: portal.name,
    href: perma,
    onClick: jsSingleClick,
    onDblClick: jsDoubleClick
  })[0].outerHTML;
  var div = '<div class="portalTitle">'+a+'</div>';
  return div;
}

var setup =  function() {
  $('#toolbox').append(' <a onclick="window.plugin.portalslist.displayPL()" title="Display a list of portals in the current view">Portals list</a>');
  $('head').append('<style>' +
    '#portalslist table {margin-top:5px; border-collapse: collapse; empty-cells: show; width:100%; clear: both;}' +
    '#portalslist table td, #portalslist table th {border-bottom: 1px solid #0b314e; padding:3px; color:white; background-color:#1b415e}' +
    '#portalslist table tr.res td { background-color: #005684; }' +
    '#portalslist table tr.enl td { background-color: #017f01; }' +
    '#portalslist table tr.neutral td { background-color: #000000; }' +
    '#portalslist table th { text-align: center;}' +
    '#portalslist table td { text-align: center;}' +
    '#portalslist table td:nth-child(1) { text-align: left;}' +
    '#portalslist table th { cursor:pointer;}' +
    '#portalslist table th:nth-child(1) { text-align: left;}' +
    '#portalslist table th.sorted { color:#FFCE00; }' +
    '#portalslist .filterAll { margin-top: 10px;}' +
    '#portalslist .filterRes { margin-top: 10px; background-color: #005684  }' +
    '#portalslist .filterEnl { margin-top: 10px; background-color: #017f01  }' +
    '#portalslist .disclaimer { margin-top: 10px; font-size:10px; }' +
    '#portalslist .portalTitle { display: inline-block; width: 160px !important; min-width: 160px !important; max-width: 160px !important; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }' +
    '</style>');
  // Setup sorting
  $(document).on('click.portalslist', '#portalslist table th', function() {
    $('#portalslist').html(window.plugin.portalslist.portalTable($(this).data('sort'),window.plugin.portalslist.sortOrder,window.plugin.portalslist.filter));
  });
  $(document).on('click.portalslist', '#portalslist .filterAll', function() {
    $('#portalslist').html(window.plugin.portalslist.portalTable($(this).data('sort'),window.plugin.portalslist.sortOrder,0));
  });
  $(document).on('click.portalslist', '#portalslist .filterRes', function() {
    $('#portalslist').html(window.plugin.portalslist.portalTable($(this).data('sort'),window.plugin.portalslist.sortOrder,1));
  });
  $(document).on('click.portalslist', '#portalslist .filterEnl', function() {
    $('#portalslist').html(window.plugin.portalslist.portalTable($(this).data('sort'),window.plugin.portalslist.sortOrder,2));
  });
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
