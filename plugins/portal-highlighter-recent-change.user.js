// ==UserScript==
// @id             iitc-plugin-highlight-portals-recent-change@vita10gy
// @name           IITC plugin: highlight portals with a recent change
// @category       Highlighter
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Highlights recently changed portals.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighligherPortalsRecentChange = function() {};

window.plugin.portalHighligherPortalsRecentChange.highlighter = function(data) {
  var time = data.portal.options.timestamp;
  var max_mins = 4 * 60;
  var minutes = (Date.now()-time)/1000/60;
  var opacity = (max_mins-minutes)/max_mins;
  if(opacity>0) {
    data.portal.setStyle({fillColor: 'red', fillOpacity: opacity});
  }
}

var setup =  function() {
  window.addPortalHighlighter('Recent Change', window.plugin.portalHighligherPortalsRecentChange.highlighter, function(){});
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
