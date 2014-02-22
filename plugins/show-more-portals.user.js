// ==UserScript==
// @id             iitc-plugin-show-more-portals@jonatkins
// @name           IITC plugin: Show more portals
// @category       Tweaks
// @version        0.2.0.@@DATETIMEVERSION@@
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

// NOTE: the logic required is closely tied to the IITC+stock map detail level code - so the logic is moved there now
// and just enabled by this flag
  window.CONFIG_ZOOM_SHOW_MORE_PORTALS=true;

};

var setup =  window.plugin.showMorePortals.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
