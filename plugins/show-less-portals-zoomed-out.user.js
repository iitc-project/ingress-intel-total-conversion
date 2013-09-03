// ==UserScript==
// @id             iitc-plugin-show-less-portals@jonatkins
// @name           IITC plugin: Show less portals when zoomed out
// @category       Tweaks
// @version        0.1.3.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Decrease the portal detail level used when zoomed out. This can speed up map loading, decrease the amount of data used, and result in faster display. Only applies when zoomed out to show no closer than L3 portals. May stop display of the smaller links/fields.
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

    // this plugin only cares about close in zoom levels (zoom 13 and higher) - run the original
    // code when this isn't the case. (this way, multiple zoom-modifying plugins can exist at once - in theory)
    if (mapZoom >= 13) {
      return origGetPortalDataZoom();
    }

    // make sure we're dealing with an integer here
    // (mobile: a float somehow gets through in some cases!)
    var z = parseInt(mapZoom);

    // reduce the portal zoom level by one
    z -= 1;

    // ensure we're not too far out
    if (z < 0) z=0;

    return z;
  }


};

var setup =  window.plugin.showLessPortals.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
