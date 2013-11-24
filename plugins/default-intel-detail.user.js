// ==UserScript==
// @id             iitc-plugin-default-intel-detail@jonatkins
// @name           IITC plugin: Default intel detail level
// @category       Tweaks
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Use the portal level detail levels from the standard intel site. By default, IITC shows less detail when zoomed out, as this is enough for general use, is more friendly to the niantic servers, and loads much faster. This plugin restores the default zoom level to portal level mapping. Note: using this plugin causes a larger number of requests to the intel server, and at high resolutions can cause excessive requests to be made (yes: the default intel site also has this problem!), so it is not recommended except for low resolution screens.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.defaultIntelDetail = function() {};

window.plugin.defaultIntelDetail.setup  = function() {

  var stockIntelDetail = nemesis.dashboard.zoomlevel.ZOOM_TO_LOD_;

  // save the original function - so we can chain to it for levels we don't modify
  var origGetMinPortalLevelForZoom = window.getMinPortalLevelForZoom;

  // replace the window.getMinPortalLevelForZoom function - modify behaviour when L1+ or L3+ portals are shown

  window.getMinPortalLevelForZoom = function(z) {
    // for the further out zoom levels, use the stock intel site detail levels
    if (z <= 11) {
      return stockIntelDetail[z];
    }
    // for the closer zoom levels, stock intel and IITC default is the same. falling back
    // in this case allows this plugin to work alongside show-more-portals
    return origGetMinPortalLevelForZoom(z);
  }


};

var setup =  window.plugin.defaultIntelDetail.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
