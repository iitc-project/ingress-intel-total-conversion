// ==UserScript==
// @id             iitc-plugin-highlight-portals-count-resonators-by-level@amsdams
// @name           IITC plugin: highlight portals count resonators by level
// @category       Highlighter
// @version        0.0.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] highlight portals count level 8 resonators
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==
@@PLUGINSTART@@
// PLUGIN START ////////////////////////////////////////////////////////
// use own namespace for plugin
window.plugin.portalHighligherResoCountColor = function () {};
window.plugin.portalHighligherResoCountColor.RESOS_PER_PORTAL = 8;

window.plugin.portalHighligherResoCountColor.PORTAL_FILL_OPACITY = 0.7;
window.plugin.portalHighligherResoCountColor.highlight = function (data, resoLevel) {
  var resos = data.portal.options.details.resonatorArray.resonators,
    resoLevelCount = 0;
  $.each(resos, function (ind, reso) {
    if(reso && reso.level == resoLevel) {
      resoLevelCount++;
    }
  });
  // if(resoLevelCount === resoLevel) {
  data.portal.setStyle({
    fillColor: window.COLORS_LVL[resoLevelCount],
    fillOpacity: window.plugin.portalHighligherResoCountColor.PORTAL_FILL_OPACITY
  });
  // }
}
window.plugin.portalHighligherResoCountColor.getHighlighter = function (resoLevel) {
  return(function (data) {
    window.plugin.portalHighligherResoCountColor.highlight(data, resoLevel);
  });
}
var setup = function () {
  for(var resoLevel = 1; resoLevel <= window.plugin.portalHighligherResoCountColor.RESOS_PER_PORTAL; resoLevel++) {
    window.addPortalHighlighter('Color with R' + resoLevel, window.plugin.portalHighligherResoCountColor.getHighlighter(resoLevel));
  }
}
// PLUGIN END //////////////////////////////////////////////////////////
@@PLUGINEND@@