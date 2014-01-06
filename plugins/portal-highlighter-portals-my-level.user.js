// ==UserScript==
// @id             iitc-plugin-highlight-portals-my-level@vita10gy
// @name           IITC plugin: highlight portals by my level
// @category       Highlighter
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Use the portal fill color to denote if the portal is either at and above, or at and below your level.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighlighterPortalsMyLevel = function() {};


window.plugin.portalHighlighterPortalsMyLevel.belowLevel = function(data) {
  window.plugin.portalHighlighterPortalsMyLevel.colorLevel(true,data);
}

window.plugin.portalHighlighterPortalsMyLevel.aboveLevel = function(data) {
  window.plugin.portalHighlighterPortalsMyLevel.colorLevel(false,data);
}

window.plugin.portalHighlighterPortalsMyLevel.colorLevel = function(below,data) {
  var portal_level = data.portal.options.level;
  var player_level = PLAYER.level;
  var opacity = .6;
  if((below && portal_level <= player_level) ||
     (!below && portal_level >= player_level)) {
    data.portal.setStyle({fillColor: 'red', fillOpacity: opacity});
  } 
}

var setup =  function() {
  window.addPortalHighlighter('Below My Level', window.plugin.portalHighlighterPortalsMyLevel.belowLevel);
  window.addPortalHighlighter('Above My Level', window.plugin.portalHighlighterPortalsMyLevel.aboveLevel);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
