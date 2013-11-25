// ==UserScript==
// @id             iitc-plugin-show-more-portals@jonatkins
// @name           IITC plugin: Show more portals
// @category       Tweaks
// @version        0.1.6.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Boost the detail level of portals shown so that unclaimed portals are visible when normally L1+ portals would be shown, and L2+ are visible when normally L3+ are shown. Recent protocol changes by Niantic means this no longer sends more requests than the standard intel site, and can mean fewer requests.
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
  var origGetMinPortalLevelForZoom = window.getMinPortalLevelForZoom;

  // replace the window.getMinPortalLevelForZoom function - modify behaviour when L1+ or L3+ portals are shown

  window.getMinPortalLevelForZoom = function(z) {
    var level = origGetMinPortalLevelForZoom(z);

    // as of 2013-10-16...

    // the stock site uses the same tile size for both L1+ portals and all portals
    // therefore, changing the L1+ zoom levels into all portals zoom level is not unfriendly to the servers
    // and the same applies for L2+ and L3+ detail levels
    // (in some ways it's nicer, as IITC caches better)

    if (level == 1) level = 0;
    if (level == 3) level = 2;

    return level;
  }


};

var setup =  window.plugin.showMorePortals.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
