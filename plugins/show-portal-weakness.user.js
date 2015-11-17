// ==UserScript==
// @id             iitc-plugin-show-portal-weakness@vita10gy
// @name           IITC plugin: show portal weakness
// @category       Highlighter
// @version        0.7.2.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Use the fill color of the portals to denote if the portal is weak. Stronger red indicates recharge required, missing resonators, or both.
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
window.plugin.portalWeakness = function() {};

window.plugin.portalWeakness.highlightWeakness = function(data) {

  if(data.portal.options.data.resCount !== undefined && data.portal.options.data.health !== undefined && data.portal.options.team != TEAM_NONE) {
    var res_count = data.portal.options.data.resCount;
    var portal_health = data.portal.options.data.health;

    var strength = (res_count/8) * (portal_health/100);
   
    if(strength < 1) {
      var fill_opacity = (1-strength)*.85 + .15;
      var color = 'red';
      var params = {fillColor: color, fillOpacity: fill_opacity};

      // Hole per missing resonator
      if (res_count < 8) {
        var dash = new Array((8 - res_count) + 1).join("1,4,") + "100,0"
        params.dashArray = dash;
      }

      data.portal.setStyle(params);
    } 
  }

}

var setup =  function() {
  window.addPortalHighlighter('Portal Weakness', window.plugin.portalWeakness.highlightWeakness);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
