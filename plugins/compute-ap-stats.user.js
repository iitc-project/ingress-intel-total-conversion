// ==UserScript==
// @id             iitc-plugin-compute-ap-stats@Hollow011
// @name           IITC plugin: Compute AP statistics
// @category       Info
// @version        0.3.1.@@DATETIMEVERSION@@
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
  window.plugin.compAPStats.onPositionMove();

  // make the value update when the map data updates
  window.addHook('mapDataRefreshEnd', window.plugin.compAPStats.onPositionMove);

}

window.plugin.compAPStats.onPositionMove = function() {
  var result = window.plugin.compAPStats.compAPStats();
  $('#available_ap_display').html('Available AP in this area:<table>'
    + '<tr><td>Enlightened:</td><td style="text-align:right">' + digits(result[1]) + '</td></tr>'
    + '<tr><td>Resistance:</td><td style="text-align:right">' + digits(result[0]) + '</td></tr>'
    + '</table>');
}

window.plugin.compAPStats.missingResonatorAP = function(portal) {
  var resAP = 0;
  var missing_resonators = 0;
  $.each(portal.resonatorArray.resonators, function(ind, reso) {
    if(reso === null) {
      missing_resonators++;
    }
  });
  if(missing_resonators > 0) {
    resAP = window.DEPLOY_RESONATOR * missing_resonators;
    resAP += window.COMPLETION_BONUS;
  }
  return(resAP);
};

window.plugin.compAPStats.compAPStats = function() {

  var totalAP_RES = 0;
  var totalAP_ENL = 0;

  var allResEdges = [];
  var allResFields = [];
  var allEnlEdges = [];
  var allEnlFields = [];

  var displayBounds = map.getBounds();

  // Grab every portal in the viewable area and compute individual AP stats
  $.each(window.portals, function(ind, portal) {
    var d = portal.options.details;

    // eliminate offscreen portals (selected, and in padding)
    if(!displayBounds.contains(portal.getLatLng())) return true;

    var portalStats = getAttackApGain(d);
    var portalSum = portalStats.resoAp + portalStats.captureAp;

    if (getTeam(d) === TEAM_ENL) {
      totalAP_RES += portalSum;

      $.each(d.portalV2.linkedEdges||[], function(ind, edge) {
        if(!edge) return true;
        allEnlEdges.push(edge.edgeGuid);
      });

      $.each(d.portalV2.linkedFields||[], function(ind, field) {
        if(!field) return true;
        allEnlFields.push(field);
      });
      
      totalAP_ENL += window.plugin.compAPStats.missingResonatorAP(d);
      
    }
    else if (getTeam(d) === TEAM_RES) {
      totalAP_ENL += portalSum;

      $.each(d.portalV2.linkedEdges||[], function(ind, edge) {
        if(!edge) return true;
        allResEdges.push(edge.edgeGuid);
      });

      $.each(d.portalV2.linkedFields||[], function(ind, field) {
        if(!field) return true;
        allResFields.push(field);
      });
      
      totalAP_RES += window.plugin.compAPStats.missingResonatorAP(d);
      
    } else {
      // it's a neutral portal, potential for both teams.  by definition no fields or edges
      totalAP_ENL += portalSum;
      totalAP_RES += portalSum;
    }
  });

  // Compute team field AP
  allResFields = uniqueArray(allResFields);
  totalAP_ENL += (allResFields.length * DESTROY_FIELD);
  allEnlFields = uniqueArray(allEnlFields);
  totalAP_RES += (allEnlFields.length * DESTROY_FIELD);

  // Compute team Link AP
  allResEdges = uniqueArray(allResEdges);
  totalAP_ENL += (allResEdges.length * DESTROY_LINK);
  allEnlEdges = uniqueArray(allEnlEdges);
  totalAP_RES += (allEnlEdges.length * DESTROY_LINK);

  return [totalAP_RES, totalAP_ENL];
}

var setup =  function() {
  window.plugin.compAPStats.setupCallback();
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
