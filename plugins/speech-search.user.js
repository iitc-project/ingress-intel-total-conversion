// ==UserScript==
// @id             iitc-plugin-speech-search
// @name           IITC Plugin: Speech Search
// @version        0.0.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Allow speech input for location search (webkit only for now - NOT Firefox)
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// ==/UserScript==

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if (typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.speechSearch = function() {};

window.plugin.speechSearch.setup = function() {
    // Give the search input the speech attribute
    $("#geosearch").attr("x-webkit-speech", "");
    // Immediately search without further input
    $("#geosearch").bind("webkitspeechchange", function() {
        $("#geosearch").trigger($.Event("keypress", {keyCode: 13}));
    });
};

var setup = window.plugin.speechSearch.setup;

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
