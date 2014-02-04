// ==UserScript==
// @id             iitc-plugin-highlight-portals-by-ap-by-energy-relative@vita10gy
// @name           IITC plugin: highlight portals by ap/energy (relative)
// @category       Highlighter
// @version        0.1.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Use the portal fill color to denote AP/Energy value relative to what's currently on the screen. Brighter is better. Orange means your standard 8 down 8 up swap.  
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighlighterPortalAPPerEnergyRelative = function() {};

window.plugin.portalHighlighterPortalAPPerEnergyRelative.minAP = null;
window.plugin.portalHighlighterPortalAPPerEnergyRelative.maxAP = null;
//This is the AP for a run of the mill takedown/putback
window.plugin.portalHighlighterPortalAPPerEnergyRelative.baseSwapAP = 2350;


window.plugin.portalHighlighterPortalAPPerEnergyRelative.highlight = function(data) {
  var d = data.portal.options.details;
  var color = 'red';
  
  if(window.plugin.portalHighlighterPortalAPPerEnergyRelative.minAP == null ||
     window.plugin.portalHighlighterPortalAPPerEnergyRelative.maxAP == null) {
    window.plugin.portalHighlighterPortalAPPerEnergyRelative.calculateAPLevels();
  }
  var minApE = window.plugin.portalHighlighterPortalAPPerEnergyRelative.minAP;
  var maxApE = window.plugin.portalHighlighterPortalAPPerEnergyRelative.maxAP;
  
  if(PLAYER.team !== d.controllingTeam.team) {
    var ap = getAttackApGain(d);
    var energy = getCurrentPortalEnergy(d);
    if(energy < 1) {
      energy = 1;
    }
    portal_ap = ap.enemyAp;
      
    var opacity =  1;
    if(minApE !== maxApE) {
      opacity = ((ap.enemyAp / energy) - minApE) / (maxApE - minApE);
    }
    
    if(opacity < 0) {
      opacity = 0;
    }
    if(opacity > 1) {
      opacity = 1;
    }
    data.portal.setStyle({fillColor: color, fillOpacity: opacity});
  }
}

window.plugin.portalHighlighterPortalAPPerEnergyRelative.resetAPLevels = function() {
  window.plugin.portalHighlighterPortalAPPerEnergyRelative.minAP = null;
  window.plugin.portalHighlighterPortalAPPerEnergyRelative.maxAP = null;
}

window.plugin.portalHighlighterPortalAPPerEnergyRelative.calculateAPLevels = function() {
  var displayBounds = map.getBounds();
  $.each(window.portals, function(qk, portal) {
    if(displayBounds.contains(portal.getLatLng())) {
      if(PLAYER.team !== portal.options.details.controllingTeam.team) {
        var ap = getAttackApGain(portal.options.details);
        var energy = getCurrentPortalEnergy(portal.options.details);
        if(energy < 1) {
          energy = 1;
        }
        var portal_ap = ap.enemyAp / energy;
        if(window.plugin.portalHighlighterPortalAPPerEnergyRelative.minAP === null ||
           portal_ap < window.plugin.portalHighlighterPortalAPPerEnergyRelative.minAP) {
          window.plugin.portalHighlighterPortalAPPerEnergyRelative.minAP = portal_ap;
        }
        if(window.plugin.portalHighlighterPortalAPPerEnergyRelative.maxAP === null ||
           portal_ap > window.plugin.portalHighlighterPortalAPPerEnergyRelative.maxAP) {
          window.plugin.portalHighlighterPortalAPPerEnergyRelative.maxAP = portal_ap;
        }
      
      }
    }
  });  
}

  

var setup =  function() {
  window.addPortalHighlighter('AP/Energy (Relative)', window.plugin.portalHighlighterPortalAPPerEnergyRelative.highlight);
  window.addHook('requestFinished', window.plugin.portalHighlighterPortalAPPerEnergyRelative.resetAPLevels);
  
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
