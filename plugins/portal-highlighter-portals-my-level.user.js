// ==UserScript==
// @id             iitc-plugin-highlight-portals-my-level@vita10gy
// @name           IITC plugin: highlight portals by my level
// @category       Highlighter
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Uses the fill color of the portals above or below your level
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

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
  var portal_level = data.portal.options.level;
  var player_level = PLAYER.level;
  var opacity = .6;
  if((below && portal_level <= player_level) ||
     (!below && portal_level >= player_level)) {
    data.portal.setStyle({fillColor: 'red', fillOpacity: opacity});
  } 
}

var setup =  function() {
  window.addPortalHighlighter('Below My Level', window.plugin.portalHighligherPortalsMyLevel.belowLevel);
  window.addPortalHighlighter('Above My Level', window.plugin.portalHighligherPortalsMyLevel.aboveLevel);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
