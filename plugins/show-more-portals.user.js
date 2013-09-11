// ==UserScript==
// @id             iitc-plugin-show-more-portals@jonatkins
// @name           IITC plugin: Show more portals
// @category       Tweaks
// @version        0.1.3.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Boost the detail level of portals shown on the map by one zoom level when zoomed in close (L2+ portals or closer)
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

    // this plugin only cares about close in zoom levels (zoom 13 and higher) - run the original
    // code when this isn't the case. (this way, multiple zoom-modifying plugins can exist at once - in theory)
    if (mapZoom < 13) {
      return origGetPortalDataZoom();
    }

    // make sure we're dealing with an integer here
    // (mobile: a float somehow gets through in some cases!)
    var z = parseInt(mapZoom);

    // boost data zoom level by one
    z += 1;

    // not recommended on anything other than the very smallest of screens
//    // show unclaimed portals at an additional zoom level further than by default
//    if (mapZoom >= 15) z += 1;


    // limiting the mazimum zoom level for data retrieval reduces the number of requests at high zoom levels
    // (as all portal data is retrieved at z=17, why retrieve multiple z=18 tiles when fewer z=17 would do?)
    // very effective along with the new cache code
    if (z > 17) z=17;

    // if the data zoom is above the map zoom we can step back if the detail level is the same
    // with the new cache code this works rather well
    while (z > mapZoom && getMinPortalLevelForZoom(z) == getMinPortalLevelForZoom(z-1)) {
      z = z-1;
    }

    return z;
  }


};

var setup =  window.plugin.showMorePortals.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
