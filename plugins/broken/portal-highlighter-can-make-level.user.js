// ==UserScript==
// @id             iitc-plugin-highlight-portals-upgrade@vita10gy
// @name           IITC plugin: highlight portals you can upgrade to a specific level
// @category       Highlighter
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Uses the fill color of the portals to highlight portals you can upgrade to a specific level.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighligherPortalsCanMakeLevel = function() {};

window.plugin.portalHighligherPortalsCanMakeLevel.highlight = function(data,highlight_level) {
  var d = data.portal.options.details;
  var current_level = Math.floor(getPortalLevel(d));
  var potential_level = Math.floor(window.potentialPortalLevel(d));
  var opacity = .7;
  if( potential_level > current_level && potential_level === highlight_level) {
    color = 'red';
    data.portal.setStyle({fillColor: color, fillOpacity: opacity});
  } 
}

//determines the level of poral a user can make all on their own
window.plugin.portalHighligherPortalsCanMakeLevel.playerCanSoloLevel = function(lvl) {
  var resonators_total = 0;
  var resonators_placed = 0;
  var resonator_level = PLAYER.level
  while(resonators_placed < 8) {
    for(var i = 0; i<MAX_RESO_PER_PLAYER[resonator_level]; i++) {
      if(resonators_placed < 8) {
        resonators_total += resonator_level;
        resonators_placed++;
      }
    }
    resonator_level--;
  }
  return(Math.floor(resonators_total/8));
}
window.plugin.portalHighligherPortalsCanMakeLevel.getHighlighter = function(lvl) {
  return(function(data){ 
    window.plugin.portalHighligherPortalsCanMakeLevel.highlight(data,lvl);
  });  
}


var setup =  function() {
  // This is the maximum level of a portal a user can be the "last piece of"
  // yes, even a level 1 can be the difference in bumping a portal up to level 7
  var max_can_complete = 7;
  if(PLAYER.level === 8) {
    max_can_complete = 8;
  }
  // The rational behind the "minimum" level below is that showing a level 7 player, for example, all the portals they can make
  // a level 5 would be silly, as they can make ANY portal a level 5.
  for(var ptl_lvl = window.plugin.portalHighligherPortalsCanMakeLevel.playerCanSoloLevel()+1; ptl_lvl<=max_can_complete; ptl_lvl++) {
    window.addPortalHighlighter('Can Make Level ' + ptl_lvl, window.plugin.portalHighligherPortalsCanMakeLevel.getHighlighter(ptl_lvl));
  }
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
