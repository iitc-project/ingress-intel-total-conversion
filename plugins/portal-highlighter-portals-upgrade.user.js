// ==UserScript==
// @id             iitc-plugin-highlight-portals-upgrade@vita10gy
// @name           IITC plugin: highlight portals you can upgrade
// @category       Highlighter
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Uses the fill color of the portals to highlight portals you can upgrade. Yellow means you can upgrade it at all. Orange means you can change the level. Red means you can make it your level or higher.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighligherPortalsUpgrade = function() {};

window.plugin.portalHighligherPortalsUpgrade.highlight = function(data) {
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
