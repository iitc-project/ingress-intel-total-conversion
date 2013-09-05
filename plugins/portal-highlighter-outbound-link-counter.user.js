// ==UserScript==
// @id             iitc-plugin-highlight-outbound-link-counter@cathesaurus
// @name           IITC plugin: highlight portals running low on outbound links
// @category       Highlighter
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Uses the fill color of the portals to show the number of outbound links: red = 8 (i.e. no more outbound links may be made), orange = 6 or 7, yellow = 4 or 5.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighlighterOutboundLinkCounter = function() {};

window.plugin.portalHighlighterOutboundLinkCounter.highlight = function(data) {
  var d = data.portal.options.details;
  var outgoing = 0;
  var playerFaction = 0;

  if (window.PLAYER.team === 'RESISTANCE') {
    playerFaction = window.TEAM_RES;
  } else {
    playerFaction = window.TEAM_ENL;
  }

  // Only interested in portals of player's faction
  if(getTeam(d) === playerFaction) {
    if(d.portalV2.linkedEdges) $.each(d.portalV2.linkedEdges, function(ind, link) {
      if (link.isOrigin) {
        outgoing++;
      }
    });

    if(outgoing > 3) {
      if(outgoing < 6) {
        color = 'yellow';
      } else if(outgoing < 8) {
        color = 'orange';
      } else {
        color = 'red';
      }
      var params = {fillColor: color, fillOpacity: 1};
      data.portal.setStyle(params);
    }
  }
}

var setup =  function() {
  window.addPortalHighlighter('Outbound Links', window.plugin.portalHighlighterOutboundLinkCounter.highlight);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
