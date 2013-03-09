// ==UserScript==
// @id             iitc-plugin-ap-list@xelio
// @name           iitc: AP List
// @version        0.2
// @namespace      https://github.com/breunigs/ingress-intel-total-conversion
// @updateURL      https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/ap-list.user.js
// @downloadURL    https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/ap-list.user.js
// @description    List top 10 portals by AP of either faction. Hover over AP will show breakdown of AP. Click on portal name will select the portal. Double click on portal name will zoom to and select portal. Portals before zooming in will be cached and count in top portal. They will be cleared if you click the "↻ R" or move out of the area. 
// @include        https://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// ==/UserScript==

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.apList = function() {
};

window.plugin.apList.cachedPortals = {};
window.plugin.apList.useCachedPortals = false;
window.plugin.apList.cacheBounds;
window.plugin.apList.cacheActiveZoomLevel;
window.plugin.apList.SIDE_FRIENDLY = 0;
window.plugin.apList.SIDE_ENEMY = 1;
window.plugin.apList.sides = new Array(2);
window.plugin.apList.topPortals = new Array(2);
window.plugin.apList.minPortalAp = new Array(2);
window.plugin.apList.topMaxCount = 10;
window.plugin.apList.playerApGainFunc = new Array(2);
window.plugin.apList.displaySide = window.plugin.apList.SIDE_ENEMY;

window.plugin.apList.sideLabelClass = {};


window.plugin.apList.handleUpdate = function() {
  if(!requests.isLastRequest('getThinnedEntitiesV2')) return;
  plugin.apList.updateTopPortals();
  plugin.apList.updatePortalTable(plugin.apList.displaySide);
}

// Generate html table from top portals
window.plugin.apList.updatePortalTable = function(side) {
  var content = '<table style="width: ' + $('#sidebar').width() + 'px; table-layout:fixed">';
  for(var i = 0; i < plugin.apList.topPortals[side].length; i++) {
    var portal = plugin.apList.topPortals[side][i];
    content += '<tr>'
            + '<td style="width: 78%; overflow:hidden; white-space:nowrap">'
            + plugin.apList.getPortalLink(portal)
            + '</td>'
            + '<td style="padding-left: 10px">'
            + plugin.apList.getPortalApText(portal)
            + '</td>'
            + '</tr>';
  }
  content += "</table>";
  $('div#ap-list-table').html(content);
}

// Combine title and test
window.plugin.apList.getPortalApText = function(portal) {
  var title = plugin.apList.getPortalApTitle(portal);
  return '<div class="help" title="' + title + '">' + portal.playerApGain.totalAp + '</div>';
}

// Friendly portal will get resonator upgrade list, enemy
// portal will get ap breakdown
window.plugin.apList.getPortalApTitle = function(portal) {
  var t;
  var playerApGain = portal.playerApGain;
  if(plugin.apList.portalSide(portal) === plugin.apList.SIDE_FRIENDLY) {
    t = 'Deploy &amp; Upgrade\n';
    for(var i = 0; i < playerApGain.upgradedReso.length; i++) {
      var reso = playerApGain.upgradedReso[i];
      var apGain = (reso.level === 0) ? DEPLOY_RESONATOR : UPGRADE_ANOTHERS_RESONATOR;
      t += 'Resonator on ' + OCTANTS[reso.slot] + '\t' + reso.level + '-&gt;'
        + reso.newLevel + '\t= ' + apGain + '\n';
    }
    t += 'Sum: ' + digits(playerApGain.totalAp) + ' AP';
  }else{
    t = 'Destroy &amp; Capture:\n'
      + playerApGain.resoCount + '×\tResonators\t= ' + digits(playerApGain.resoAp) + '\n'
      + playerApGain.linkCount + '×\tLinks\t= ' + digits(playerApGain.linkAp) + '\n'
      + playerApGain.fieldCount + '×\tFields\t= ' + digits(playerApGain.fieldAp) + '\n'
      + '1×\tCapture\t= ' + CAPTURE_PORTAL + '\n'
      + '8×\tDeploy\t= ' + (8 * DEPLOY_RESONATOR) + '\n'
      + '1×\tBonus\t= ' + COMPLETION_BONUS + '\n'
      + 'Sum: ' + digits(playerApGain.totalAp) + ' AP';
  }
  return t;
}

