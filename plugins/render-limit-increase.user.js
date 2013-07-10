// ==UserScript==
// @id             iitc-plugin-render-limit-increase@jonatkins
// @name           IITC plugin: render limit increase
// @category       Tweaks
// @version        0.3.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Increase the render limits, so less likely to be hit in higher density areas
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==


@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.renderLimitIncrease = function() {};

window.plugin.renderLimitIncrease.setHigherLimits = function() {

  // this controls how far data is being drawn outside the viewport. Set
  // it 0 to only draw entities that intersect the current view. A value
  // of one will render an area twice the size of the viewport (or some-
  // thing like that, Leaflet doc isn’t too specific). Setting it too low
  // makes the missing data on move/zoom out more obvious. Setting it too
  // high causes too many items to be drawn, making drag&drop sluggish.
  // default for iitc is 0.3. a lower value reduces overdraw
  window.VIEWPORT_PAD_RATIO = 0.1;


  // Leaflet will get very slow for MANY items. It’s better to display
  // only some instead of crashing the browser.
  // defaults are 1000 portals, 400 links and 200 fields
  window.MAX_DRAWN_PORTALS = 5000;
  window.MAX_DRAWN_LINKS = 2000;
  window.MAX_DRAWN_FIELDS = 1000;
  window.USE_INCREASED_RENDER_LIMIT = true; // Used for other plugins
};

var setup =  window.plugin.renderLimitIncrease.setHigherLimits;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
