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
        //shields only, so far...
        var modCodes={
            c: "cs",
            r: "rs",
            v: "vrs"
        };

        var s = "0";
        if (mod) {
            if (mod.type === "RES_SHIELD") {
                s = mod.rarity.charAt(0).toLowerCase();
                s=modCodes[s];
                s = s + mod.stats.MITIGATION;
            }
        }
        hashParts.push(s);
    });
    var shields = hashParts.join(",");
    return resos + "|" + shields;
}

var setup = function () {
    window.plugin.ipasLink.setupCallback();
}

var setup =  function() {
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
