// ==UserScript==
// @id             iitc-plugin-myscript@hayeswise
// @name           IITC plugin: Easy Button Demo
// @category       Misc
// @version        1.20170210.74048.0
// @namespace      https://github.com/hayeswise/ingress-intel-total-conversion
// @description    Easy Button Demo. Uses PLUGINSTART-USE-STRICT.
// @updateURL      none
// @downloadURL    none
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @require        https://unpkg.com/leaflet-easybutton@2.0.0/src/easy-button.js
// @resource       icons https://fonts.googleapis.com/icon?family=Material+Icons
// @author         Hayeswise
// @grant          none
// ==/UserScript==
// MIT License, Copyright (c) 2017 Brian Hayes ("Hayeswise")
// For more information, visit https://github.com/hayeswise/ingress-intel-total-conversion
/**
 * Greasemonkey/Tampermonkey information about the plugin.
 * @typedef ScriptInfo
 * @type {Object}
 * @property {String} version This is set to GM_info.script.version.
 * @property {String} name This is set to GM_info.script.name.
 * @property {String} description This is set to GM_info.script.description.
 */
/**
 * Plugin information which includes the Greasemonkey/Tampermonkey information about the plugin.
 * @typedef PluginInfo
 * @type {Object}
 * @property {ScriptInfo} script Greasemonkey/Tampermonkey information about the plugin.
 */
/**
 * Wrapper function for Easy Button Demo.
 * <p>
 * Standard IITC wrapper pattern used to create the plugin's closure when
 * installed using `document.createElement("script".appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));`
 * @param {PluginInfo} plugin_info Plugin information object provided the standard IITC PLUGINEND code.
 */
/**
 * Easy Button Demo IITC plugin.  The plugin and its members can be accessed via
 * `window.plugin.easyButtonDemo`.
 * @module {function} "window.plugin.easyButtonDemo"
*/
/**
 * Wrapper function for Easy Button Demo.
 * <p>
 * Standard IITC wrpattern used to create the plugin's wrapper function that is used to install the plugin
 * into the page via `document.createElement("script".appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));`
 * @param {PluginInfo} plugin_info Plugin information object provided the standard IITC PLUGINEND code.
 */

function wrapper(plugin_info) {
"use strict";
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

//PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
//(leaving them in place might break the 'About IITC' page or break update checks)
plugin_info.buildName = 'local';
plugin_info.dateTimeVersion = '20170210.74048';
plugin_info.pluginId = 'easy-button-demo';
//END PLUGIN AUTHORS NOTE


   // PLUGIN START ////////////////////////////////////////////////////////

    /**
	 * Easy Button Demo IITC plugin.  The plugin and its members can be accessed via `window.plugin.easyButtonDemo`.
	 * @see {@link wrapper}
	 * @module {function} easyButtonDemo
	 */
    window.plugin.easyButtonDemo = function () {};

	/**
	 * Easy Demo Button namespace. `self` is set to `window.plugin.easyButtonDemo`.
     * @alias "window.plugin.easyButtonDemo"
     * @variation 2
	 */
    var self = window.plugin.easyButtonDemo;
    self.spacename = "easyButtonDemo";

    /**
     * Setup function.  Called if IITC is already loaded and if not, it is pushed for later execution.
     */
    self.setup = function () {
        var fname = self.spacename + ".setup";
		console.log(fname + ": Start.");

        $("head").append('<link rel="stylesheet" href="https://unpkg.com/leaflet-easybutton@2.0.0/src/easy-button.css">');

        var helloPopup = L.popup().setContent('<p>Easy Button Demo!</p>' +
            '<p>See <a style="color:#03fe03;" href="https://github.com/CliffCloud/Leaflet.EasyButton" target="_blank">Leaflet.EasyButton</a>' +
            ' on <a style="color:#03fe03; "href="https://github.com/" target="_blank">GitHub</a></p>');

        L.easyButton('<i class="material-icons" style="font-size:18px;position:relative;top:3px;right:2px">sentiment_very_satisfied</i>', function(btn, map){
            helloPopup.setLatLng(map.getCenter()).openOn(map);
        }).addTo(window.map);

        console.log(fname + ": Done.");
        // delete setup to ensure init can't be run again
        delete self.setup;
    };

    var setup = self.setup;
    // PLUGIN END ////////////////////////////////////////////////////////

setup.info = plugin_info; //add the script info data to the function as a property
if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);

