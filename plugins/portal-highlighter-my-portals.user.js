// ==UserScript==
// @id             iitc-plugin-highlight-portals-my-portals@vita10gy
// @name           IITC plugin: highlight my portals
// @category       Highlighter
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Uses the fill color of the portals to denote portals you have a hand in. Orange is just ownership. Yellow is sheilds. Red is Resonators. Red trumps both, yellow trumps orange.  
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
window.plugin.portalHighligherMyPortals = function() {};

window.plugin.portalHighligherMyPortals.highlight = function(data) {
  var d = data.portal.options.details;
  var portal_weakness = 0;
  if(getTeam(d) !== 0) {
    var color = '';
    var opacity = .7;
    if(PLAYER.guid === d.captured.capturingPlayerId) {
      color = 'orange';
    }
    
    var modCount = 0;
    $.each(d.portalV2.linkedModArray, function(ind, mod) {
      if(mod !== null && mod.installingUser === PLAYER.guid) {
        color = 'yellow';
        modCount++;
      }
    });
    
    if(modCount > 0) {
      opacity = modCount*.25*.7 + .3;
    }
    
    var resCount = 0;
    $.each(d.resonatorArray.resonators, function(ind, reso) {
      if(reso !== null && reso.ownerGuid === PLAYER.guid) {
        color = 'red';
        resCount++;
      }
    });
    
    if(resCount > 0) {
      opacity = resCount*.125*.7 + .3;
    }
    
    if(color !== '') {
      data.portal.setStyle({fillColor: color, fillOpacity: opacity});
    } else {
      data.portal.setStyle({color:  COLORS[getTeam(data.portal.options.details)],
                            fillOpacity: 0.5});
    }
  }
  window.COLOR_SELECTED_PORTAL = '#f0f';
}

var setup =  function() {
  window.addPortalHighlighter('My Portals', window.plugin.portalHighligherMyPortals.highlight);
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
