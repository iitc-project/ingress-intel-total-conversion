// ==UserScript==
// @id             iitc-plugin-show-more-portals@jonatkins
// @name           IITC plugin: Show more portals
// @category       Tweaks
// @version        0.1.5.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Boost the detail level of portals shown so that unclaimed portals are visible when normally L1+ portals would be shown, and L2+ are visible when normally L3+ are shown
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.showMorePortals = function() {};

window.plugin.showMorePortals.setup  = function() {

  // save the original function - so we can chain to it for levels we don't modify
  var origGetPortalDataZoom = window.getPortalDataZoom;

  // replace the window.getPortalDataZoom function - modify behaviour when zoomed close

  window.getPortalDataZoom = function() {
    var mapZoom = map.getZoom();

    // as of 2013-10-16...

    // the stock site uses the same tile size for both L1+ portals and all portals
    // therefore, changing the L1+ zoom levels into all portals zoom level is not unfriendly to the servers
    // (in some ways it's nicer, as IITC caches better)
    if (mapZoom >= 15) {
      return 17;
    }

    // and, the same scale for L2+ and L3+ portals. again, forcing the level down isn't unfriendly to the servers
    // (ditto on the cacheing)
    if (mapZoom >= 12) {
      return 13;
    }

    return origGetPortalDataZoom();
  }


};

var setup =  window.plugin.showMorePortals.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
