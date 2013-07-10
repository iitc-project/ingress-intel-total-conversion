// ==UserScript==
// @id             iitc-plugin-ipas-link@graphracer
// @name           IITC Plugin: simulate an attack on portal
// @version        0.2.0.@@DATETIMEVERSION@@
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


function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.ipasLink = function() {};

window.plugin.ipasLink.setupCallback = function() {
  addHook('portalDetailsUpdated', window.plugin.ipasLink.addLink);
}

window.plugin.ipasLink.addLink = function(d) {
  $('.linkdetails').append('<aside><a href="http://ipas.graphracer.com/index.html#' + window.plugin.ipasLink.getHash(d.portalDetails) + '" target="ipaswindow" title="Use IAPS to simulate an attack on this portal">Simulate attack</a></aside>');
}

window.plugin.ipasLink.getHash = function (d) {
    var hashParts = [];
    $.each(d.resonatorArray.resonators, function (ind, reso) {
        if (reso) {
            hashParts.push(reso.level + "," + reso.distanceToPortal + "," + reso.energyTotal);
        } else {
            hashParts.push("1,20,0");
        }
    });
    var resos = hashParts.join(";");

    hashParts = [];
    $.each(d.portalV2.linkedModArray, function (ind, mod) {
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
                    if (mod.type == "RES_SHIELD") {
                        mc += mod.stats.MITIGATION;
                    }
                }
            }
            hashParts.push(mc);
        });
        var shields = hashParts.join(",");

        var linkParts = [];
        var edges = d.portalV2.linkedEdges;

        var portalL = new L.LatLng(d.locationE6.latE6 / 1E6, d.locationE6.lngE6 / 1E6)
        $.each(edges, function (ind, edge) {
            //calc distance in m here
            var distance = 1; //default to 1m, so a low level portal would support it

            //Try to find other portals details
            var guid = edge.otherPortalGuid
            if (window.portals[guid] !== undefined) {
                //get other portals details as o
                var o = window.portals[guid].options.details;
                var otherPortalL = new L.LatLng(o.locationE6.latE6 / 1E6, o.locationE6.lngE6 / 1E6);
                var distance = Math.round(portalL.distanceTo(otherPortalL));
            }

            if (!(edge.isOrigin)) {
                distance = distance * -1;
            }
            linkParts.push(distance);
        });
        var links = linkParts.join(",");

        return resos + "/" + shields + "/" + links; //changed with IPAS 1.1 to / instead of |
    }

var setup = function () {
    window.plugin.ipasLink.setupCallback();
}

// PLUGIN END //////////////////////////////////////////////////////////

if(window.iitcLoaded && typeof setup === 'function') {
  setup();
} else {
  if(window.bootPlugins)
    window.bootPlugins.push(setup);
  else
    window.bootPlugins = [setup];
}
} // wrapper end
// inject code into site context
var script = document.createElement('script');
script.appendChild(document.createTextNode('('+ wrapper +')();'));
(document.body || document.head || document.documentElement).appendChild(script);
