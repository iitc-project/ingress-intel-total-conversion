// ==UserScript==
// @id             iitc-plugin-highlight-portals-my-portals@vita10gy
// @name           IITC plugin: highlight my portals
// @category       Highlighter
// @version        0.1.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Use the portal fill color to denote if you had a hand in building the portal. Orange: just ownership. Yellow: shields. Red: resonators. Red trumps both, yellow trumps orange.  
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighlighterMyPortals = function() {};

window.plugin.portalHighlighterMyPortals.highlight = function(data) {
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
    } 
  }
}

var setup =  function() {
  window.addPortalHighlighter('My Portals', window.plugin.portalHighlighterMyPortals.highlight);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
