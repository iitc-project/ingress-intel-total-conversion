// ==UserScript==
// @id             iitc-plugin-highlight-portals-debug
// @name           IITC plugin: Debug: Highlighers
// @category       Debug
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Various debug and/or temporary highlighters. Will change over time as needed.
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

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighlighterDebug = function() {};

//window.plugin.portalHighlighterDebug.unknown11 = function(data) {
//  var opacity = 0.7;
//  var color = undefined;
//
//  if (data.portal.options.data.unknown_11) {
//    color='red';
//  }
//
//  if (color) {
//    data.portal.setStyle({fillColor: color, fillOpacity: opacity});
//  }
//}

var setup =  function() {
//  window.addPortalHighlighter('DEBUG: Unknoen_11', window.plugin.portalHighlighterDebug.unknown11);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
