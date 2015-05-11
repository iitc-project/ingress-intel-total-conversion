// ==UserScript==
// @id             iitc-plugin-speech-search
// @name           IITC Plugin: Speech Search
// @version        0.0.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Allow speech input for location search (webkit only for now - NOT Firefox).
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
