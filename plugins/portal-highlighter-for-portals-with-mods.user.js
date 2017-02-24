// ==UserScript==
// @id             iitc-plugin-for-highlight-portals-with-mods@superd
// @name           IITC plugin: highlight portals with mods
// @category       Highlighter
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Portals as red, if it has mods(turret,force amp,link amp,multi hack,heat sink) you select.
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
window.plugin.portalsWithTurret = function() {};
window.plugin.portalsWithForceAmp = function() {};
window.plugin.portalsWithLinkAmp = function() {};
window.plugin.portalsWithMultiHack = function() {};
window.plugin.portalsWithHeatSink = function() {};

window.plugin.portalsWithTurret.highlight = function(data) {
  var d = data.portal.options.details;
    
  var threatened = 0;
    
  $.each(d.portalV2.linkedModArray, function(ind, mod) {
      if(mod)
      {
        if(mod.type == 'TURRET')
       	{
          	threatened = threatened + 1;
       	}
      }
   });    
    
  if(threatened > 0)
  {
    var color = 'red';
    var opa = 0.4 + threatened * 0.2;
    if(opa > 1) opa = 1;
    var params = {fillColor: color, fillOpacity: opa};
    data.portal.setStyle(params);  
  }
  window.COLOR_SELECTED_PORTAL = '#f0f';
}

window.plugin.portalsWithForceAmp.highlight = function(data) {
  var d = data.portal.options.details;
    
  var threatened = 0;
    
  $.each(d.portalV2.linkedModArray, function(ind, mod) {
      if(mod)
      {
      	if(mod.type == 'FORCE_AMP')
       	{
          	threatened = threatened + 1;
       	}
      }
   });    
    
  if(threatened > 0)
  {
    var color = 'red';
    var opa = 0.4 + threatened * 0.2;
    if(opa > 1) opa = 1;
    var params = {fillColor: color, fillOpacity: opa};
    data.portal.setStyle(params);  
  }
  window.COLOR_SELECTED_PORTAL = '#f0f';
}
        
window.plugin.portalsWithMultiHack.highlight = function(data) {
  var d = data.portal.options.details;
    
  var threatened = 0;
    
  $.each(d.portalV2.linkedModArray, function(ind, mod) {
      if(mod)
      {
      	if(mod.type == 'MULTIHACK')
       	{
          	threatened = threatened + 1;
       	}
      }
   });    
    
  if(threatened > 0)
  {
    var color = 'red';
    var opa = 0.4 + threatened * 0.2;
    if(opa > 1) opa = 1;
    var params = {fillColor: color, fillOpacity: opa};
    data.portal.setStyle(params);  
  }
  window.COLOR_SELECTED_PORTAL = '#f0f';
}

window.plugin.portalsWithLinkAmp.highlight = function(data) {
  var d = data.portal.options.details;
        
  var threatened = 0;
    
  $.each(d.portalV2.linkedModArray, function(ind, mod) {
      if(mod)
      {
      	if(mod.type == 'LINK_AMPLIFIER')
       	{
          	threatened = threatened + 1;
       	}
      }
   });    
    
  if(threatened > 0)
  {
    var color = 'red';
    var opa = 0.4 + threatened * 0.2;
    if(opa > 1) opa = 1;
    var params = {fillColor: color, fillOpacity: opa};
    data.portal.setStyle(params);  
  }
  window.COLOR_SELECTED_PORTAL = '#f0f';
}

window.plugin.portalsWithHeatSink.highlight = function(data) {
  var d = data.portal.options.details;
    
  var threatened = 0;
    
  $.each(d.portalV2.linkedModArray, function(ind, mod) {
      if(mod)
      {
      	if(mod.type == 'HEATSINK')
       	{
          	threatened = threatened + 1;
       	}
      }
   });    
    
  if(threatened > 0)
  {
    var color = 'red';
    var opa = 0.4 + threatened * 0.2;
    if(opa > 1) opa = 1;
    var params = {fillColor: color, fillOpacity: opa};
    data.portal.setStyle(params);  
  }
  window.COLOR_SELECTED_PORTAL = '#f0f';
}

var setup =  function() {
  window.addPortalHighlighter('Portals with Turret', window.plugin.portalsWithTurret.highlight);
  window.addPortalHighlighter('Portals with Force Amp', window.plugin.portalsWithForceAmp.highlight);
  window.addPortalHighlighter('Portals with Multi Hack', window.plugin.portalsWithMultiHack.highlight);
  window.addPortalHighlighter('Portals with Link Amp', window.plugin.portalsWithLinkAmp.highlight);
  window.addPortalHighlighter('Portals with Heat Sink', window.plugin.portalsWithHeatSink.highlight);
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
