// ==UserScript==
// @id             iitc-plugin-highlight-portals-missing-resonators@vita10gy
// @name           IITC plugin: highlight portals missing resonators
// @category       Highlighter
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Uses the fill color of the portals to denote if the portal is missing resonators. 
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalsMissingResonators = function() {};

window.plugin.portalsMissingResonators.highlight = function(data) {
  var d = data.portal.options.details;
  var portal_weakness = 0;
  if(getTeam(d) !== 0) {
    //Ding the portal for every missing resonator.
    var resCount = 0;
    $.each(d.resonatorArray.resonators, function(ind, reso) {
      if(reso === null) {
        portal_weakness += .125;
      } else {
        resCount++;
      }
    });
    
    if(portal_weakness > 0) {
      var fill_opacity = portal_weakness*.85 + .15;
      var color = 'red';
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
  window.addPortalHighlighter('Portals Missing Resonators', window.plugin.portalsMissingResonators.highlight);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
