// ==UserScript==
// @id             iitc-plugin-highlight-portals-level-color@vita10gy
// @name           IITC plugin: highlight portals by level color
// @category       Highlighter
// @version        0.1.2.@@DATETIMEVERSION@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Use the portal fill color to denote the portal level by using the game level colors.
@@METAINFO@@
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighlighterPortalsLevelColor = function() {};

window.plugin.portalHighlighterPortalsLevelColor.colorLevel = function(data) {
  var portal_level = data.portal.options.data.level;
  if (portal_level !== undefined) {
    var opacity = .6;
    data.portal.setStyle({fillColor: COLORS_LVL[portal_level], fillOpacity: opacity});
  }
}

var setup =  function() {
  window.addPortalHighlighter('Level Color', window.plugin.portalHighlighterPortalsLevelColor.colorLevel);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