// portal link - single click: select portal
//               double click: zoom to and select portal
//               hover: show address
window.plugin.apList.getPortalLink = function(portal) {
  var latlng = [portal.locationE6.latE6/1E6, portal.locationE6.lngE6/1E6];
  var jsSingleClick = 'window.renderPortalDetails(\''+portal.guid+'\');return false';
  var jsDoubleClick = 'window.zoomToAndShowPortal(\''+portal.guid+'\', ['+latlng[0]
         +', '+latlng[1]+']);return false';
  var perma = 'https://ingress.com/intel?latE6='+portal.locationE6.latE6
            +'&lngE6='+portal.locationE6.lngE6+'&z=17&pguid='+portal.guid;
  var a = '<a class="help" onclick="'+jsSingleClick+'"'
        + 'ondblclick="'+jsDoubleClick+'"'
        + ' title="'+ portal.portalV2.descriptiveText.ADDRESS +'"'
        + ' href="'+perma+'">'
        + portal.portalV2.descriptiveText.TITLE
        + '</a>';
  var div = '<div style="white-space: nowrap; overflow: hidden; text-overflow:ellipsis;"'+a+'</div>';
  return div;
}

// Loop through portals and get playerApGain, then find top portals
window.plugin.apList.updateTopPortals = function() {
  plugin.apList.topPortals[plugin.apList.SIDE_FRIENDLY] = new Array();
  plugin.apList.topPortals[plugin.apList.SIDE_ENEMY] = new Array();
  plugin.apList.minPortalAp[plugin.apList.SIDE_FRIENDLY] = 0;
  plugin.apList.minPortalAp[plugin.apList.SIDE_ENEMY] = 0;

  // Make a backup of cachedPortals
  // If cache is not enabled, empty cachedPortals. In following
  // "$.each" loop, the backup portal will copy back into 
  // cachedPortals if it exist in "window.portals"" and didn't change.'
  var oldcachedPortal = $.extend({},plugin.apList.cachedPortals);
  if(!plugin.apList.useCachedPortals)
    plugin.apList.cachedPortals = {};

  $.each(Object.keys(window.portals), function(ind, key) {
    if(getTypeByGuid(key) !== TYPE_PORTAL)
      return true;

    var portal = window.portals[key].options.details;
    var cachedPortal = oldcachedPortal[key];
    // If portal is changed, update playerApGain with latest
    // information
    if(!plugin.apList.isSamePortal(portal,cachedPortal)) {
      // Copy portal detail to cachedPortal
      cachedPortal = $.extend({},portal);
      var side = plugin.apList.portalSide(portal);
      var getApGainFunc = plugin.apList.playerApGainFunc[side];
      // Assign playerApGain and guid to cachedPortal
      cachedPortal.playerApGain = getApGainFunc(portal);
      cachedPortal.guid = window.portals[key].options.guid;
    }
    plugin.apList.cachedPortals[key] = cachedPortal;

    // If caching function not enabled, only use portal exist in
    // window.portals to count top portal
    if(!plugin.apList.useCachedPortals)
      plugin.apList.addToTopPortals(cachedPortal);
  });

  // If caching function enabled, use all cached portal to count 
  // top portals
  if(plugin.apList.useCachedPortals) {
    $.each(Object.keys(plugin.apList.cachedPortals), function(ind, key) {
      var cachedPortal = plugin.apList.cachedPortals[key];
      plugin.apList.addToTopPortals(cachedPortal);
    });
  }
}

window.plugin.apList.addToTopPortals = function(portal) {
  var side = plugin.apList.portalSide(portal);
  // Skip if playerApGain is less than minPortalAp and topPortals is full
  if(portal.playerApGain <= plugin.apList.minPortalAp[side]
      && plugin.apList.topPortals[side].length > plugin.apList.topMaxCount)
    return;

  // Add portal and sort by totalAp
  plugin.apList.topPortals[side].push(portal);
  plugin.apList.topPortals[side].sort(function(a, b) {
    return b.playerApGain.totalAp - a.playerApGain.totalAp;
  });

  // Remove portal with lowest playerApGain
  if(plugin.apList.topPortals[side].length > plugin.apList.topMaxCount)
    plugin.apList.topPortals[side].pop();

  // Update minPortalAp
  var last = plugin.apList.topPortals[side].length - 1;
  plugin.apList.minPortalAp[side] = plugin.apList.topPortals[side][last];
}

