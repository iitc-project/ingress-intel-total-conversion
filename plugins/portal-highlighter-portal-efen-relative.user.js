// ==UserScript==
// @id             iitc-plugin-highlight-portals-by-EfEn-relative@vita10gy
// @name           IITC plugin: highlight portals by Effective Energy (relative)
// @version        0.1.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Uses the fill color of the portals to denote Effective Energy value relative to what's currently on the screen.  
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighligherPortalEfenRelative = function() {};

window.plugin.portalHighligherPortalEfenRelative.minEnEf = null;
window.plugin.portalHighligherPortalEfenRelative.maxEfEn = null;


window.plugin.portalHighligherPortalEfenRelative.highlight = function(data) {
  var d = data.portal.options.details;
  var color = 'red';
  
  if(window.plugin.portalHighligherPortalEfenRelative.minEnEf == null ||
     window.plugin.portalHighligherPortalEfenRelative.maxEfEn == null) {
    window.plugin.portalHighligherPortalEfenRelative.calculateEfEnLevels();
  }
  var minEnEf = window.plugin.portalHighligherPortalEfenRelative.minEnEf;
  var maxEfEn = window.plugin.portalHighligherPortalEfenRelative.maxEfEn;
  
  var effectiveEnergy = getEffectivePortalEnergy(d);
  
  var opacity =  1;
  if(minEnEf !== maxEfEn) {
    opacity = (effectiveEnergy.effective_energy - minEnEf) / (maxEfEn - minEnEf);
  }
  
  if(opacity < 0) {
    opacity = 0;
  }
  if(opacity > 1) {
    opacity = 1;
  }
  data.portal.setStyle({fillColor: color, fillOpacity: opacity});
  window.COLOR_SELECTED_PORTAL = '#f0f';
}

window.plugin.portalHighligherPortalEfenRelative.resetEfEnLevels = function() {
  window.plugin.portalHighligherPortalEfenRelative.minEnEf = null;
  window.plugin.portalHighligherPortalEfenRelative.maxEfEn = null;
}

window.plugin.portalHighligherPortalEfenRelative.calculateEfEnLevels = function() {
  var displayBounds = map.getBounds();
  $.each(window.portals, function(qk, portal) {
    if(displayBounds.contains(portal.getLatLng())) {
      var efen = getEffectivePortalEnergy(portal.options.details);
      efen = efen.effective_energy;
      if(window.plugin.portalHighligherPortalEfenRelative.minEnEf === null ||
         efen < window.plugin.portalHighligherPortalEfenRelative.minEnEf) {
        window.plugin.portalHighligherPortalEfenRelative.minEnEf = efen;
      }
      if(window.plugin.portalHighligherPortalEfenRelative.maxEfEn === null ||
         efen > window.plugin.portalHighligherPortalEfenRelative.maxEfEn) {
        window.plugin.portalHighligherPortalEfenRelative.maxEfEn = efen;
      }
    }
  });  
}

var setup =  function() {
  window.addPortalHighlighter('Effective Energy (Relative)', window.plugin.portalHighligherPortalEfenRelative.highlight);
  window.addHook('requestFinished', window.plugin.portalHighligherPortalEfenRelative.resetEfEnLevels);
  
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
