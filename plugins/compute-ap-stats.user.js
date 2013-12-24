// ==UserScript==
// @id             iitc-plugin-compute-ap-stats@Hollow011
// @name           IITC plugin: Compute AP statistics
// @category       Info
// @version        0.4.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Displays the per-team AP gains available in the current view.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.compAPStats = function() {};

window.plugin.compAPStats.setupCallback = function() {
  // add a new div to the bottom of the sidebar and style it
  $('#sidebar').append('<div id="available_ap_display"></div>');
  $('#available_ap_display').css({'color':'#ffce00', 'font-size':'90%', 'padding':'4px 2px'});

  // do an initial calc for sidebar sizing purposes
  window.plugin.compAPStats.update(false);

  // make the value update when the map data updates
  window.addHook('mapDataRefreshEnd', window.plugin.compAPStats.mapDataRefreshEnd);
  window.addHook('requestFinished', window.plugin.compAPStats.requestFinished);

}

window.plugin.compAPStats.mapDataRefreshEnd = function() {
  window.plugin.compAPStats.update(true);
}

window.plugin.compAPStats.requestFinished = function() {
  window.plugin.compAPStats.update(false);
}

window.plugin.compAPStats.update = function(hasFinished) {
  var result = window.plugin.compAPStats.compAPStats();
  var loading = hasFinished ? '' : 'Loading...';
  $('#available_ap_display').html('Available AP in this area: '
    + loading
    + '<table>'
    + '<tr><td>Enlightened:</td><td style="text-align:right">' + digits(result[1]) + '</td></tr>'
    + '<tr><td>Resistance:</td><td style="text-align:right">' + digits(result[0]) + '</td></tr>'
    + '</table>');
}


window.plugin.compAPStats.compAPStats = function() {

  var totalAP_RES = 0;
  var totalAP_ENL = 0;

  var allResEdges = [];
  var allResFields = [];
  var allEnlEdges = [];
  var allEnlFields = [];

  var displayBounds = map.getBounds();

  // AP to fully deploy a neutral portal
  var PORTAL_FULL_DEPLOY_AP = CAPTURE_PORTAL + 8*DEPLOY_RESONATOR + COMPLETION_BONUS;

  // Grab every portal in the viewable area and compute individual AP stats
  // (fields and links are counted separately below)
  $.each(window.portals, function(ind, portal) {
    var data = portal.options.data;

    // eliminate offscreen portals
    if(!displayBounds.contains(portal.getLatLng())) return true; //$.each 'continue'

    // AP to complete a portal - assuming it's already captured (so no CAPTURE_PORTAL)
    var completePortalAp = data.resCount != 8 ? (8-data.resCount)*DEPLOY_RESONATOR + COMPLETION_BONUS : 0;

    // AP to destroy this portal
    var destroyAp = data.resCount * DESTROY_RESONATOR;

    if (portal.options.team == TEAM_ENL) {
      totalAP_RES += destroyAp + PORTAL_FULL_DEPLOY_AP;
      totalAP_ENL += completePortalAp;
    }
    else if (portal.options.team == TEAM_RES) {
      totalAP_ENL += destroyAp + PORTAL_FULL_DEPLOY_AP;
      totalAP_RES += completePortalAp
    } else {
      // it's a neutral portal, potential for both teams.  by definition no fields or edges
      totalAP_ENL += PORTAL_FULL_DEPLOY_AP;
      totalAP_RES += PORTAL_FULL_DEPLOY_AP;
    }
  });

  // now every link that starts/ends at a point on screen
  $.each(window.links, function(guid, link) {
    // only consider links that start/end on-screen
    var points = link.getLatLngs();
    if (displayBounds.contains(points[0]) || displayBounds.contains(points[1])) {
      if (link.options.team == TEAM_ENL) {
        totalAP_RES += DESTROY_LINK;
      } else if (link.options.team == TEAM_RES) {
        totalAP_ENL += DESTROY_LINK;
      }
    }
  });

  // and now all fields that have a vertex on screen
  $.each(window.fields, function(guid, field) {
    // only consider fields with at least one vertex on screen
    var points = field.getLatLngs();
    if (displayBounds.contains(points[0]) || displayBounds.contains(points[1]) || displayBounds.contains(points[2])) {
      if (field.options.team == TEAM_ENL) {
        totalAP_RES += DESTROY_FIELD;
      } else if (field.options.team == TEAM_RES) {
        totalAP_ENL += DESTROY_FIELD;
      }
    }
  });

  return [totalAP_RES, totalAP_ENL];
}

var setup =  function() {
  window.plugin.compAPStats.setupCallback();
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
