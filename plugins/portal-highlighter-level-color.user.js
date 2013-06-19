// ==UserScript==
// @id             iitc-plugin-highlight-portals-level-color@vita10gy
// @name           IITC plugin: highlight portals by level color
// @category       Highlighter
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Uses the fill color of the portals level color.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighligherPortalsLevelColor = function() {};

window.plugin.portalHighligherPortalsLevelColor.colorLevel = function(data) {
  var d = data.portal.options.details;
  var portal_level = Math.floor(getPortalLevel(d));
  var opacity = .6;
  data.portal.setStyle({fillColor: COLORS_LVL[portal_level], fillOpacity: opacity});
  window.COLOR_SELECTED_PORTAL = '#f0f';
}

var setup =  function() {
  window.addPortalHighlighter('Level Color', window.plugin.portalHighligherPortalsLevelColor.colorLevel);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
