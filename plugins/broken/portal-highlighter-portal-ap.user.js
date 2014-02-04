// ==UserScript==
// @id             iitc-plugin-highlight-portals-by-ap@vita10gy
// @name           IITC plugin: highlight portals by ap
// @category       Highlighter
// @version        0.1.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Use the portal fill color to denote AP value. Brighter is better. Orange means your standard 8 down 8 up swap.  
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighlighterPortalAP = function() {};

window.plugin.portalHighlighterPortalAP.minAP = 65;
//Anything over max AP will be 100% opacity.
window.plugin.portalHighlighterPortalAP.maxAP = 6000;
//This is the AP for a run of the mill takedown/putback
window.plugin.portalHighlighterPortalAP.baseSwapAP = 2350;


window.plugin.portalHighlighterPortalAP.highlight = function(data) {
  var d = data.portal.options.details;
  var color = 'red';
  var ap = getAttackApGain(d);
  var portal_ap = ap.friendlyAp;
  
  if(PLAYER.team !== d.controllingTeam.team) {
    portal_ap = ap.enemyAp;
    if(portal_ap === window.plugin.portalHighlighterPortalAP.baseSwapAP) {
      color = 'orange';
    }
  }
  
  var opacity = (portal_ap - window.plugin.portalHighlighterPortalAP.minAP) / window.plugin.portalHighlighterPortalAP.maxAP;
  if(opacity < 0) {
    opacity = 0;
  }
  if(opacity > 1) {
    opacity = 1;
  }
  data.portal.setStyle({fillColor: color, fillOpacity: opacity});
}

var setup =  function() {
  window.addPortalHighlighter('AP (Static)', window.plugin.portalHighlighterPortalAP.highlight);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
