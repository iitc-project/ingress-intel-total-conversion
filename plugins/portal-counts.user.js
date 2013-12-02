// ==UserScript==
// @id             iitc-plugin-portals-count@yenky
// @name           IITC plugin: Show total counts of portals
// @category       Info
// @version        0.0.9.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Display a list of all localized portals by level and faction
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

/* whatsnew
* 0.0.8 : use dialog() instead of alert()
* 0.0.6 : ignoring outside bounds portals (even if close to)
* 0.0.5 : changed table layout, added some colors
* 0.0.4 : reverse show order of portals, using MAX_PORTAL_LEVEL now for array, changed table layout to be more compact, cleaned up code
* 0.0.3 : fixed incorrect rounded portal levels, adjusted viewport
* 0.0.2 : fixed counts to be reset after scrolling
* 0.0.1 : initial release, show count of portals
* todo : 
*/ 

// use own namespace for plugin
window.plugin.portalcounts = function() {};

//count portals for each level available on the map
window.plugin.portalcounts.getPortals = function(){
  //console.log('** getPortals');
  var retval=false;
  var displayBounds = map.getBounds();
  window.plugin.portalcounts.enlP = 0;
  window.plugin.portalcounts.resP = 0;
  window.plugin.portalcounts.neuP = 0;
    
  window.plugin.portalcounts.PortalsEnl = new Array();
  window.plugin.portalcounts.PortalsRes = new Array();
  for(var level = window.MAX_PORTAL_LEVEL; level > 0; level--){
    window.plugin.portalcounts.PortalsEnl[level] = 0;
    window.plugin.portalcounts.PortalsRes[level] = 0;
  }
    
  $.each(window.portals, function(i, portal) {
    retval=true;
    var level = portal.options.level;
    var team = portal.options.team;
    // just count portals in viewport
    if(!displayBounds.contains(portal.getLatLng())) return true;
    switch (team){
      case 1 :
        window.plugin.portalcounts.resP++;
        window.plugin.portalcounts.PortalsRes[level]++;
        break;
      case 2 :
        window.plugin.portalcounts.enlP++;
        window.plugin.portalcounts.PortalsEnl[level]++;
        break;
      default:
        window.plugin.portalcounts.neuP++;
        break;
    }
  });
  
  //get portals informations from IITC
  var minlvl = getMinPortalLevel();

  var counts = '<table>';
  if(retval) {
    counts += '<tr><th></th><th class="enl">Enlightened</th><th class="res">Resistance</th></tr>';  //'+window.plugin.portalcounts.enlP+' Portal(s)</th></tr>';
    for(var level = window.MAX_PORTAL_LEVEL; level > 0; level--){
      counts += '<tr><td class="L'+level+'">Level '+level+'</td>';
      if(minlvl > level)
        counts += '<td colspan="2">zoom in to see portals in this level</td>';
      else
        counts += '<td class="enl">'+window.plugin.portalcounts.PortalsEnl[level]+'</td><td class="res">'+window.plugin.portalcounts.PortalsRes[level]+'</td>';
      counts += '</tr>';
    }

    counts += '<tr><th>Total:</th><td class="enl">'+window.plugin.portalcounts.enlP+'</td><td class="res">'+window.plugin.portalcounts.resP+'</td></tr>';

    counts += '<tr><td>Neutral:</td><td colspan="2">';
    if(minlvl > 0)
      counts += 'zoom in to see unclaimed portals';
    else
      counts += window.plugin.portalcounts.neuP;
    counts += '</td></tr>';

  } else
    counts += '<tr><td>No Portals in range!</td></tr>';
  counts += '</table>';


  var total = window.plugin.portalcounts.enlP + window.plugin.portalcounts.resP + window.plugin.portalcounts.neuP;
  dialog({
    html: '<div id="portalcounts">' + counts + '</div>',
    title: 'Portal counts: ' + total + ' ' + (total == 1 ? 'portal' : 'portals'),
  });
}

var setup =  function() {
  $('#toolbox').append(' <a onclick="window.plugin.portalcounts.getPortals()" title="Display a summary of portals in the current view">Portal counts</a>');
  $('head').append('<style>' + 
    '#portalcounts table {margin-top:5px; border-collapse: collapse; empty-cells: show; width:100%; clear: both;}' +
    '#portalcounts table td, #portalcounts table th {border-bottom: 1px solid #0b314e; padding:3px; color:white; background-color:#1b415e}' +
    '#portalcounts table tr.res th {  background-color: #005684; }' +
    '#portalcounts table tr.enl th {  background-color: #017f01; }' +
    '#portalcounts table th { text-align: center;}' +
    '#portalcounts table td { text-align: center;}' +
    '#portalcounts table td.L0 { background-color: #000000 !important;}' +
    '#portalcounts table td.L1 { background-color: #FECE5A !important;}' +
    '#portalcounts table td.L2 { background-color: #FFA630 !important;}' +
    '#portalcounts table td.L3 { background-color: #FF7315 !important;}' +
    '#portalcounts table td.L4 { background-color: #E40000 !important;}' +
    '#portalcounts table td.L5 { background-color: #FD2992 !important;}' +
    '#portalcounts table td.L6 { background-color: #EB26CD !important;}' +
    '#portalcounts table td.L7 { background-color: #C124E0 !important;}' +
    '#portalcounts table td.L8 { background-color: #9627F4 !important;}' + 
    '#portalcounts table td:nth-child(1) { text-align: left;}' +
    '#portalcounts table th:nth-child(1) { text-align: left;}' +
    '</style>');
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
