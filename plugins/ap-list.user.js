// ==UserScript==
// @id             iitc-plugin-ap-list@xelio
// @name           iitc: AP List
// @version        0.4
// @namespace      https://github.com/breunigs/ingress-intel-total-conversion
// @updateURL      https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/ap-list.user.js
// @downloadURL    https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/ap-list.user.js
// @description    List top 10 portals by AP of either faction. Other functions and controls please refer to the Userguide. (https://github.com/breunigs/ingress-intel-total-conversion/wiki/Userguide-%28Main-Vanilla-IITC%29#wiki-pluginsAPListUserGuide)
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
window.plugin.apList.SIDE_FRIENDLY = 0;
window.plugin.apList.SIDE_ENEMY = 1;
window.plugin.apList.displaySide = window.plugin.apList.SIDE_ENEMY;
window.plugin.apList.sides = new Array(2);
window.plugin.apList.sortedPortals = new Array(2);
window.plugin.apList.playerApGainFunc = new Array(2);

window.plugin.apList.topMaxCount = 10;
window.plugin.apList.sideLabelClass = {};

window.plugin.apList.useCachedPortals = false;
window.plugin.apList.cacheBounds;
window.plugin.apList.cacheActiveZoomLevel;

window.plugin.apList.destroyPortalsGuid = new Array();


window.plugin.apList.handleUpdate = function() {
  if(!requests.isLastRequest('getThinnedEntitiesV2')) return;
  plugin.apList.updateSortedPortals();
  plugin.apList.updatePortalTable(plugin.apList.displaySide);
}

// Generate html table from top portals
window.plugin.apList.updatePortalTable = function(side) {
  var displayEnemy = (plugin.apList.displaySide === window.plugin.apList.SIDE_ENEMY);
  
  var content = '<table style="width: 100%; table-layout:fixed">';
  for(var i = 0; i < plugin.apList.topMaxCount; i++) {
    var portal = plugin.apList.sortedPortals[side][i];
    content += '<tr>';
    // Only enemy portal list will display destroy checkbox
    if(displayEnemy) {
      content += '<td style="width: 5%; height: 1px">'
               + (portal ? plugin.apList.getPortalDestroyCheckbox(portal) : '&nbsp;')
               + '</td>';
    }
    content += '<td style="width: ' + (displayEnemy ? '80%' : '85%')
             + '; overflow:hidden; white-space:nowrap">'
             + (portal ? plugin.apList.getPortalLink(portal) : '&nbsp;')
             + '</td>'
             + '<td>'
             + (portal ? plugin.apList.getPortalApText(portal) : '&nbsp;')
             + '</td>'
             + '</tr>';
  }
  content += "</table>";
  $('div#ap-list-table').html(content);
}

window.plugin.apList.getPortalDestroyCheckbox = function(portal) {
  // Change background color to border color if portal selected for destroy 
  var style = 'width: 10px; height: 10px; border: 1px solid rgb(32, 168, 177); margin: 0 auto; '
            + (plugin.apList.destroyPortalIndex(portal.guid) >= 0 
                ? 'background-color: rgb(32, 168, 177);' 
                : '');
  var onClick = 'window.plugin.apList.destroyPortal(\'' + portal.guid + '\');';
  // 3 div for centering checkbox horizontally and vertically, 
  // click event on outest div for people with not so good aiming
  var div = '<div style="display: table; height: 100%; width: 100%;" onclick="' + onClick + '">'
          + '<div style="display: table-cell; vertical-align: middle;">'
          + '<div style="' + style + '"/>'
          + '</div>'
          + '</div>';
  return div;
}

window.plugin.apList.destroyPortal = function(guid) {
  // Add to destroyPortalsGuid if not yet added, remove if already added
  var portalIndex = plugin.apList.destroyPortalIndex(guid);
  if(portalIndex >= 0) {
    plugin.apList.destroyPortalsGuid.splice(portalIndex, 1);
  } else {
    plugin.apList.destroyPortalsGuid.push(guid);
  }

  plugin.apList.updateSortedPortals();
  plugin.apList.updatePortalTable(plugin.apList.displaySide);
}

// Return the index of portal in destroyPortalsGuid
window.plugin.apList.destroyPortalIndex = function(guid) {
  return $.inArray(guid, plugin.apList.destroyPortalsGuid);
}

