// ==UserScript==
// @id             iitc-plugin-show-less-portals@jonatkins
// @name           IITC plugin: Show less portals when zoomed out
// @category       Tweaks
// @version        0.1.4.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Decrease the portal detail level used when zoomed out. This can speed up map loading, decrease the amount of data used, and solve excessive request issues. Only applies when zoomed out to show no closer than L3 portals. May stop display of the smaller links/fields.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.showLessPortals = function() {};

window.plugin.showLessPortals.setup  = function() {

  // save the original function - so we can chain to it for levels we don't modify
  var origGetPortalDataZoom = window.getPortalDataZoom;

  // replace the window.getPortalDataZoom function - modify behaviour when zoomed close

  window.getPortalDataZoom = function() {
    var mapZoom = map.getZoom();

    // the latest intel site update, as of 2013-10-16, requests a silly number of map tiles at the larger zoom levels
    // IITC matches the behaviour by default, but it makes sense to reduce the detail level sooner

    // at the largest scale zooms - move back two levels
    if (mapZoom <= 7) {
      return Math.max(mapZoom-2,0);
    }

    // intermediate zoom levels - move back one
    if (mapZoom <= 11) {
      return Math.max(mapZoom-1,0);
    }

    // otherwise revert to default behaviour
    return origGetPortalDataZoom();
  }


};

var setup =  window.plugin.showLessPortals.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
