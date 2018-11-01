// ==UserScript==
// @id             iitc-plugin-highlight-forgotten@jonatkins
// @name           IITC plugin: Inactive portals. Hightlight unclaimed portals with no recent activity
// @category       Highlighter
// @version        0.1.0.20181101.60209
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      none
// @downloadURL    none
// @description    [mobile-2018-11-01-060209] Use the portal fill color to denote if the portal is unclaimed with no recent activity. Shades of red from one week to one month, then tinted to purple for longer. May also highlight captured portals that are stuck and fail to decay every 24 hours.
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
plugin_info.pluginId = 'portal-highlighter-forgotten';
//END PLUGIN AUTHORS NOTE



// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighlighterInactive = function() {};

window.plugin.portalHighlighterInactive.highlight = function(data) {

  if (data.portal.options.timestamp > 0) {

    var daysUnmodified = (new Date().getTime() - data.portal.options.timestamp) / (24*60*60*1000);

    if (daysUnmodified >= 7) {

      var fill_opacity = Math.min(1,((daysUnmodified-7)/24)*.85 + .15);

      var blue = Math.max(0,Math.min(255,Math.round((daysUnmodified-31)/62*255)));

      var colour = 'rgb(255,0,'+blue+')';

      var params = {fillColor: colour, fillOpacity: fill_opacity};

      data.portal.setStyle(params);
    }
  }

}

var setup =  function() {
  window.addPortalHighlighter('Inactive Portals', window.plugin.portalHighlighterInactive.highlight);
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


