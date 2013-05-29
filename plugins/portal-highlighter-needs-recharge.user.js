// ==UserScript==
// @id             iitc-plugin-highlight-needs-recharge@vita10gy
// @name           IITC plugin: hightlight portals that need recharging
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Uses the fill color of the portals to denote if the portal needs recharging
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighligherNeedsRecharge = function() {};

window.plugin.portalHighligherNeedsRecharge.highlightWeakness = function(data) {
  var d = data.portal.options.details;
  var portal_weakness = 0;
  if(getTeam(d) !== 0) {
    if(window.getTotalPortalEnergy(d) > 0 && window.getCurrentPortalEnergy(d) < window.getTotalPortalEnergy(d)) {
      portal_weakness = 1 - (window.getCurrentPortalEnergy(d)/window.getTotalPortalEnergy(d));
    }
    if(portal_weakness > 0) {
      var fill_opacity = portal_weakness*.85 + .15;
      color = 'red';
      var params = {fillColor: color, fillOpacity: fill_opacity};
      data.portal.setStyle(params);
    } 
  }
  window.COLOR_SELECTED_PORTAL = '#f0f';
}

var setup =  function() {
  window.addPortalHighlighter('Portal Weakness', window.plugin.portalHighligherNeedsRecharge.highlightWeakness);
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
