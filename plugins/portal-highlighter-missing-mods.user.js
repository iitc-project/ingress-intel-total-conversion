// ==UserScript==
// @id             iitc-plugin-highlight-portals-missing-mods@amsdams
// @name           IITC plugin: highlight portals missing mods
// @category       Highlighter
// @version        0.1.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] highlight portals missing mods 
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==
@@PLUGINSTART@@
//PLUGIN START ////////////////////////////////////////////////////////
//use own namespace for plugin
window.plugin.portalHighligherPortalsMissingMods = function () {};
window.plugin.portalHighligherPortalsMissingMods.highlight = function (data, missing) {
  var d = data.portal.options.details,
    mods = d.portalV2.linkedModArray,
    countMissing = 0,
    opacity = 0.7,
    color = 'red';
  $.each(mods, function (ind, mod) {
    if(!mod) {
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
window.plugin.portalHighligherPortalsMissingMods.getHighlighter = function (missing) {
  return(function (data) {
    window.plugin.portalHighligherPortalsMissingMods.highlight(data, missing);
  });
}
var setup = function () {
  for(var missing = 1; missing < 5; missing++) {
    window.addPortalHighlighter('Mods Missing: ' + missing + ' mods ', window.plugin.portalHighligherPortalsMissingMods.getHighlighter(missing));
  }
}
// PLUGIN END //////////////////////////////////////////////////////////
@@PLUGINEND@@