// ==UserScript==
// @id             iitc-plugin-resonator-display-zoom-level-decrease@xelio
// @name           IITC plugin: resonator display zoom level decrease
// @category       Tweaks
// @version        1.0.2.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Resonator start display earlier
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.resonatorDisplayZoomLevelDecrease = function() {};

window.plugin.resonatorDisplayZoomLevelDecrease.changeConstant = function() {

// Minimum zoom level resonator will display
window.RESONATOR_DISPLAY_ZOOM_LEVEL = 16;
};

var setup =  window.plugin.resonatorDisplayZoomLevelDecrease.changeConstant;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
