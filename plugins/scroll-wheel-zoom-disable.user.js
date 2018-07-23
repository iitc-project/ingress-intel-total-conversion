// ==UserScript==
// @id             iitc-plugin-scroll-wheel-zoom-disable@jonatkins
// @name           IITC plugin: disable mouse wheel zoom
// @category       Tweaks
// @version        0.1.0.@@DATETIMEVERSION@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Disable the use of mouse wheel to zoom. The map zoom controls or keyboard are still available.
@@METAINFO@@
// ==/UserScript==


@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.scrollWheelZoomDisable = function() {};

window.plugin.scrollWheelZoomDisable.setup = function() {

  window.map.scrollWheelZoom.disable();

};

var setup =  window.plugin.scrollWheelZoomDisable.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
