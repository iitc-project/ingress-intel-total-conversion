// ==UserScript==
// @id             iitc-plugin-show-more-portals@jonatkins
// @name           IITC plugin: Show more portals
// @category       Tweaks
// @version        0.1.3.@@DATETIMEVERSION@@
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

    var z = mapZoom;

    // boost data zoom level by one when reasonably close (past the zoom<=12 point of the smaller
    // getThinnedEntitiesV4 tiles, to avoid excessive requests further out)
    if (mapZoom >= 13) z += 1;

    // not recommended on anything other than the very smallest of screens
//    // show unclaimed portals at an additional zoom level further than by default
//    if (mapZoom >= 15) z += 1;


    // limiting the mazimum zoom level for data retrieval reduces the number of requests at high zoom levels
    // (as all portal data is retrieved at z=17, why retrieve multiple z=18 tiles when fewer z=17 would do?)
    // very effective along with the new cache code
    if (z > 17) z=17;

    // if the data zoom is above the map zoom we can step back if the detail level is the same
    // with the new cache code this works rather well
    var minZoom = mapZoom;
    // due to the new smaller tiles used for zoom <= 12, we can get away with using slightly further out tiles
    // this can mean better use of the cache, and less load on the niantic servers
    if (mapZoom <= 12 && mapZoom > 0) minZoom -= 2;

    while (z > minZoom && getMinPortalLevelForZoom(z) == getMinPortalLevelForZoom(z-1)) {
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
