// ==UserScript==
// @id             iitc-plugin-highlight-hide-team@vita10gy
// @name           IITC plugin: Hide portal ownership
// @category       Highlighter
// @version        0.1.1.@@DATETIMEVERSION@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Show all portals as neutral, as if uncaptured. Great for creating plans.
@@METAINFO@@
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighlighterHideOwnership = function() {};

window.plugin.portalHighlighterHideOwnership.highlight = function(data) {
  var scale = window.portalMarkerScale();

  var params = getMarkerStyleOptions({team: TEAM_NONE, level: 0});
  data.portal.setStyle(params);
}

var setup =  function() {
  window.addPortalHighlighter('Hide portal ownership', window.plugin.portalHighlighterHideOwnership.highlight);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
