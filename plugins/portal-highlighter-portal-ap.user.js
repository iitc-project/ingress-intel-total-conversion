// ==UserScript==
// @id             iitc-plugin-highlight-portals-by-ap@swined
// @name           IITC plugin: highlight portals by AP
// @category       Highlighter
// @version        0.1.2.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Use the portal fill color to denote AP available from it.
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
window.plugin.portalHighlighterPortalsAP = function() {};

var setup = function() {
  window.addPortalHighlighter('AP', function(data) {
    var links = window.getPortalLinks(data.portal.options.guid);
    var ap = portalApGainMaths(
        data.portal.options.data.resCount,
        links.in.length + links.out.length,
        getPortalFieldsCount(data.portal.options.guid)
    );
    var teams = ['NEUTRAL', 'RESISTANCE', 'ENLIGHTENED'];
    var my = PLAYER.team === teams[data.portal.options.team] ? ap.friendlyAp : ap.enemyAp;
    if (isNaN(my) || my < 2500) {
        data.portal.setStyle({ fillOpacity: 0 });
    } else if (my < 5000) {
        data.portal.setStyle({ fillColor: 'DarkOrange' });
    } else if (my < 10000) {
        data.portal.setStyle({ fillColor: 'yellow' });
    } else if (my < 20000) {
        data.portal.setStyle({ fillColor: 'red' });
    } else {
        data.portal.setStyle({ fillColor: 'magenta' });
    }
  });
};

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
