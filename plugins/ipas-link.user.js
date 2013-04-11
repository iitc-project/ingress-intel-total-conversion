// ==UserScript==
// @id             iitc-plugin-ipas-link@graphracer
// @name           IITC Plugin: simulate an attack on portal
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/xosofox/IPAS
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Adds a link to the portal details to open the portal in IPAS - Ingress Portal Attack Simulator on http://ipas.graphracer.com
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
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
    $('.linkdetails').append('<aside style="text-align: center; display: block"><a href="http://ipas.graphracer.com/index.html#' + window.plugin.ipasLink.getHash(d.portalDetails) + '" target="ipaswindow">simulate attack with IPAS</a></aside>');
}

window.plugin.ipasLink.getHash = function(d) {
    var hashParts=[];
    $.each(d.resonatorArray.resonators, function(ind, reso) {
        if ($reso) {
            hashParts.push(reso.level + "," + reso.distanceToPortal + "," + reso.energyTotal);
        } else {
            hashParts.push(1 + "," + 35 + "," + 0); // Dummy values, the only important one is energy=0
        }
    }
    });
    return hashParts.join(";")+"|" + "0,0,0,0"; //shields not implemented yet
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

