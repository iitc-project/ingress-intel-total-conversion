// ==UserScript==
// @id             iitc-plugin-highlight-portals-missing-resonators-level-8@amsdams
// @name           IITC plugin: highlight portals missing resonators level 8
// @category       Highlighter
// @version        0.1.3.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] highlight portals missing level 8 resonators
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==
@@PLUGINSTART@@
// PLUGIN START ////////////////////////////////////////////////////////
// use own namespace for plugin
window.plugin.portalHighligherPortalsMissingResonatorsLevel8 = function () {};
window.plugin.portalHighligherPortalsMissingResonatorsLevel8.RESOS_PER_PORTAL=8;
window.plugin.portalHighligherPortalsMissingResonatorsLevel8.PORTAL_FILL_COLOR='red';
window.plugin.portalHighligherPortalsMissingResonatorsLevel8.PORTAL_FILL_OPACITY=0.7;

window.plugin.portalHighligherPortalsMissingResonatorsLevel8.highlight = function (data, missing) {
  var resos = data.portal.options.details.resonatorArray.resonators,
    countMissing = 0;
  $.each(resos, function (ind, reso) {
    if(!reso || reso.level !== window.MAX_PORTAL_LEVEL) {
      countMissing++;
    }
  });
  if(countMissing === missing) {
    data.portal.setStyle({
      fillColor: window.plugin.portalHighligherPortalsMissingResonatorsLevel8.PORTAL_FILL_COLOR,
      fillOpacity: window.plugin.portalHighligherPortalsMissingResonatorsLevel8.PORTAL_FILL_OPACITY
    });
  }
}
window.plugin.portalHighligherPortalsMissingResonatorsLevel8.getHighlighter = function (missing) {
  return(function (data) {
    window.plugin.portalHighligherPortalsMissingResonatorsLevel8.highlight(data, missing);
  });
}
var setup = function () {
  for(var missing = 1; missing <=  window.plugin.portalHighligherPortalsMissingResonatorsLevel8.RESOS_PER_PORTAL; missing++) {
    window.addPortalHighlighter('Resos Missing: ' + missing + ' level '+window.MAX_PORTAL_LEVEL+' resonators ', window.plugin.portalHighligherPortalsMissingResonatorsLevel8.getHighlighter(missing));
  }
}
// PLUGIN END //////////////////////////////////////////////////////////
@@PLUGINEND@@