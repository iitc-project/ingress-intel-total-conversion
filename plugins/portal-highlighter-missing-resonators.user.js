// ==UserScript==
// @id             iitc-plugin-highlight-portals-missing-resonators@vita10gy
// @name           IITC plugin: highlight portals missing resonators
// @category       Highlighter
// @version        0.1.2.@@DATETIMEVERSION@@
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

  if(data.portal.options.team != TEAM_NONE) {
    var missing_res = 8-data.portal.options.data.resCount;
    
    if(missing_res > 0) {
      var fill_opacity = ((8-missing_res)/8)*.85 + .15;
      var color = 'red';
      fill_opacity = Math.round(fill_opacity*100)/100;
      var params = {fillColor: color, fillOpacity: fill_opacity};

      // Hole per missing resonator
      var dash = new Array(missing_res + 1).join("1,4,") + "100,0"
      params["dashArray"] = dash;

      data.portal.setStyle(params);
    } 
  }
}

var setup =  function() {
  window.addPortalHighlighter('Portals Missing Resonators', window.plugin.portalsMissingResonators.highlight);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
