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
// @include        https://www.ingress.com/mission/*
// @include        http://www.ingress.com/mission/*
// @match          https://www.ingress.com/mission/*
// @match          http://www.ingress.com/mission/*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.resoEnergyPctInPortalDetail = function() {};

window.plugin.resoEnergyPctInPortalDetail.updateMeter = function(data) {
  $("span.meter-level")
    .css({
      "word-spacing": "-1px",
      "text-align": "left",
      "font-size": "90%",
      "padding-left": "2px",
    })
    .each(function() {
      var matchResult = $(this).parent().attr('title').match(/\((\d*\%)\)/);
      if(matchResult) {
        var html = $(this).html() + '<div style="position:absolute;right:0;top:0">' + matchResult[1] + '</div>';
        $(this).html(html);
      }
    });
}

var setup =  function() {
  window.addHook('portalDetailsUpdated', window.plugin.resoEnergyPctInPortalDetail.updateMeter);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
