// ==UserScript==
// @id             iitc-plugin-highlight-needs-recharge@vita10gy
// @name           IITC plugin: hightlight portals that need recharging
// @category       Highlighter
// @version        0.1.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Use the fill color of the portals to denote if the portal needs recharging. Colors also indicate severity: yellow: above 85%, orange: above 50%, red: above 15%, magenta: below 15%.
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
  var d = data.portal.options.data;
  var portal_health = d.health/100;
  if(data.portal.options.team != TEAM_NONE && portal_health < 1) {
    var fill_opacity = (1-portal_health)*.85 + .15;
    var color;
    if (portal_health > .85) color = 'yellow';
    else if (portal_health > .5) color = 'orange';
    else if (portal_health > .15) color = 'red';
    else color = 'magenta';

    var params = {fillColor: color, fillOpacity: fill_opacity};
    data.portal.setStyle(params);
  }
}

var setup =  function() {
  window.addPortalHighlighter('Needs Recharge (Health)', window.plugin.portalHighligherNeedsRecharge.highlight);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
