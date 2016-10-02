// ==UserScript==
// @id             iitc-plugin-scroll-wheel-zoom-disable@jonatkins
// @name           IITC plugin: disable mouse wheel zoom
// @category       Tweaks
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Disable the use of mouse wheel to zoom. The map zoom controls or keyboard are still available.
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @include        https://*.ingress.com/mission/*
// @include        http://*.ingress.com/mission/*
// @match          https://*.ingress.com/mission/*
// @match          http://*.ingress.com/mission/*
// @grant          none
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
