// ==UserScript==
// @id             iitc-plugin-reso-energy-days-in-portal-detail@xelio
// @name           IITC plugin: reso energy days in portal detail
// @category       Portal Info
// @version        0.1.2.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Show resonator energy days remaining on resonator energy bar in portal detail panel.
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

function wrapper(plugin_info) {
    // ensure plugin framework is there, even if iitc is not yet loaded
    if (typeof window.plugin !== 'function') window.plugin = function () { };

    // PLUGIN START ////////////////////////////////////////////////////////

    // use own namespace for plugin
    window.plugin.resoEnergyDaysInPortalDetail = function () { };

    window.plugin.resoEnergyDaysInPortalDetail.updateMeter = function (data) {
        $("span.meter-level")
          .css({
              "word-spacing": "-1px",
              "text-align": "left",
              "font-size": "90%",
              "padding-left": "2px",
          })
          .each(function () {
              var matchResult = $(this).parent().attr('title').match(/energy:\s+(\d+)\s+\/\s+(\d+)\s+/);

              if (matchResult) {
                  var decayRate = matchResult[2] * 0.15;
                  var daysRemaining = Math.floor(matchResult[1] / decayRate);
                  var html = $(this).html() + '<div style="position:absolute;right:0;top:0">' + daysRemaining + 'd</div>';
                  $(this).html(html);
              }
          });
    }

    var setup = function () {
        window.addHook('portalDetailsUpdated', window.plugin.resoEnergyDaysInPortalDetail.updateMeter);
    }

    // PLUGIN END //////////////////////////////////////////////////////////


    setup.info = plugin_info; //add the script info data to the function as a property
    if (!window.bootPlugins) window.bootPlugins = [];
    window.bootPlugins.push(setup);
    // if IITC has already booted, immediately run the 'setup' function
    if (window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('(' + wrapper + ')(' + JSON.stringify(info) + ');'));
(document.body || document.head || document.documentElement).appendChild(script);
