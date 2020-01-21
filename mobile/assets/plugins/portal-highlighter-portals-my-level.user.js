// ==UserScript==
// @id             iitc-plugin-highlight-portals-my-level@vita10gy
// @name           IITC plugin: highlight portals by my level
// @category       Highlighter
// @version        0.1.2.20181101.60209
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      none
// @downloadURL    none
// @description    [mobile-2018-11-01-060209] Use the portal fill color to denote if the portal is either at and above, or at and below your level.
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @include        https://*.ingress.com/mission/*
// @include        http://*.ingress.com/mission/*
// @match          https://*.ingress.com/mission/*
// @match          http://*.ingress.com/mission/*
// @grant          none
// ==/UserScript==


function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

//PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
//(leaving them in place might break the 'About IITC' page or break update checks)
plugin_info.buildName = 'mobile';
plugin_info.dateTimeVersion = '20181101.60209';
plugin_info.pluginId = 'portal-highlighter-portals-my-level';
//END PLUGIN AUTHORS NOTE



// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighlighterPortalsMyLevel = function() {};


window.plugin.portalHighlighterPortalsMyLevel.belowLevel = function(data) {
  window.plugin.portalHighlighterPortalsMyLevel.colorLevel(true,data);
}

window.plugin.portalHighlighterPortalsMyLevel.aboveLevel = function(data) {
  window.plugin.portalHighlighterPortalsMyLevel.colorLevel(false,data);
}

window.plugin.portalHighlighterPortalsMyLevel.colorLevel = function(below,data) {
  var portal_level = data.portal.options.level;

  // as portal levels can never be higher than L8, clamp the player level to this for highlight purposes
  var player_level = Math.min(PLAYER.level,8);

  var opacity = .6;
  if((below && portal_level <= player_level) ||
     (!below && portal_level >= player_level)) {
    data.portal.setStyle({fillColor: 'red', fillOpacity: opacity});
  } 
}

var setup =  function() {
  window.addPortalHighlighter('Below My Level', window.plugin.portalHighlighterPortalsMyLevel.belowLevel);
  window.addPortalHighlighter('Above My Level', window.plugin.portalHighlighterPortalsMyLevel.aboveLevel);
}

// PLUGIN END //////////////////////////////////////////////////////////


setup.info = plugin_info; //add the script info data to the function as a property
if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);