// Combine title and test
window.plugin.apList.getPortalApText = function(portal) {
  var title = plugin.apList.getPortalApTitle(portal);
  return '<div class="help" title="' + title + '">' + digits(portal.playerApGain.totalAp) + '</div>';
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
  } else {
    t = 'Destroy &amp; Capture:\n'
      + 'R:' + playerApGain.resoCount + ' L:' + playerApGain.linkCount + ' CF:' + playerApGain.fieldCount + '\n'
      + 'Destroy AP\t=\t' + digits(playerApGain.destroyAp) + '\n'
      + 'Capture AP\t=\t' + digits(playerApGain.captureAp) + '\n'
      + 'Sum: ' + digits(playerApGain.totalAp) + ' AP';
  }
  return t;
}

// portal link - single click: select portal
//               double click: zoom to and select portal
//               hover: show address
window.plugin.apList.getPortalLink = function(portal) {
  var latlng = [portal.locationE6.latE6/1E6, portal.locationE6.lngE6/1E6].join();
  var jsSingleClick = 'window.renderPortalDetails(\''+portal.guid+'\');return false';
  var jsDoubleClick = 'window.zoomToAndShowPortal(\''+portal.guid+'\', ['+latlng+']);return false';
  var perma = 'https://ingress.com/intel?latE6='+portal.locationE6.latE6
            +'&lngE6='+portal.locationE6.lngE6+'&z=17&pguid='+portal.guid;
  var style = plugin.apList.destroyPortalIndex(portal.guid) >= 0 
              ? 'font-style:italic'
              : '';
  //Use Jquery to create the link, which escape characters in TITLE and ADDRESS of portal
  var a = $('<a>',{
    "class": 'help',
    style: style,
    text: portal.portalV2.descriptiveText.TITLE,
    title: portal.portalV2.descriptiveText.ADDRESS,
    href: perma,
    onClick: jsSingleClick,
    onDblClick: jsDoubleClick
  })[0].outerHTML;
  var div = '<div style="white-space: nowrap; overflow: hidden; text-overflow:ellipsis;">'+a+'</div>';
  return div;
}

// Loop through portals and get playerApGain, then put in sortedPortals by side and sort them by AP.
window.plugin.apList.updateSortedPortals = function() {
  plugin.apList.sortedPortals[plugin.apList.SIDE_FRIENDLY] = new Array();
  plugin.apList.sortedPortals[plugin.apList.SIDE_ENEMY] = new Array();

  // Make a backup of cachedPortals
  // If cache is not enabled, empty cachedPortals. In following
  // "$.each" loop, the backup portal will copy back into 
  // cachedPortals if it exist in "window.portals"" and didn't change.'
  var oldcachedPortal = $.extend({},plugin.apList.cachedPortals);
  if(!plugin.apList.useCachedPortals)
    plugin.apList.cachedPortals = {};

  $.each(window.portals, function(key, value) {
    if(getTypeByGuid(key) !== TYPE_PORTAL)
      return true;

    var portal = value.options.details;
    var cachedPortal = oldcachedPortal[key];
    // If portal is changed, update playerApGain with latest
    // information
    if(!plugin.apList.isSamePortal(portal,cachedPortal)) {
      // Copy portal detail to cachedPortal
      cachedPortal = $.extend({}, portal);
      var side = plugin.apList.portalSide(portal);
      var getApGainFunc = plugin.apList.playerApGainFunc[side];
      // Assign playerApGain and guid to cachedPortal
      cachedPortal.playerApGain = getApGainFunc(portal);
      cachedPortal.guid = value.options.guid;
    }
    plugin.apList.cachedPortals[key] = cachedPortal;
  });

  // Add all portals to sortedPortals by side and sort sortedPortals by AP
  $.each(plugin.apList.cachedPortals, function(key, portal) {
    var side = plugin.apList.portalSide(portal);
    plugin.apList.sortedPortals[side].push(portal);
  });
  $.each(plugin.apList.sides, function(ind, side) {
    plugin.apList.sortedPortals[side].sort(function(a, b) {
     return b.playerApGain.totalAp - a.playerApGain.totalAp;
    });
  });

  // Modify sortedPortals if any portal selected for destroy
  if(plugin.apList.destroyPortalsGuid.length > 0) {
    plugin.apList.handleDestroyPortal()
  }
}

