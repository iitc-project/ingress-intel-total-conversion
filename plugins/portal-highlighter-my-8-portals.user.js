// ==UserScript==
// @id             iitc-plugin-highlight-portals-my-8-portals@vita10gy
// @name           IITC plugin: highlight my level 8's on portals
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Uses the fill color of the portals to denote portals you have a level 8 on.
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
window.plugin.portalHighligherMy8sOnPortals = function() {};

window.plugin.portalHighligherMy8sOnPortals.highlight = function(data) {
  var d = data.portal.options.details;
  var portal_weakness = 0;
  if(getTeam(d) !== 0) {
    var color = 'red';
    var opacity = .7;
    
    var resCount = false;
    $.each(d.resonatorArray.resonators, function(ind, reso) {
      if(reso !== null && reso.ownerGuid === PLAYER.guid && reso.level == 8) {
        resCount = true;
      }
    });
    
    if(resCount) {
      data.portal.setStyle({fillColor: color, fillOpacity: opacity});
    } 
  }
  window.COLOR_SELECTED_PORTAL = '#f0f';
}

var setup =  function() {
  //Don't list it if it isn't applicable yet
  if(PLAYER.level == 8) {
    window.addPortalHighlighter('My Level 8 Resonators', window.plugin.portalHighligherMy8sOnPortals.highlight);
  }
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
