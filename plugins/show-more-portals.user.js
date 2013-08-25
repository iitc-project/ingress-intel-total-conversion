// ==UserScript==
// @id             iitc-plugin-show-more-portals@jonatkins
// @name           IITC plugin: Show more portals
// @category       Tweaks
// @version        0.1.2.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Boost the detail level of portals shown on the map by one zoom level. Good for small screens. Likely to increase request failed errors on larger screens.
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

  // replace the window.getPortalDataZoom function

  window.getPortalDataZoom = function() {
    var mapZoom = map.getZoom();

    // yes, it is possible to increase this beyond "+1" - however, that will end up producing a rediculous number
    // of requests to the Niantic servers, giving many request failed errors/tile timeouts
    // (every increase by one requests four times as many data tiles)
    var z = mapZoom + 1;

    // UPDATE: due to the new smaller tiles used when zoomed out further (getThinnedEntitiesV4), it gets silly
    // doing this when zoomed out. so only boost when zoomed in
    if (z <= 12) z = mapZoom;


    // limiting the mazimum zoom level for data retrieval reduces the number of requests at high zoom levels
    // (as all portal data is retrieved at z=17, why retrieve multiple z=18 tiles when fewer z=17 would do?)
    // very effective along with the new cache code
    if (z > 17) z=17;

    // if the data zoom is above the map zoom we can step back if the detail level is the same
    // with the new cache code this works rather well
    while (z > mapZoom && getMinPortalLevelForZoom(z) == getMinPortalLevelForZoom(z-1)) {
      z = z-1;
    }

    //sanity check - should never happen
    if (z < 0) z=0;

    return z;
  }


};

var setup =  window.plugin.showMorePortals.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
