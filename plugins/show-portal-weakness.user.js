// ==UserScript==
// @id             iitc-plugin-show-portal-weakness@vita10gy
// @name           IITC plugin: show portal weakness
// @category       Highlighter
// @version        0.7.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Uses the fill color of the portals to denote if the portal is weak (Needs recharging, missing a resonator, needs shields)  Red, needs energy and shields. Orange, only needs energy (either recharge or resonators). Yellow, only needs shields.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalWeakness = function() {};

window.plugin.portalWeakness.highlightWeakness = function(data) {
  var d = data.portal.options.details;
  var portal_weakness = 0;
  if(getTeam(d) !== 0) {
    var only_shields = true;
    var missing_shields = 0;
    if(window.getTotalPortalEnergy(d) > 0 && window.getCurrentPortalEnergy(d) < window.getTotalPortalEnergy(d)) {
      portal_weakness = 1 - (window.getCurrentPortalEnergy(d)/window.getTotalPortalEnergy(d));
      only_shields = false;
    }
    //Ding the portal for every missing sheild.
    $.each(d.portalV2.linkedModArray, function(ind, mod) {
      if(mod === null || mod.type != 'RES_SHIELD') {
        missing_shields++;
        portal_weakness += .03;
      }
    });
    //Ding the portal for every missing resonator.
    var resCount = 0;
    $.each(d.resonatorArray.resonators, function(ind, reso) {
      if(reso === null) {
        portal_weakness += .125;
        only_shields = false;
      } else {
        resCount++;
      }
    });
    if(portal_weakness < 0) {
      portal_weakness = 0;
    }
    if(portal_weakness > 1) {
      portal_weakness = 1;
    }

    if(portal_weakness > 0) {
      var fill_opacity = portal_weakness*.85 + .15;
      var color = 'orange';
      if(only_shields) {
        color = 'yellow';
        //If only shields are missing, make portal yellow
        // but fill more than usual since pale yellow is basically invisible
        fill_opacity = missing_shields*.15 + .1;
      } else if(missing_shields > 0) {
        color = 'red';
      }
      fill_opacity = Math.round(fill_opacity*100)/100;
      var params = {fillColor: color, fillOpacity: fill_opacity};
      if(resCount < 8) {
        // Hole per missing resonator
        var dash = new Array(8-resCount + 1).join("1,4,") + "100,0"
        params["dashArray"] = dash;
      }
      data.portal.setStyle(params);
    } else {
      data.portal.setStyle({color:  COLORS[getTeam(data.portal.options.details)],
                            fillOpacity: 0.5,
                            dashArray: null});
    }
  }
  window.COLOR_SELECTED_PORTAL = '#f0f';
}

var setup =  function() {
  window.addPortalHighlighter('Portal Weakness', window.plugin.portalWeakness.highlightWeakness);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
