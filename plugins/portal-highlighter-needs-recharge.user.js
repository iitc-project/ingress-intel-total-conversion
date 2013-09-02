// ==UserScript==
// @id             iitc-plugin-highlight-needs-recharge@vita10gy
// @name           IITC plugin: hightlight portals that need recharging
// @category       Highlighter
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Uses the fill color of the portals to denote if the portal needs recharging
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighligherNeedsRecharge = function() {};

window.plugin.portalHighligherNeedsRecharge.highlight = function(data) {
  var d = data.portal.options.details;
  var portal_weakness = 0;
  if(getTeam(d) !== 0) {
    if(window.getTotalPortalEnergy(d) > 0 && window.getCurrentPortalEnergy(d) < window.getTotalPortalEnergy(d)) {
      portal_weakness = 1 - (window.getCurrentPortalEnergy(d)/window.getTotalPortalEnergy(d));
    }
    if(portal_weakness > 0) {
      var fill_opacity = portal_weakness*.85 + .15;
      color = 'red';
      var params = {fillColor: color, fillOpacity: fill_opacity};
      data.portal.setStyle(params);
    } 
  }
}

var setup =  function() {
  window.addPortalHighlighter('Needs Recharge', window.plugin.portalHighligherNeedsRecharge.highlight);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
