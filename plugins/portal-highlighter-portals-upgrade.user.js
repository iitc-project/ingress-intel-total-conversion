// ==UserScript==
// @id             iitc-plugin-highlight-portals-upgrade@vita10gy
// @name           IITC plugin: highlight portals you can upgrade
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Uses the fill color of the portals to highlight portals you can upgrade. Yellow means you can upgrade it at all. Orange means you can change the level. Red means you can make it your level.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// ==/UserScript==

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighligherPortalsUpgrade = function() {};

// Make this return 0 if portal can't be upgraded at all
// mildly hacky, but then there need not be both "can upgrade period" AND a "ok, to what level?" checks 
window.plugin.portalHighligherPortalsUpgrade.potentialPortalLevel = function(d) {
  var potential_level = 0;
  
  if(PLAYER.team === d.controllingTeam.team) {
    var current_level = getPortalLevel(d);
    var resonators_on_portal = d.resonatorArray.resonators;
    var resonator_levels = new Array();
    // figure out how many of each of these resonators can be placed by the player
    var player_resontators = new Array();
    for(var i=1;i<=MAX_PORTAL_LEVEL; i++) {
      player_resontators[i] = i > PLAYER.level ? 0 : MAX_RESO_PER_PLAYER[i];
    }
    $.each(resonators_on_portal, function(ind, reso) {
      if(reso !== null && reso.ownerGuid === window.PLAYER.guid) {
        player_resontators[reso.level]--;
      }
      resonator_levels.push(reso === null ? 0 : reso.level);  
    });
    
    resonator_levels.sort(function(a, b) {
      return(a - b);
    });
    
    // Max out portal
    var install_index = 0;
    for(var i=MAX_PORTAL_LEVEL;i>=1; i--) {
      for(var install = player_resontators[i]; install>0; install--) {
        if(resonator_levels[install_index] < i) {
          resonator_levels[install_index] = i;
          install_index++;
        }
      }
    }
    //console.log(resonator_levels);
    var new_level = resonator_levels.reduce(function(a, b) {return a + b;}) / 8;
    if(new_level != current_level) {
      potential_level = Math.floor(new_level);
    }
  }
  return(potential_level);
}

window.plugin.portalHighligherPortalsUpgrade.highlight = function(data) {
  var d = data.portal.options.details;
  var current_level = Math.floor(getPortalLevel(d));
  var potential_level = window.plugin.portalHighligherPortalsUpgrade.potentialPortalLevel(d);
  var player_level = PLAYER.level;
  var opacity = .7;
  
  if( potential_level > 0) {
    
    //console.log(potential_level + '>' + current_level);
    var color = 'yellow';
    if(potential_level > current_level) {
      color = 'orange';
      if(potential_level == player_level) {
        color = 'red';
      }
    }
    data.portal.setStyle({fillColor: color, fillOpacity: opacity});
    
  } else {
    data.portal.setStyle({color:  COLORS[getTeam(data.portal.options.details)],
                          fillOpacity: 0.5});
  }
  
  window.COLOR_SELECTED_PORTAL = '#f0f';
}

var setup =  function() {
  window.addPortalHighlighter('Upgradable', window.plugin.portalHighligherPortalsUpgrade.highlight);
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
