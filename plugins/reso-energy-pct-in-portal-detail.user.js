// ==UserScript==
// @id             iitc-plugin-reso-energy-pct-in-portal-detail@xelio
// @name           iitc: reso energy pct in portal detail
// @version        0.1
// @namespace      https://github.com/breunigs/ingress-intel-total-conversion
// @updateURL      https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/reso-energy-pct-in-portal-detail.user.js
// @downloadURL    https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/reso-energy-pct-in-portal-detail.user.js
// @description    Show resonator energy percentage on resonator energy bar in portal detail panel.
// @include        http://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// ==/UserScript==

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.resoEnergyPctInPortalDetal = function() {};

window.plugin.resoEnergyPctInPortalDetal.updateMeter = function(data) {
  var meterLevel = $("span.meter-level");
  meterLevel
    .css('top','0px')
    .css('left','5px')
    .css('margin-left','0px')
    .css('font-size','80%')
    .css('line-height','18px');
  meterLevel.each(function() {
    var matchResult = $(this).parent().attr('title').match(/\((\d*\%)\)/);
    if(matchResult) {
      var newMeterContent = 'L' + $(this).html() + '&nbsp;&nbsp;' + matchResult[1];
      $(this).html(newMeterContent);
    }
  });
}

var setup =  function() {
  window.addHook('portalDetailsUpdated', window.plugin.resoEnergyPctInPortalDetal.updateMeter);
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
