// ==UserScript==
// @id             iitc-plugin-highlight-portals-by-damage-relative@vita10gy
// @name           IITC plugin: highlight portals by Damage (relative)
// @version        0.1.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Uses the fill color of the portals to denote damage estimate value of a level 5 burster fired on the portal, relative to what's currently on the screen.  
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighligherPortalDamageRelative = function() {};

window.plugin.portalHighligherPortalDamageRelative.bursterLevel = 5;
window.plugin.portalHighligherPortalDamageRelative.minDamage = null;
window.plugin.portalHighligherPortalDamageRelative.maxDamage = null;


window.plugin.portalHighligherPortalDamageRelative.highlight = function(data, percentage) {
  var d = data.portal.options.details;
  var color = 'red';
  
  if(window.plugin.portalHighligherPortalDamageRelative.minDamage == null ||
     window.plugin.portalHighligherPortalDamageRelative.maxDamage == null) {
    window.plugin.portalHighligherPortalDamageRelative.calculateDamageLevels(percentage);
  }
  var minDamage = window.plugin.portalHighligherPortalDamageRelative.minDamage;
  var maxDamage = window.plugin.portalHighligherPortalDamageRelative.maxDamage;
  
  var effectiveEnergy = getEffectivePortalEnergy(d);
  
  var damage = calculatePortalDamage(window.plugin.portalHighligherPortalDamageRelative.bursterLevel,d);
  if(percentage)
  {
    var erg = getCurrentPortalEnergy(d);
    if(erg === 0) {
      erg = 1;
    }
    damage /= erg;
  }
  
  var opacity =  1;
  if(minDamage !== maxDamage) {
    opacity = (damage - minDamage) / (maxDamage - minDamage);
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

window.plugin.portalHighligherPortalDamageRelative.resetDamageLevels = function() {
  window.plugin.portalHighligherPortalDamageRelative.minDamage = null;
  window.plugin.portalHighligherPortalDamageRelative.maxDamage = null;
}

window.plugin.portalHighligherPortalDamageRelative.calculateDamageLevels = function(percentage) {
  var displayBounds = map.getBounds();
  $.each(window.portals, function(qk, portal) {
    if(displayBounds.contains(portal.getLatLng())) {
      var damage = calculatePortalDamage(window.plugin.portalHighligherPortalDamageRelative.bursterLevel,portal.options.details);
      if(percentage)
      {
        var erg = getCurrentPortalEnergy(portal.options.details);
        if(erg === 0) {
          erg = 1;
        }
        damage /= erg;
      }
      if(window.plugin.portalHighligherPortalDamageRelative.minDamage === null ||
         damage < window.plugin.portalHighligherPortalDamageRelative.minDamage) {
        window.plugin.portalHighligherPortalDamageRelative.minDamage = damage;
      }
      if(window.plugin.portalHighligherPortalDamageRelative.maxDamage === null ||
         damage > window.plugin.portalHighligherPortalDamageRelative.maxDamage) {
        window.plugin.portalHighligherPortalDamageRelative.maxDamage = damage;
      }
    }
  });  
}


window.plugin.portalHighligherPortalDamageRelative.getHighlighter = function(percent) {
  return(function(data){ 
    window.plugin.portalHighligherPortalDamageRelative.highlight(data,percent);
  });  
}

var setup =  function() {
  window.addPortalHighlighter('Level 5 Damage', window.plugin.portalHighligherPortalDamageRelative.getHighlighter(false));
  window.addPortalHighlighter('Level 5 Damage %', window.plugin.portalHighligherPortalDamageRelative.getHighlighter(true));
  window.addHook('requestFinished', window.plugin.portalHighligherPortalDamageRelative.resetDamageLevels);
  
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
