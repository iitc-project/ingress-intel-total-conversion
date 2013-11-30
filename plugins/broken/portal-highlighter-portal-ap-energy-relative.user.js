// ==UserScript==
// @id             iitc-plugin-highlight-portals-by-ap-by-energy-relative@vita10gy
// @name           IITC plugin: highlight portals by ap/energy (relative)
// @category       Highlighter
// @version        0.1.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Uses the fill color of the portals to denote AP/Energy value relative to what's currently on the screen. Brighter is better. Orange means your standard 8 down 8 up swap.  
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighligherPortalAPPerEnergyRelative = function() {};

window.plugin.portalHighligherPortalAPPerEnergyRelative.minAP = null;
window.plugin.portalHighligherPortalAPPerEnergyRelative.maxAP = null;
//This is the AP for a run of the mill takedown/putback
window.plugin.portalHighligherPortalAPPerEnergyRelative.baseSwapAP = 2350;


window.plugin.portalHighligherPortalAPPerEnergyRelative.highlight = function(data) {
  var d = data.portal.options.details;
  var color = 'red';
  
  if(window.plugin.portalHighligherPortalAPPerEnergyRelative.minAP == null ||
     window.plugin.portalHighligherPortalAPPerEnergyRelative.maxAP == null) {
    window.plugin.portalHighligherPortalAPPerEnergyRelative.calculateAPLevels();
  }
  var minApE = window.plugin.portalHighligherPortalAPPerEnergyRelative.minAP;
  var maxApE = window.plugin.portalHighligherPortalAPPerEnergyRelative.maxAP;
  
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

window.plugin.portalHighligherPortalAPPerEnergyRelative.resetAPLevels = function() {
  window.plugin.portalHighligherPortalAPPerEnergyRelative.minAP = null;
  window.plugin.portalHighligherPortalAPPerEnergyRelative.maxAP = null;
}

window.plugin.portalHighligherPortalAPPerEnergyRelative.calculateAPLevels = function() {
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
        if(window.plugin.portalHighligherPortalAPPerEnergyRelative.minAP === null ||
           portal_ap < window.plugin.portalHighligherPortalAPPerEnergyRelative.minAP) {
          window.plugin.portalHighligherPortalAPPerEnergyRelative.minAP = portal_ap;
        }
        if(window.plugin.portalHighligherPortalAPPerEnergyRelative.maxAP === null ||
           portal_ap > window.plugin.portalHighligherPortalAPPerEnergyRelative.maxAP) {
          window.plugin.portalHighligherPortalAPPerEnergyRelative.maxAP = portal_ap;
        }
      
      }
    }
  });  
}

  

var setup =  function() {
  window.addPortalHighlighter('AP/Energy (Relative)', window.plugin.portalHighligherPortalAPPerEnergyRelative.highlight);
  window.addHook('requestFinished', window.plugin.portalHighligherPortalAPPerEnergyRelative.resetAPLevels);
  
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
