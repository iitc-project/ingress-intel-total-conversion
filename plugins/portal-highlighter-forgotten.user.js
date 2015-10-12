// ==UserScript==
// @id             iitc-plugin-highlight-forgotten@jonatkins
// @name           IITC plugin: Inactive portals. Hightlight unclaimed portals with no recent activity
// @category       Highlighter
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Use the portal fill color to denote if the portal is unclaimed with no recent activity. Shades of red from one week to one month, then tinted to purple for longer. May also highlight captured portals that are stuck and fail to decay every 24 hours.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @include        https://www.ingress.com/mission/*
// @include        http://www.ingress.com/mission/*
// @match          https://www.ingress.com/mission/*
// @match          http://www.ingress.com/mission/*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighlighterInactive = function() {};

window.plugin.portalHighlighterInactive.highlight = function(data) {

  if (data.portal.options.timestamp > 0) {

    var daysUnmodified = (new Date().getTime() - data.portal.options.timestamp) / (24*60*60*1000);

    if (daysUnmodified >= 7) {

      var fill_opacity = Math.min(1,((daysUnmodified-7)/24)*.85 + .15);

      var blue = Math.max(0,Math.min(255,Math.round((daysUnmodified-31)/62*255)));

      var colour = 'rgb(255,0,'+blue+')';

      var params = {fillColor: colour, fillOpacity: fill_opacity};

      data.portal.setStyle(params);
    }
  }

}

var setup =  function() {
  window.addPortalHighlighter('Inactive Portals', window.plugin.portalHighlighterInactive.highlight);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