window.plugin.apList.enableCache = function() {
  plugin.apList.useCachedPortals = true;
  plugin.apList.updateTopPortals();
  plugin.apList.updatePortalTable(plugin.apList.displaySide);
}

window.plugin.apList.disableCache = function() {
  plugin.apList.useCachedPortals = false;
  plugin.apList.cachedPortals = {};
  plugin.apList.updateTopPortals();
  plugin.apList.updatePortalTable(plugin.apList.displaySide);
}

window.plugin.apList.isSamePortal = function(a,b) {
  if(!a || !b) return false;
  if(a.team !== b.team) return false;
  if(a.level !== b.level) return false;
  for(var i = 0; i < 8; i++) {
    if(!isSameResonator(a.resonatorArray.resonators[i],b.resonatorArray.resonators[i]))
      return false;
  }
  return true;
}

window.plugin.apList.portalSide = function(portal) {
  return (portal.controllingTeam.team === PLAYER.team)
    ? plugin.apList.SIDE_FRIENDLY
    : plugin.apList.SIDE_ENEMY;
}

// Get AP of friendly portal 
window.plugin.apList.getDeployOrUpgradeApGain = function(d) {
  var playerResoCount = new Array(MAX_PORTAL_LEVEL + 1);
  var otherReso = new Array();
  var totalAp = 0;
  var upgradedReso = new Array();

  // loop through reso slot and find empty reso, deployed
  // by others(only level lower than player level) or by player.
  for(var i = 0; i < 8; i++) {
    var reso = d.resonatorArray.resonators[i];

    if(!reso) {
      // Empty reso
      reso = new Object();
      reso.slot = i;
      reso.level = 0;
      otherReso.push(reso);
      continue;
    }

    // By player
    if(reso.ownerGuid === window.PLAYER.guid) {
      if(!playerResoCount[reso.level])
        playerResoCount[reso.level] = 0;
      playerResoCount[reso.level]++;
      continue;
    }

    // By others and level lower than player
    if(reso.level < window.PLAYER.level) {
      otherReso.push(reso);
    }
  }

  // Sort others reso low to high, last reso in otherReso get upgrade first.
  otherReso.sort(function(a, b) {a.level - b.level;});

  // Find out available count of reso for each level
  for(var i = window.PLAYER.level; i > 0 && otherReso.length > 0; i--) {
    var availableCount = MAX_RESO_PER_PLAYER[i] - (playerResoCount[i] || 0);
    // Loop through lower level reso of others and add to result
    while(availableCount > 0 && otherReso.length > 0) {
      var targetReso = otherReso.pop();
      // Can only upgrade lower level reso
      if(targetReso.level >= i)
        continue;
      // Add upgraded reso to result
      targetReso.newLevel = i;
      upgradedReso.push(targetReso);
      // Add ap
      totalAp += (targetReso.level === 0)
        ? DEPLOY_RESONATOR
        : UPGRADE_ANOTHERS_RESONATOR;

      availableCount--;
    }
  }

  return {
    totalAp: totalAp,
    upgradedReso: upgradedReso
  };
}

// Change display table to friendly portals
window.plugin.apList.displayFriendly = function() {
  plugin.apList.displaySide = plugin.apList.SIDE_FRIENDLY;
  plugin.apList.changeDisplaySide(plugin.apList.displaySide);
}

// Change display table to enemy portals
window.plugin.apList.displayEnemy = function() {
  plugin.apList.displaySide = plugin.apList.SIDE_ENEMY;
  plugin.apList.changeDisplaySide(plugin.apList.displaySide);
}

window.plugin.apList.changeDisplaySide = function(side) {
  plugin.apList.updatePortalTable(side);
  plugin.apList.toggleSideLabel(side);

  var scrollTo = $("#ap-list").position().top + $("#ap-list").outerHeight() 
                - $("#sidebar").height() + $("#sidebar").scrollTop()
  $('#sidebar').scrollTop(scrollTo);
}

