// ==UserScript==
// @id             iitc-plugin-highlight-portals-upgrade@vita10gy
// @name           IITC plugin: highlight portals you can upgrade
// @category       Highlighter
// @version        0.2.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Use the portal fill color to denote if the portal is upgradable, depending on highlighter selected. Standard:: Yellow: you can upgrade it at all. Orange: you can change the level. Red: you can make it your level or higher. Elite:: Yellow: to level 6. Orange: to level 7. Red: to level 8.
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighlighterPortalsUpgrade = function() {};

window.plugin.portalHighlighterPortalsUpgrade.highlight = function(data) {
  var d = data.portal.options.details;
  var current_level = getPortalLevel(d);
  var potential_level = window.potentialPortalLevel(d);
  var player_level = PLAYER.level;
  var opacity = .7;
  
  if( potential_level > current_level) {
    potential_level = Math.floor(potential_level);
    current_level = Math.floor(current_level);
    //console.log(potential_level + '>' + current_level);
    var color = 'yellow';
    if(potential_level > current_level) {
      color = 'orange';
      if(potential_level >= player_level) {
        color = 'red';
      }
    }
    data.portal.setStyle({fillColor: color, fillOpacity: opacity});
    
  } 
}

window.plugin.portalHighlighterPortalsUpgrade.highlight_elite = function(data) {
  var d = data.portal.options.details;
  var current_level = getPortalLevel(d);
  var potential_level = window.potentialPortalLevel(d);
  var opacity = .8;
  var color = '';
  potential_level = Math.floor(potential_level);
  current_level = Math.floor(current_level);
    
  if( potential_level > current_level && potential_level >= 6) {
    switch(potential_level) {
      case 6:
        color = 'yellow';
        break;
      case 7:
        color = 'orange';
        break;
      case 8:
        color = 'red';
        opacity = .9;
        break;
    }
    data.portal.setStyle({fillColor: color, fillOpacity: opacity});
  } 
}

var setup =  function() {
  window.addPortalHighlighter('Upgradable', window.plugin.portalHighlighterPortalsUpgrade.highlight);
  window.addPortalHighlighter('Upgradable to Elite', window.plugin.portalHighlighterPortalsUpgrade.highlight_elite);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
