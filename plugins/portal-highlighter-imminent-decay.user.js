// ==UserScript==
// @id             iitc-plugin-highlight-imminent-decay@cathesaurus
// @name           IITC plugin: highlight portals with resonators about to decay
// @category       Highlighter
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Uses the fill color of the portals to show those with one (or more) resonators due to decay within the next day.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighlighterImminentDecay = function() {};

window.plugin.portalHighlighterImminentDecay.highlight = function(data) {
  var d = data.portal.options.details;
  var portal_deployment = 0;
  if(getTeam(d) !== 0) {
    if(window.getAvgResoDist(d) > 0 && window.getAvgResoDist(d) < window.HACK_RANGE*0.9) {
      portal_deployment = (window.HACK_RANGE - window.getAvgResoDist(d))/window.HACK_RANGE;
    }
    if(portal_deployment > 0) {
      var fill_opacity = portal_deployment*.85 + .15;
      color = 'red';
      var params = {fillColor: color, fillOpacity: fill_opacity};
      data.portal.setStyle(params);
    } 
  }
  window.COLOR_SELECTED_PORTAL = '#f0f';
}

var setup =  function() {
  window.addPortalHighlighter('ImminentDecay', window.plugin.portalHighlighterImminentDecay.highlight);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
