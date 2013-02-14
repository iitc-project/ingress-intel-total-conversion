// ==UserScript==
// @id             iitc-plugin-show-portal-weakness@vita10gy
// @name           iitc: show portal weakness
// @version        0.2
// @namespace      https://github.com/breunigs/ingress-intel-total-conversion
// @updateURL      https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/show-portal-weekness.user.js
// @downloadURL    https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/show-portal-weekness.user.js
// @description    Uses the fill color of the portals to denote if the portal is weak (Needs recharging, missing a resonator, needs shields)
// @include        http://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// ==/UserScript==

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalWeakness = function() {};

window.plugin.portalWeakness.getPortalWeaknessFactor = function(d)
{
  var portal_weakness = 0;
  if(getTeam(d) != 0)
  {
    if(window.getTotalPortalEnergy(d)> 0 && window.getCurrentPortalEnergy(d) < window.getTotalPortalEnergy(d))
    {
      portal_weakness = 1 - (window.getPortalEnergy(d)/window.getTotalPortalEnergy(d));
    }
    //Ding the portal for every missing sheild. 
    $.each(d.portalV2.linkedModArray, function(ind, mod)
    {
      if(mod == null)
      {
        portal_weakness += .05;
      }
    });
    //Ding the portal for every missing resonator.
    var resCount = 0;
    $.each(d.resonatorArray.resonators, function(ind, reso)
    {
      if(reso == null) {
        portal_weakness += .125;
      }
      else {
        resCount++;
      }
    });
    if(portal_weakness<0) {
      portal_weakness = 0;
    }
    if(portal_weakness>1)
    {
      portal_weakness = 1;
    }
  }
  return(Math.round(portal_weakness*100)/100);
}

window.plugin.portalWeakness.portalAdded = function(data) {
  
  var d = data.portal.options.details;
  var portal_weakness = 0;
  if(getTeam(d) != 0)
  {
    if(window.getTotalPortalEnergy(d)> 0 && window.getCurrentPortalEnergy(d) < window.getTotalPortalEnergy(d))
    {
      portal_weakness = 1 - (window.getCurrentPortalEnergy(d)/window.getTotalPortalEnergy(d));
    }
    //Ding the portal for every missing sheild. 
    $.each(d.portalV2.linkedModArray, function(ind, mod)
    {
      if(mod == null)
      {
        portal_weakness += .03;
      }
    });
    //Ding the portal for every missing resonator.
    var resCount = 0;
    $.each(d.resonatorArray.resonators, function(ind, reso)
    {
      if(reso == null) {
        portal_weakness += .125;
      }
      else {
        resCount++;
      }
    });
    if(portal_weakness<0) {
      portal_weakness = 0;
    }
    if(portal_weakness>1)
    {
      portal_weakness = 1;
    } 
    
    if(portal_weakness>0)
    {
      var color = 'red';
      var fill_opacity = Math.round((portal_weakness*.8 + .2)*100)/100;
      var params = {fillColor: color, fillOpacity: fill_opacity, radius: data.portal.options.radius+1};
      if(resCount<8)
      {
        // Hole per missing resonator
        var dash = new Array(8-resCount + 1).join("1,4,") + "100,0"
        params["dashArray"] = dash;
      }
      data.portal.setStyle(params);
    }
  }
}

var setup =  function() {
  window.addHook('portalAdded', window.plugin.portalWeakness.portalAdded);
  window.COLOR_SELECTED_PORTAL = '#f0f';
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
