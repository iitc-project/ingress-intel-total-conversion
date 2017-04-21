// ==UserScript==
// @id             iitc-plugin-highlight-portals-stalker@gluckies
// @name           IITC plugin: highlight portals for a given player
// @category       Highlighter
// @version        0.2.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] The plugins highligths portals that have reso/mod of the given player. The more/better mods, the brightest it is.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighligherEnemy = function() {};

window.plugin.portalHighligherEnemy.highlight = function(data) {
  var d = data.portal.options.details;
  // Score computation, will be used to set opacity (more resonators, more/better mods means more _red_)
  // Mostly based on trial/error until I was satisfied with the rendering for L8 player
  var score = 0;
  $.each(d.resonatorArray.resonators, function(ind, reso) {
    if(reso !== null && window.plugin.portalHighligherEnemy.isSelectedUser(reso.ownerGuid)) {
      score += reso.level >= 7 ? reso.level : 1;
    }
  });
  var m = data.portal.options.details.portalV2.linkedModArray;
  $.each(m, function(ind, mod) {
    if (mod && window.plugin.portalHighligherEnemy.isSelectedUser(mod.installingUser)) {
      score += mod.rarity === 'VERY_RARE' ? 30 : 5;
    }
  });

  if (score !== 0) {
    score = score < 17 ? 5 : score-11;
    data.portal.setStyle({fillColor: 'red', fillOpacity: 1-4/score});
  }
  window.COLOR_SELECTED_PORTAL = '#f0f';
}

window.plugin.portalHighligherEnemy.isSelectedUser = function(guid) {
  if (!guid) {
    return false;
  }
  if (window.plugin.portalHighligherEnemy.playerGuid) {
    return guid === window.plugin.portalHighligherEnemy.playerGuid;
  }
  // fallback to case insensitive search, less efficient
  if (window.plugin.portalHighligherEnemy.playerName) {
    var name = getPlayerName(guid);
    if (name) {
      return name.toUpperCase() === window.plugin.portalHighligherEnemy.playerName;
    }
  }
  return false;
}

window.plugin.portalHighligherEnemy.findPlayer = function(name) {
  // find exact match first
  var guid = window.playerNameToGuid(name);
  if (guid) return guid;

  // cleanup
  name = name.trim()
  if (name.startsWith('@')) name = name.substring(1)
  
  var guid = window.playerNameToGuid(name);
  if (guid) return guid;
    
  // lucky guess: invert first char case
  var ch = name.charAt(0);
  ch = ( ch >= 'A' && ch <= 'Z' ) ? ch.toLowerCase() : ch.toUpperCase();
  name = ch + name.substring(1);
  
  return window.playerNameToGuid(name);
}


var setup =  function() {
  window.addPortalHighlighter('Stalker', window.plugin.portalHighligherEnemy.highlight);
  var content = '<input id="playerStalker" placeholder="Player name for portal highlight..." type="text">';
  $('#sidebar').append(content);
  $("#playerStalker").keypress(function(e) {
    if((e.keyCode ? e.keyCode : e.which) !== 13) return;
    var data = $(this).val();
    window.plugin.portalHighligherEnemy.playerName = data.toUpperCase();
    window.plugin.portalHighligherEnemy.playerGuid = window.plugin.portalHighligherEnemy.findPlayer(data);
    // force highlight switch
    $("#portal_highlight_select").val('Stalker');
    window.changePortalHighlights('Stalker');
  });
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