// This function will make AP gain of field and link only count once if 
// one of the connected portal is selected for destroy
window.plugin.apList.handleDestroyPortal = function() {
  var enemy = window.plugin.apList.SIDE_ENEMY;
  var destroyedLinks = {};
  var destroyedFields = {};

  // Clean up portal selected for destroy, remove from destroyPortalsGuid 
  // if portal not exist or change to friendly side
  plugin.apList.destroyPortalsGuid = $.grep(plugin.apList.destroyPortalsGuid, function(portalGuid,ind) {
    var portal = plugin.apList.cachedPortals[portalGuid];
    if(!portal || plugin.apList.portalSide(portal) !== enemy) return false;
    return true;
  });

  // Loop through portals from highest AP to lowest AP, matching links and fields to the 
  // portal only if the portal is selected for destroy and have highest AP. 
  // Matching info stores in "destroyedLinks" and "destroyedFields"
  $.each(plugin.apList.sortedPortals[enemy], function(ind, portal) {
    if(plugin.apList.destroyPortalIndex(portal.guid) < 0) return true;

    $.each(portal.portalV2.linkedEdges || [], function(ind,link) {
      // Skip if the link already matched with a portal
      if(destroyedLinks[link.edgeGuid]) return true;
      belongTo = {portalGuid: portal.guid};
      destroyedLinks[link.edgeGuid] = belongTo;
    });
    $.each(portal.portalV2.linkedFields || [], function(ind,field) {
      // Skip if the field already matched with a portal
      if(destroyedFields[field]) return true;
      belongTo = {portalGuid: portal.guid};
      destroyedFields[field] = belongTo;
    });
  });

  // Remove the link and field which was matched with another portal
  var getApGainFunc = plugin.apList.playerApGainFunc[enemy];
  $.each(plugin.apList.sortedPortals[enemy], function(ind, portal) {
    // Filter out links which was matched with another portal
    var newLinkedEdges = $.grep(portal.portalV2.linkedEdges || [], function(link,ind) {
      if(!destroyedLinks[link.edgeGuid]) return true;
      return (destroyedLinks[link.edgeGuid].portalGuid === portal.guid);
    });
    // Filter out fields which was matched with another portal
    var newLinkedFields = $.grep(portal.portalV2.linkedFields || [], function(field,ind) {
      if(!destroyedFields[field]) return true;
      return (destroyedFields[field].portalGuid === portal.guid);
    });

    // Skip modifying portal if no link and field changed
    if(newLinkedEdges.length === (portal.portalV2.linkedEdges || []).length
        && newLinkedFields.length === (portal.portalV2.linkedFields || []).length)
      return true;

    // Clone the portal to avoid modifying original data in cachedPortal
    var newPortal = $.extend(true, {}, portal);
    // Assign new links and fields and calculate new playerApGain
    if(portal.portalV2.linkedEdges) newPortal.portalV2.linkedEdges = newLinkedEdges;
    if(portal.portalV2.linkedFields) newPortal.portalV2.linkedFields = newLinkedFields;
    newPortal.playerApGain = getApGainFunc(newPortal);

    plugin.apList.sortedPortals[enemy][ind] = newPortal;
  });

  // Sorting portals with updated AP
  plugin.apList.sortedPortals[enemy].sort(function(a, b) {
    return b.playerApGain.totalAp - a.playerApGain.totalAp;
  });
}

window.plugin.apList.enableCache = function() {
  plugin.apList.useCachedPortals = true;
  plugin.apList.updateSortedPortals();
  plugin.apList.updatePortalTable(plugin.apList.displaySide);
}

window.plugin.apList.disableCache = function() {
  plugin.apList.useCachedPortals = false;
  plugin.apList.cachedPortals = {};
  plugin.apList.updateSortedPortals();
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
      reso = {slot: i, level: 0};
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
  otherReso.sort(function(a, b) {return a.level - b.level;});

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

window.plugin.apList.getAttackApGain = function(d) {
  var resoCount = 0;
  $.each(d.resonatorArray.resonators, function(ind, reso) {
    if (!reso)
      return true;
    resoCount += 1;
  });

  var linkCount = d.portalV2.linkedEdges ? d.portalV2.linkedEdges.length : 0;
  var fieldCount = d.portalV2.linkedFields ? d.portalV2.linkedFields.length : 0;

  var resoAp = resoCount * DESTROY_RESONATOR;
  var linkAp = linkCount * DESTROY_LINK;
  var fieldAp = fieldCount * DESTROY_FIELD;
  var destroyAp = resoAp + linkAp + fieldAp;
  var captureAp = CAPTURE_PORTAL + 8 * DEPLOY_RESONATOR + COMPLETION_BONUS;
  var totalAp = destroyAp + captureAp;

  return {
    totalAp: totalAp,
    destroyAp: destroyAp,
    captureAp: captureAp,
    resoCount: resoCount,
    linkCount: linkCount,
    fieldCount: fieldCount
  }
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
    = plugin.apList.getAttackApGain;
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
