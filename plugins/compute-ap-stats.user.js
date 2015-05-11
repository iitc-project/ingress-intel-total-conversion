// ==UserScript==
// @id             iitc-plugin-compute-ap-stats@Hollow011
// @name           IITC plugin: Compute AP statistics
// @category       Info
// @version        0.4.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Displays the per-team AP gains available in the current view.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @include        https://www.ingress.com/mission/*
// @include        http://www.ingress.com/mission/*
// @match          https://www.ingress.com/mission/*
// @match          http://www.ingress.com/mission/*
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
  if (window.plugin.compAPStats.timer) {
    clearTimeout(window.plugin.compAPStats.timer);
    window.plugin.compAPStats.timer = undefined;
  }

  window.plugin.compAPStats.update(true);
}

window.plugin.compAPStats.requestFinished = function() {
  // process on a short delay, so if multiple requests finish in a short time we only calculate once
  if (window.plugin.compAPStats.timer === undefined) {
    window.plugin.compAPStats.timer = setTimeout( function() {
      window.plugin.compAPStats.timer = undefined;
      window.plugin.compAPStats.update(false);
    }, 0.75*1000);
  }
}

window.plugin.compAPStats.update = function(hasFinished) {
  var result = window.plugin.compAPStats.compAPStats();
  var loading = hasFinished ? '' : 'Loading...';

  var formatRow = function(team,data) {
    var title = 'Destroy and capture '+data.destroyPortals+' portals\n'
              + 'Destroy '+data.destroyLinks+' links and '+data.destroyFields+' fields\n'
              + 'Capture '+data.capturePortals+' neutral portals, complete '+data.finishPortals+' portals\n'
              + '(unknown additional AP for links/fields)';
    return '<tr><td>'+team+'</td><td style="text-align:right" title="'+title+'">'+digits(data.AP)+'</td></tr>';
  }


  $('#available_ap_display').html('Available AP in this area: '
    + loading
    + '<table>'
    + formatRow('Enlightened',result.enl)
    + formatRow('Resistance', result.res)
    + '</table>');
}


window.plugin.compAPStats.compAPStats = function() {

  var result = {
    res: { AP: 0, destroyPortals: 0, capturePortals: 0, finishPortals: 0, destroyLinks: 0, destroyFields: 0 },
    enl: { AP: 0, destroyPortals: 0, capturePortals: 0, finishPortals: 0, destroyLinks: 0, destroyFields: 0 },
  };


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
    var completePortalAp = 0;
    var isFullyDeployed = data.resCount == 8;
    if (!isFullyDeployed) {
      completePortalAp = data.resCount != 8 ? (8-data.resCount)*DEPLOY_RESONATOR + COMPLETION_BONUS : 0;
    }

    // AP to destroy this portal
    var destroyAp = data.resCount * DESTROY_RESONATOR;

    if (portal.options.team == TEAM_ENL) {
      result.res.AP += destroyAp + PORTAL_FULL_DEPLOY_AP;
      result.res.destroyPortals++;
      if (!isFullyDeployed) {
        result.enl.AP += completePortalAp;
        result.enl.finishPortals++;
      }
    }
    else if (portal.options.team == TEAM_RES) {
      result.enl.AP += destroyAp + PORTAL_FULL_DEPLOY_AP;
      result.enl.destroyPortals++;
      if (!isFullyDeployed) {
        result.res.AP += completePortalAp;
        result.res.finishPortals++;
      }
    } else {
      // it's a neutral portal, potential for both teams.  by definition no fields or edges
      result.enl.AP += PORTAL_FULL_DEPLOY_AP;
      result.enl.capturePortals++;
      result.res.AP += PORTAL_FULL_DEPLOY_AP;
      result.res.capturePortals++;
    }
  });

  // now every link that starts/ends at a point on screen
  $.each(window.links, function(guid, link) {
    // only consider links that start/end on-screen
    var points = link.getLatLngs();
    if (displayBounds.contains(points[0]) || displayBounds.contains(points[1])) {
      if (link.options.team == TEAM_ENL) {
        result.res.AP += DESTROY_LINK;
        result.res.destroyLinks++;
      } else if (link.options.team == TEAM_RES) {
        result.enl.AP += DESTROY_LINK;
        result.enl.destroyLinks++;
      }
    }
  });

  // and now all fields that have a vertex on screen
  $.each(window.fields, function(guid, field) {
    // only consider fields with at least one vertex on screen
    var points = field.getLatLngs();
    if (displayBounds.contains(points[0]) || displayBounds.contains(points[1]) || displayBounds.contains(points[2])) {
      if (field.options.team == TEAM_ENL) {
        result.res.AP += DESTROY_FIELD;
        result.res.destroyFields++;
      } else if (field.options.team == TEAM_RES) {
        result.enl.AP += DESTROY_FIELD;
        result.enl.destroyFields++;
      }
    }
  });

  return result;
}

var setup =  function() {
  window.plugin.compAPStats.setupCallback();
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
