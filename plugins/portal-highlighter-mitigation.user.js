// ==UserScript==
// @id             iitc-plugin-highlight-mitigation@jonatkins
// @name           IITC plugin: hightlight portals total mitigation
// @category       Highlighter
// @version        0.1.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Uses the fill color of the portals to show mitigation. Shades of red to the maximum of 95, then tints towards purple for over 95
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighligherMitigation = function() {};

window.plugin.portalHighligherMitigation.highlight = function(data) {

  var defense = window.getPortalMitigationDetails(data.portal.options.details);

  if (defense.total > 0) {
    var fill_opacity = (defense.total/95)*.85 + .15;

    var blue = Math.max(0,Math.min(255,Math.round(defense.excess/80*255)));

    var colour = 'rgb(255,0,'+blue+')';

    var params = {fillColor: colour, fillOpacity: fill_opacity};

    data.portal.setStyle(params);
  }

}

var setup =  function() {
  window.addPortalHighlighter('Mitigation (defense)', window.plugin.portalHighligherMitigation.highlight);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
