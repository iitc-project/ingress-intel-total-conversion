// ==UserScript==
// @id             iitc-plugin-ipas-link@graphracer
// @name           IITC Plugin: simulate an attack on portal
// @category       Portal Info
// @version        0.2.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/xosofox/IPAS
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Adds a link to the portal details to open the portal in IPAS - Ingress Portal Attack Simulator on http://ipas.graphracer.com
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.ipasLink = function() {};

window.plugin.ipasLink.setupCallback = function() {
  addHook('portalDetailsUpdated', window.plugin.ipasLink.addLink);
}

window.plugin.ipasLink.addLink = function(p) {
  $('.linkdetails').append('<aside><a href="http://ipas.graphracer.com/index.html#' + window.plugin.ipasLink.getHash(p) + '" target="ipaswindow" title="Use IPAS to simulate an attack on this portal">Simulate attack</a></aside>');
}

window.plugin.ipasLink.getHash = function (p) {
  var details = p.portalDetails;

  var hashParts = [];
  $.each(details.resonatorArray.resonators, function (ind, reso) {
    if (reso)
      hashParts.push(reso.level + "," + reso.distanceToPortal + "," + reso.energyTotal);
    else
      hashParts.push("1,20,0");
  });
  var resos = hashParts.join(";");

  hashParts = [];
  $.each(details.portalV2.linkedModArray, function (ind, mod) {
    // s - shields
    // h - heat sink
    // i - intentionally left in
    // t - turret
    //
    // f - force amp
    // m - multi-hack
    // l - link-amp
    //
    var modCodes = {
      "RES_SHIELD": "s",
      "HEATSINK": "h",
      "TURRET": "t",
      "FORCE_AMP": "f",
      "MULTIHACK": "m",
      "LINK_AMPLIFIER": "l"
    }

    var mc = "0";
    if (mod) {
      if (mod.type in modCodes) {
        mc = modCodes[mod.type] + mod.rarity.charAt(0).toLowerCase();

        //special for shields to distinguish old/new mitigation
        if (mod.type == "RES_SHIELD")
          mc += mod.stats.MITIGATION;
      }
    }
    hashParts.push(mc);
  });
  var shields = hashParts.join(",");

  var linkParts = [];
  var portalLL = p.portal.getLatLng();
  var edges = getPortalLinks(p.guid);
  edges["in"].forEach(function (guid) {
    //calc distance in m here
    var distance = 1; //default to 1m, so a low level portal would support it

    //Try to find other portals details
    var o = window.portals[guid];
    if (o)
      distance = Math.round(portalLL.distanceTo(o.getLatLng()));

    linkParts.push(distance);
  });
  edges["out"].forEach(function (guid) {
    //calc distance in m here
    var distance = 1; //default to 1m, so a low level portal would support it

    //Try to find other portals details
    var o = window.portals[guid];
    if (o)
      distance = Math.round(portalLL.distanceTo(o.getLatLng()));

    linkParts.push(-distance); // "-" to mark outgoing links
  });
  var links = linkParts.join(",");

  return resos + "/" + shields + "/" + links; //changed with IPAS 1.1 to / instead of |
}

var setup = function () {
  window.plugin.ipasLink.setupCallback();
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
