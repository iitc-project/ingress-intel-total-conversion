// ==UserScript==
// @id             iitc-plugin-highlight-portals-missing-mods@amsdams
// @name           IITC plugin: highlight portals missing mods
// @category       Highlighter
// @version        0.1.2.@@DATETIMEVERSION@@
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
window.plugin.portalHighligherPortalsMissingMods.MODS_PER_PORTAL=4;
window.plugin.portalHighligherPortalsMissingMods.PORTAL_FILL_COLOR='red';
window.plugin.portalHighligherPortalsMissingMods.PORTAL_FILL_OPACITY=0.7;

window.plugin.portalHighligherPortalsMissingMods.highlight = function (data, missing) {
  var mods = data.portal.options.details.portalV2.linkedModArray,
    countMissing = 0;
  $.each(mods, function (ind, mod) {
    if(!mod) {
      countMissing++;
    }
  });
  if(countMissing === missing) {
    data.portal.setStyle({
      fillColor: window.plugin.portalHighligherPortalsMissingMods.PORTAL_FILL_OPACITY,
      fillOpacity: window.plugin.portalHighligherPortalsMissingMods.PORTAL_FILL_COLOR
    });
  }
}
window.plugin.portalHighligherPortalsMissingMods.getHighlighter = function (missing) {
  return(function (data) {
    window.plugin.portalHighligherPortalsMissingMods.highlight(data, missing);
  });
}
var setup = function () {
  for(var missing = 1; missing <= window.plugin.portalHighligherPortalsMissingMods.MODS_PER_PORTAL; missing++) {
    window.addPortalHighlighter('Mods Missing: ' + missing + ' mods ', window.plugin.portalHighligherPortalsMissingMods.getHighlighter(missing));
  }
}
// PLUGIN END //////////////////////////////////////////////////////////
@@PLUGINEND@@