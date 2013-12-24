// ==UserScript==
// @id             iitc-plugin-highlight-hide-team@vita10gy
// @name           IITC plugin: Hide portal ownership
// @category       Highlighter
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Show all portals as neutral, as if uncaptured. Great for creating plans.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighligherHideOwnership = function() {};

window.plugin.portalHighligherHideOwnership.highlight = function(data) {
  var params = {fillColor: COLORS[TEAM_NONE], color: COLORS[TEAM_NONE], opacity: 1, fillOpacity: 0.5, radius: 7+(L.Browser.mobile ? PORTAL_RADIUS_ENLARGE_MOBILE : 0), weight: 2};
  data.portal.setStyle(params);
}

var setup =  function() {
  window.addPortalHighlighter('Hide portal ownership', window.plugin.portalHighligherHideOwnership.highlight);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
