// ==UserScript==
// @id             iitc-plugin-reso-energy-pct-in-portal-detail@xelio
// @name           IITC plugin: reso energy pct in portal detail
// @category       Portal Info
// @version        0.1.2.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Show resonator energy percentage on resonator energy bar in portal detail panel.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

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

@@PLUGINEND@@
