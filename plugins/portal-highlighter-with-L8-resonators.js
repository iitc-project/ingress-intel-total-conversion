// ==UserScript==
// @id             iitc-plugin-highlight-portals-with-L8-resonators@superd
// @name           IITC plugin: highlight portals with L8 resonators
// @version        0.1.0.20130522.175822
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      https://secure.jonatkins.com/iitc/release/plugins/portal-highlighter-with-L8-resonators.meta.js
// @downloadURL    https://secure.jonatkins.com/iitc/release/plugins/portal-highlighter-missing-resonators.user.js
// @description    [superd-2013-05-28-175822] Uses the fill red of the portals, if portal has L8 res
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
window.plugin.portalsWithL8Resonators = function() {};

window.plugin.portalsWithL8Resonators.highlight = function(data) {
  var d = data.portal.options.details;
  var has_L8 = 0;
  var portal_weakness = 0;
  if(getTeam(d) !== 0) {
    //Ding the portal for every missing resonator.
    var resCount = 0;
    $.each(d.resonatorArray.resonators, function(ind, reso) {
      if(reso === null) {
        portal_weakness += .125;
      } else {
        var level = parseInt(reso.level);
        if(level == 8)
        {
          has_L8+=1;
        }
        resCount++;
      }
    });
    
    //alert("has L8 res"+has_L8);
      
    if(has_L8 > 0)
    {
      var color = 'red';
      var params = {fillColor: color, fillOpacity: 0.5};
      data.portal.setStyle(params);  
    }else
    {
      /* var color = 'blue';
      var params = {fillColor: color, fillOpacity: 0.5};
      data.portal.setStyle(params);
      */
    }
  }
  window.COLOR_SELECTED_PORTAL = '#f0f';
}

var setup =  function() {
  window.addPortalHighlighter('Portals with L8 Resonators', window.plugin.portalsWithL8Resonators.highlight);
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
