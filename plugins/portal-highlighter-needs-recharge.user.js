// ==UserScript==
// @id             iitc-plugin-highlight-needs-recharge@vita10gy
// @name           IITC plugin: hightlight portals that need recharging
// @category       Highlighter
// @version        0.1.2.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Use the portal fill color to denote if the portal needs recharging and how much. Yellow: above 85%. Orange: above 50%. Red: above 15%. Magenta: below 15%.
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
window.plugin.portalHighlighterNeedsRecharge = function() {};

window.plugin.portalHighlighterNeedsRecharge.highlight = function(data) {
  var d = data.portal.options.data;
  var health = d.health;

  if(health !== undefined && data.portal.options.team != TEAM_NONE && health < 100) {
    var color,fill_opacity;
    if (health > 95) {
      color = 'yellow';
      fill_opacity = (1-health/100)*.50 + .50;
    } else if (health > 75) {
      color = 'DarkOrange';
      fill_opacity = (1-health/100)*.50 + .50;
    } else if (health > 15) {
      color = 'red';
      fill_opacity = (1-health/100)*.75 + .25;
    } else {
      color = 'magenta';
      fill_opacity = (1-health/100)*.75 + .25;
    }

    var params = {fillColor: color, fillOpacity: fill_opacity};
    data.portal.setStyle(params);
  }
}

var setup =  function() {
  window.addPortalHighlighter('Needs Recharge (Health)', window.plugin.portalHighlighterNeedsRecharge.highlight);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
