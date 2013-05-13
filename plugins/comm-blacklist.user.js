// ==UserScript==
// @id             iitc-plugin-blacklist@marstone
// @name           IITC plugin: blacklist
// @version        0.1
// @namespace      https://github.com/marstone/sandbox
// @updateURL      
// @downloadURL    
// @description    
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
window.plugin.commBlacklist = function() {};

window.plugin.commBlacklist.setCallback = function() {
	$('#toolbox').append(' <a onclick="window.plugin.commBlacklist.config()" title="setup blacklist.">Setup Blacklist</a>');
	addHook('factionChatDataAvailable', window.plugin.commBlacklist.blackIt);
}


window.plugin.commBlacklist.blackIt = function() {
	$('#chatfaction').find('nickname').text('hacked/634');
};

var setup = function() {
	window.plugin.commBlacklist.setupCallback();
	window.plugin.commBlacklist.blackIt();
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