window.plugin.apList.toggleSideLabel = function(side) {
  $.each(plugin.apList.sides, function(ind,key) {
    var labelClass = plugin.apList.sideLabelClass[key];
    var opacity = (key === side) ? 1.0 : 0.5;
    $(labelClass).css("opacity", opacity);
  });
}

window.plugin.apList.hideReloadLabel = function() {
  $('#ap-list-reload').hide();
}

window.plugin.apList.showReloadLabel = function() {
  $('#ap-list-reload').show();
}

window.plugin.apList.setupVar = function() {
  plugin.apList.sides[plugin.apList.SIDE_FRIENDLY] = plugin.apList.SIDE_FRIENDLY;
  plugin.apList.sides[plugin.apList.SIDE_ENEMY] = plugin.apList.SIDE_ENEMY;
  plugin.apList.playerApGainFunc[plugin.apList.SIDE_FRIENDLY] 
    = plugin.apList.getDeployOrUpgradeApGain;
  plugin.apList.playerApGainFunc[plugin.apList.SIDE_ENEMY] 
    = getAttackApGain;
  plugin.apList.sideLabelClass[plugin.apList.SIDE_FRIENDLY]
    = "#ap-list-frd";
  plugin.apList.sideLabelClass[plugin.apList.SIDE_ENEMY]
    = "#ap-list-eny";
}

window.plugin.apList.setupList = function() {
  var content = '<div id="ap-list">'
          + '<span style="display: inline-block; width: 90%">'
          + '<span id="ap-list-eny" style="display: inline-block; text-align: center; width: 50%; opacity:1.0;">'
          + '<a href="#" onclick="window.plugin.apList.displayEnemy();return false;">Enemy</a>'
          + '</span>'
          + '<span id="ap-list-frd" style="display: inline-block; text-align: center; width: 50%; opacity:0.5;">'
          + '<a href="#" onclick="window.plugin.apList.displayFriendly();return false;">Friendly</a>'
          + '</span>'
          + '</span>'
          + '<span id="ap-list-reload" style="display: inline-block; text-align: right; width: 10%">'
          + '<a href="#" title="Clear list and reload" onclick="window.plugin.apList.disableCache();'
          + 'plugin.apList.hideReloadLabel();return false;">↻ R</a>'
          + '</span>'
          + '<div id="ap-list-table"></div>'
          + '</div>';

  $('#sidebar').append(content);
  $('#ap-list-reload').hide();
  $('#ap-list').css({'color':'#ffce00', 'font-size':'90%', 'padding':'4px 2px'});
}

window.plugin.apList.setupMapEvent = function() {
  map.on('zoomstart', function() {
    plugin.apList.setupMapEvent.zoomLevelBefore = map.getZoom();
    // Stop changing cacheBounds if cache enabled
    if(!plugin.apList.useCachedPortals)
      plugin.apList.cacheBounds = map.getBounds();
  });

  map.on('zoomend', function() {
    // if zooming in and cache not yet enable, enable it
    if(!plugin.apList.useCachedPortals
        && map.getZoom() > plugin.apList.setupMapEvent.zoomLevelBefore) {
      plugin.apList.enableCache();
      plugin.apList.showReloadLabel();
    }
  });

  map.on('moveend zoomend', function() {
    // disable cache after out of cache bounds
    if(plugin.apList.useCachedPortals) {
      var currentBounds = map.getBounds();
      if(!plugin.apList.cacheBounds.contains(currentBounds)) {
        plugin.apList.disableCache();
        plugin.apList.hideReloadLabel();
      }
    }
  });
}

var setup = function() {
  window.plugin.apList.setupVar();
  window.plugin.apList.setupList();
  window.plugin.apList.setupMapEvent();
  window.addHook('requestFinished', window.plugin.apList.handleUpdate);
}
// PLUGIN END //////////////////////////////////////////////////////////

if(window.iitcLoaded && typeof setup === 'function') {
  setup();
} else {
  if(window.bootPlugins)
    window.bootPlugins.push(setup);
  else
    window.bootPlugins = [setup];
}
} // wrapper end
// inject code into site context
var script = document.createElement('script');
script.appendChild(document.createTextNode('('+ wrapper +')();'));
(document.body || document.head || document.documentElement).appendChild(script);
