// ==UserScript==
// @id             iitc-plugin-highlight-imminent-decay@cathesaurus
// @name           IITC plugin: highlight portals with resonators about to decay
// @category       Highlighter
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Uses the fill color of the portals to show resonators due to decay within the next day. Red = portal will decay completely, orange = portal will drop all links, yellow = one or more resonators will decay completely.
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
  if(getTeam(d) !== 0) {
    //Check the energy of every resonator.
    var resImminentDecayCount = 0;
    var resCount = 0;
    $.each(d.resonatorArray.resonators, function(ind, reso) {
      if(reso !== null) {
        var level = parseInt(reso.level);
        var maxResonatorEnergy = window.RESO_NRG[level];
        var currentResonatorEnergy = parseInt(reso.energyTotal);
        if((currentResonatorEnergy / maxResonatorEnergy) < 0.15) {
          resImminentDecayCount++;
        }
        resCount++;
      }
    });

    if(resImminentDecayCount > 0) {
      if(resImminentDecayCount === resCount) {
        var color = 'red';
      } else if((resCount - resImminentDecayCount) < 3) {
        color = 'orange';
      } else {
        color = 'yellow';
      }
      // Apply colour to portal.
      var params = {fillColor: color, fillOpacity: 1};
      data.portal.setStyle(params);
    }
  }
  window.COLOR_SELECTED_PORTAL = '#f0f';
}

var setup =  function() {
  window.addPortalHighlighter('Imminent Decay', window.plugin.portalHighlighterImminentDecay.highlight);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
