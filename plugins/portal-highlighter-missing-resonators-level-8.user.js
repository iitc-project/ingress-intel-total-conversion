// ==UserScript==
// @id             iitc-plugin-highlight-portals-missing-resonators-level-8@amsdams
// @name           IITC plugin: highlight portals missing resonators level 8
// @category       Highlighter
// @version        0.1.1.@@DATETIMEVERSION@@
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
window.plugin.portalHighligherPortalsMissingResonatorsLevel8.highlight = function (data, missing) {
  var d = data.portal.options.details,
    r = d.resonatorArray.resonators,
    countMissing = 0,
    opacity = 0.7,
    color = 'red';
  $.each(r, function (ind, reso) {
    if(!reso) {
      countMissing++;
    } else if(reso.level !== 8) {
      countMissing++;
    }
  });
  if(countMissing === missing) {
    data.portal.setStyle({
      fillColor: color,
      fillOpacity: opacity
    });
  } else {
    // reset
    data.portal.setStyle({
      color: window.COLORS[getTeam(data.portal.options.details)],
      fillOpacity: 0.5
    });
  }
}
window.plugin.portalHighligherPortalsMissingResonatorsLevel8.getHighlighter = function (missing) {
  return(function (data) {
    window.plugin.portalHighligherPortalsMissingResonatorsLevel8.highlight(data, missing);
  });
}
var setup = function () {
  for(var missing = 1; missing < 9; missing++) {
    window.addPortalHighlighter('Resos Missing: ' + missing + ' level 8 resonators ', window.plugin.portalHighligherPortalsMissingResonatorsLevel8.getHighlighter(missing));
  }
}
// PLUGIN END //////////////////////////////////////////////////////////
@@PLUGINEND@@