// ==UserScript==
// @id             iitc-plugin-highlight-portals-by-ap@vita10gy
// @name           IITC plugin: highlight portals by ap
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Uses the fill color of the portals to denote AP value.  
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// ==/UserScript==

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighligherPortalAP = function() {};

window.plugin.portalHighligherPortalAP.minAP = 65;
//Anything over max AP will be 100% opacity.
window.plugin.portalHighligherPortalAP.maxAP = 6000;


window.plugin.portalHighligherPortalAP.highlight = function(data) {
  var d = data.portal.options.details;
  var ap = getAttackApGain(d);
  var portal_ap = PLAYER.team === d.controllingTeam.team ? ap.friendlyAp : ap.enemyAp;
  console.log(PLAYER.team);
  console.log(d.controllingTeam.team);
  console.log(d);
  console.log(portal_ap);
  var color = 'red';
  var opacity = (portal_ap - window.plugin.portalHighligherPortalAP.minAP) / window.plugin.portalHighligherPortalAP.maxAP;
  if(opacity < 0) {
    opacity = 0;
  }
  if(opacity > 1) {
    opacity = 1;
  }
  data.portal.setStyle({fillColor: color, fillOpacity: opacity});
  window.COLOR_SELECTED_PORTAL = '#f0f';
}

var setup =  function() {
  window.addPortalHighlighter('Portal AP', window.plugin.portalHighligherPortalAP.highlight);
}

// PLUGIN END //////////////////////////////////////////////////////////

if(window.iitcLoaded && typeof setup === 'function') {
  setup();
} else {
  if(window.bootPlugins)
    window.bootPlugins.push(setup);
  else
    window.bootPlugins = [setup];
}
} // wrapper end
// inject code into site context
var script = document.createElement('script');
script.appendChild(document.createTextNode('('+ wrapper +')();'));
(document.body || document.head || document.documentElement).appendChild(script);
