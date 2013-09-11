// ==UserScript==
// @id             iitc-plugin-highlight-mitigation@jonatkins
// @name           IITC plugin: hightlight portals total mitigation
// @category       Highlighter
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Uses the fill color of the portals to show mitigation. Shades of red to the maximum of 95, then tints towards purple for over 95
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighligherMitigation = function() {};

// taken from portalDefense plugin. needs to be moved into IITC core
window.plugin.portalHighligherMitigation.computeDef = function(portal) {
  var m = portal.options.details.portalV2.linkedModArray;
  var ret = {};
  ret.mod = 0;
  ret.links = 0;
  $.each(m, function(ind, mod) {
    if (!mod) return true;
    if(!mod.stats.MITIGATION)
      return true;
    ret.mod += parseInt(mod.stats.MITIGATION);
  });
  var link = 0;
  $(portal.options.details.portalV2.linkedEdges).each(function () {
    link++;
  });
  if (link > 0) {
    ret.links = Math.round(400/9*Math.atan(link/Math.E));
  }
  ret.total = Math.min(95, ret.mod + ret.links);

  return ret;
}

window.plugin.portalHighligherMitigation.highlight = function(data) {

  var defense = window.plugin.portalHighligherMitigation.computeDef (data.portal);

  if (defense.total > 0) {
    var fill_opacity = (defense.total/95)*.85 + .15;

    // maximum mitigation from links is approx 69, and from shields is 120, giving max of ~189
    // therefore maximum over mitigation is ~94. let's treat 80 as our max amount and scale that to the blue channel for colour tint
    var over_mitigation = Math.max(0, defense.mod+defense.links-defense.total);

    var blue = Math.max(0,Math.min(255,Math.round(over_mitigation/80*255)));

    var colour = 'rgb(255,0,'+blue+')';

    var params = {fillColor: colour, fillOpacity: fill_opacity};

    data.portal.setStyle(params);
  }

}

var setup =  function() {
  window.addPortalHighlighter('Mitigation (defense)', window.plugin.portalHighligherMitigation.highlight);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
