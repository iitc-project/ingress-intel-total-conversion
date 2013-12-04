// ==UserScript==
// @id             iitc-plugin-highlight-forgotten@jonatkins
// @name           IITC plugin: Inactive portals. Hightlight unclaimed portals with no recent activity
// @category       Highlighter
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Highlight unclaimed portals with no recent activity. Shades of red from one week to one month, then tinted to purple for longer. May also highlight captured portals that are stuck and fail to decay every 24 hours.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighligherInactive = function() {};

window.plugin.portalHighligherInactive.highlight = function(data) {

  var daysUnmodified = (new Date().getTime() - data.portal.options.timestamp) / (24*60*60*1000);

  if (daysUnmodified >= 7) {

    var fill_opacity = Math.min(1,((daysUnmodified-7)/24)*.85 + .15);

    var blue = Math.max(0,Math.min(255,Math.round((daysUnmodified-31)/62*255)));

    var colour = 'rgb(255,0,'+blue+')';

    var params = {fillColor: colour, fillOpacity: fill_opacity};

    data.portal.setStyle(params);
  }

}

var setup =  function() {
  window.addPortalHighlighter('Inactive Portals', window.plugin.portalHighligherInactive.highlight);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
