// ==UserScript==
// @id             iitc-plugin-highlight-no-resize@spontifixus
// @name           IITC plugin: Remove Portal Resizing
// @category       Highlighter
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Shows all portals using the same size. Combine with the portal-level-numbers plugin to denote the portal level.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighlighterNoResize = function() {};

window.plugin.portalHighlighterNoResize.highlight = function(data) {
  var scale = window.portalMarkerScale();
  var params = {
	radius: 7 * scale + (L.Browser.mobile ? PORTAL_RADIUS_ENLARGE_MOBILE * scale : 0),
	weight: 2
  };
  data.portal.setStyle(params);
}

var setup =  function() {
  window.addPortalHighlighter('Remove Portal Resizing', window.plugin.portalHighlighterNoResize.highlight);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
