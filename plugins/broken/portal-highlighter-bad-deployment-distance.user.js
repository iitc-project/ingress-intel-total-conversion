// ==UserScript==
// @id             iitc-plugin-highlight-bad-deployment-distance@cathesaurus
// @name           IITC plugin: highlight badly-deployed portals
// @category       Highlighter
// @version        0.1.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Uses the fill color of the portals to show the effective resonator deployment range, where that average is less than 36 metres
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighlighterBadDeploymentDistance = function() {};

window.plugin.portalHighlighterBadDeploymentDistance.highlight = function(data) {
  var d = data.portal.options.details;
  var portal_deployment = 0;
  if(getTeam(d) !== 0) {
    var avgDist = window.getAvgResoDist(d);
    if(avgDist > 0 && avgDist < window.HACK_RANGE*0.9) {
      portal_deployment = (window.HACK_RANGE - avgDist)/window.HACK_RANGE;
    }
    if(portal_deployment > 0) {
      var fill_opacity = portal_deployment*.85 + .15;
      // magenta for *exceptionally* close deployments (spoofing? under 1m average), then shades of
      // red, orange and yellow for further out
      color = avgDist < 1 ? 'magenta' : avgDist < (window.HACK_RANGE*.25) ? 'red' : avgDist < (window.HACK_RANGE*.6) ? 'orange' : 'yellow';
      var params = {fillColor: color, fillOpacity: fill_opacity};
      data.portal.setStyle(params);
    } 
  }
}

var setup =  function() {
  window.addPortalHighlighter('Bad Deployment Distance', window.plugin.portalHighlighterBadDeploymentDistance.highlight);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
