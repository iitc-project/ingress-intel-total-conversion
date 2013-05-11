// ==UserScript==
// @id             iitc-plugin-highlight-portals-my-level@vita10gy
// @name           IITC plugin: highlight portals by my level
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Uses the fill color of the portals above or below your level
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
window.plugin.portalHighligherPortalsMyLevel = function() {};


window.plugin.portalHighligherPortalsMyLevel.belowLevel = function(data) {
  window.plugin.portalHighligherPortalsMyLevel.colorLevel(true,data);
}

window.plugin.portalHighligherPortalsMyLevel.aboveLevel = function(data) {
  window.plugin.portalHighligherPortalsMyLevel.colorLevel(false,data);
}

window.plugin.portalHighligherPortalsMyLevel.colorLevel = function(below,data) {
  var d = data.portal.options.details;
  var portal_level = Math.floor(getPortalLevel(d));
  var player_level = PLAYER.level;
  var opacity = .6;
  if((below && portal_level <= player_level) ||
     (!below && portal_level >= player_level)) {
    data.portal.setStyle({fillColor: 'red', fillOpacity: opacity});
  } else {
    data.portal.setStyle({color:  COLORS[getTeam(data.portal.options.details)],
                          fillOpacity: 0.5});
  }
  window.COLOR_SELECTED_PORTAL = '#f0f';
}

var setup =  function() {
  window.addPortalHighlighter('Below My Level', window.plugin.portalHighligherPortalsMyLevel.belowLevel);
  window.addPortalHighlighter('Above My Level', window.plugin.portalHighligherPortalsMyLevel.aboveLevel);
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
