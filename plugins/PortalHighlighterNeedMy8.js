// ==UserScript==
// @id             iitc-plugin-highlight-portals-need-my-8@dch
// @name           IITC plugin: highlight portals that need my level 8 resonator
// @category       Highlighter
// @version        0.1.0.20130612.162307
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      https://secure.jonatkins.com/iitc/release/plugins/portal-highlighter-need-my-8.meta.js
// @downloadURL    https://secure.jonatkins.com/iitc/release/plugins/portal-highlighter-need-my-8.user.js
// @description    [dch-2013-06-12-162306] Uses the fill color of the portals to denote non level 8 portals that need your level 8 resonator.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

// Based on portal-highlighter-my-8-portals by vita10gy

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighligherNeedMy8s = function() {};

window.plugin.portalHighligherNeedMy8s.needed = function(data) {
  var d = data.portal.options.details;
  var color = 'red';
  var opacity = .7;
  var resCount = false;
  $.each(d.resonatorArray.resonators, function(ind, reso) {
    if(reso !== null && reso.ownerGuid === PLAYER.guid && reso.level == 8) {
      resCount = true;
    }
  });
    
  if(!resCount && (parseInt(getPortalLevel(d)) != 8)) {
    data.portal.setStyle({fillColor: color, fillOpacity: opacity});
  } 
  
  window.COLOR_SELECTED_PORTAL = '#f0f';
}

var setup =  function() {
  //Don't list it if it isn't applicable yet
  if(PLAYER.level == 8) {
    window.addPortalHighlighter('My Level 8 Resonators needed', window.plugin.portalHighligherNeedMy8s.needed);
  }
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
