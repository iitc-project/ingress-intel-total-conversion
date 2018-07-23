// ==UserScript==
// @id             iitc-plugin-speech-search
// @name           IITC Plugin: Speech Search
// @version        0.0.1.@@DATETIMEVERSION@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Allow speech input for location search (webkit only for now - NOT Firefox).
@@METAINFO@@
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.speechSearch = function() {};

window.plugin.speechSearch.setup = function() {
    // Give the search input the speech attribute
    $("#search").attr("x-webkit-speech", "");
    // Immediately search without further input
    $("#search").bind("webkitspeechchange", function() {
        $("#search").trigger($.Event("keypress", {keyCode: 13}));
    });
};

var setup = window.plugin.speechSearch.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
