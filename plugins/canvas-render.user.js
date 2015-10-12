// ==UserScript==
// @id             iitc-plugin-canvas-render@jonatkins
// @name           IITC plugin: Use Canvas rendering
// @category       Tweaks
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] EXPERIMENTAL: use canvas-based rendering. Can be faster when viewing dense areas. Limited testing of the feature so far
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @include        https://www.ingress.com/mission/*
// @include        http://www.ingress.com/mission/*
// @match          https://www.ingress.com/mission/*
// @match          http://www.ingress.com/mission/*
// @grant          unsafeWindow
// ==/UserScript==

// NON-STANDARD plugin - try and set the variable early, as
// we need this global variable set before leaflet initialises
window.L_PREFER_CANVAS = true;
if (typeof unsafeWindow !== 'undefined') unsafeWindow.L_PREFER_CANVAS = true;  //doesn't actually work... :/


@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// we need this global variable set before leaflet initialises
window.L_PREFER_CANVAS = true;

// use own namespace for plugin
window.plugin.canvasRendering = function() {};

window.plugin.canvasRendering.setup  = function() {

  // nothing we can do here - other than check that canvas rendering was enabled
  if (!L.Path.CANVAS) {
    dialog({
      title:'Canvas Render Warning',
      text:'The Canvas Rendering plugin failed to enable canvas rendering in leaflet. This will occur if it initialises too late.\n'
          +'Try re-ordering userscripts so Canvas Rendering is before the main IITC script.'
    });
  }

};

var setup =  window.plugin.canvasRendering.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
