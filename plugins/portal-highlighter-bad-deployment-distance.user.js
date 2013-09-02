// ==UserScript==
// @id             iitc-plugin-highlight-bad-deployment-distance@cathesaurus
// @name           IITC plugin: highlight badly-deployed portals
// @category       Highlighter
// @version        0.1.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Uses the fill color of the portals to show the effective resonator deployment range: yellow for less that 36 metres, orange for less than 24 metres, red for less than 12 metres.
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
  var avgDeployment = window.getAvgResoDist(d);
  if(getTeam(d) !==0) {
    if(avgDeployment > 0 && avgDeployment < window.HACK_RANGE*0.9) {
      if(avgDeployment < window.HACK_RANGE*0.3) {
        color = 'red';
      } else if(avgDeployment < window.HACK_RANGE*0.6) {
        color = 'orange';
      } else {
        color = 'yellow';
      }
      var params = {fillColor: color, fillOpacity: 1};
      data.portal.setStyle(params);
    }
  }
}

var setup =  function() {
  window.addPortalHighlighter('Bad Deployment Distance', window.plugin.portalHighlighterBadDeploymentDistance.highlight);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
