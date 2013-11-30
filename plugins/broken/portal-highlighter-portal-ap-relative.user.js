// ==UserScript==
// @id             iitc-plugin-highlight-portals-by-ap-relative@vita10gy
// @name           IITC plugin: highlight portals by ap relative
// @category       Highlighter
// @version        0.1.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Uses the fill color of the portals to denote AP value relative to what's currently on the screen. Brighter is better. Orange means your standard 8 down 8 up swap.  
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighligherPortalAPRelative = function() {};

window.plugin.portalHighligherPortalAPRelative.minAP = null;
window.plugin.portalHighligherPortalAPRelative.maxAP = null;
//This is the AP for a run of the mill takedown/putback
window.plugin.portalHighligherPortalAPRelative.baseSwapAP = 2350;


window.plugin.portalHighligherPortalAPRelative.highlight = function(data) {
  var d = data.portal.options.details;
  var color = 'red';
  
  if(window.plugin.portalHighligherPortalAPRelative.minAP == null ||
     window.plugin.portalHighligherPortalAPRelative.maxAP == null) {
    window.plugin.portalHighligherPortalAPRelative.calculateAPLevels();
  }
  var minAp = window.plugin.portalHighligherPortalAPRelative.minAP;
  var maxAp = window.plugin.portalHighligherPortalAPRelative.maxAP;
  
  var ap = getAttackApGain(d);
  var portal_ap = ap.friendlyAp;
  
  if(PLAYER.team !== d.controllingTeam.team) {
    portal_ap = ap.enemyAp;
    if(portal_ap === window.plugin.portalHighligherPortalAPRelative.baseSwapAP) {
      color = 'orange';
    }
  }
  
  var opacity =  1;
  if(minAp !== maxAp) {
    opacity = (portal_ap - minAp) / (maxAp - minAp);
  }
  
  if(opacity < 0) {
    opacity = 0;
  }
  if(opacity > 1) {
    opacity = 1;
  }
  data.portal.setStyle({fillColor: color, fillOpacity: opacity});
}

window.plugin.portalHighligherPortalAPRelative.resetAPLevels = function() {
  window.plugin.portalHighligherPortalAPRelative.minAP = null;
  window.plugin.portalHighligherPortalAPRelative.maxAP = null;
}

window.plugin.portalHighligherPortalAPRelative.calculateAPLevels = function() {
  var displayBounds = map.getBounds();
  $.each(window.portals, function(qk, portal) {
    if(displayBounds.contains(portal.getLatLng())) {
      var ap = getAttackApGain(portal.options.details);
      var portal_ap = ap.friendlyAp;
      if(PLAYER.team !== portal.options.details.controllingTeam.team) {
        portal_ap = ap.enemyAp;
      }
      if(window.plugin.portalHighligherPortalAPRelative.minAP === null ||
         portal_ap < window.plugin.portalHighligherPortalAPRelative.minAP) {
        window.plugin.portalHighligherPortalAPRelative.minAP = portal_ap;
      }
      if(window.plugin.portalHighligherPortalAPRelative.maxAP === null ||
         portal_ap > window.plugin.portalHighligherPortalAPRelative.maxAP) {
        window.plugin.portalHighligherPortalAPRelative.maxAP = portal_ap;
      }
    }
  });  
}

var setup =  function() {
  window.addPortalHighlighter('AP (Relative)', window.plugin.portalHighligherPortalAPRelative.highlight);
  window.addHook('requestFinished', window.plugin.portalHighligherPortalAPRelative.resetAPLevels);
  
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
