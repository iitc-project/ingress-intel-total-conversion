// ==UserScript==
// @id             iitc-plugin-comm-blacklist@marstone
// @name           IITC plugin: blacklist
// @version        0.1
// @namespace      https://github.com/marstone/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] set a blacklist & replace chat text shown in COMM public/faction channels.
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

window.plugin.commBlacklist.setupCallback = function() {
	$('#toolbox').append('<a onclick="window.plugin.commBlacklist.config()" title="setup blacklist.">Setup Blacklist</a>');
	addHook('factionChatDataAvailable', window.plugin.commBlacklist.blackItCallback);
	addHook('publicChatDataAvailable', window.plugin.commBlacklist.blackItCallback);
	$('#chatcontrols a').click(window.plugin.commBlacklist.blackItCallback);
};

window.plugin.commBlacklist.blackItCallback = function() {
	// should hook the "AFTER" event.
	setTimeout(window.plugin.commBlacklist.blackIt, 20);
	// for slower computer?
	// setTimeout(window.plugin.commBlacklist.blackIt, 500);
};

window.plugin.commBlacklist.blackIt = function() {
	// alert('blackIt');
	var data = window.plugin.commBlacklist.fetchBlacklist();
	console.log("blacklist:" + JSON.stringify(data.list));
	var list = data.list.toLowerCase().replace(/\s+/g, '').split(",");
	var replace = data.text;

	var blackEach = function(el) {
		var id = $(el).text().toLowerCase();
		if($.inArray(id, list) > -1) {
			// $(el).text("hacked/634");
			var td = $(el).closest('td').next();
			var text = td.data('blacked');
			if(null == text) {
				text = td.text();
				td.data('blacked', text);
			}
			td.attr('title', text);
			td.html('<span style="cursor:pointer;color:red;">' + replace + '</span>');
		}
	};

	$('#chatfaction .nickname').each(function(index, el) { blackEach(el); });
	$('#chatpublic .nickname').each(function(index, el) { blackEach(el); });
};

// public interface
window.plugin.commBlacklist.fetchBlacklist = function() {
	var list = window.localStorage['comm-blacklist'];
	var defaultData = { list:'', text: '*** censored ***' };
	try {
		return null == list ? defaultData : JSON.parse(list);
	} catch(e) {
		return defaultData;
	}
};

window.plugin.commBlacklist.config = function() {
        var data = window.plugin.commBlacklist.fetchBlacklist();
	console.log("blacklist read: " + JSON.stringify(data));

	var div = $('<div>');
	var names = $('<input placeholder="Example: wanx,fire,marstone" value="' + data.list + '" style="width:280px" />');
	var replace = $('<input placeholder="Example: *** censored *** " value="' + data.text + '" style="width:280px" />');
	div.append("BlackList Ids:\n").append(names).append("\n\nReplace Text:\n").append(replace);
	
	var s = div.html();
	// console.log(s);
	
	alert(
		s, true,
		function() {
			var list = $(".ui-dialog-content").find("input")[0].value;
			var text = $(".ui-dialog-content").find("input")[1].value;
			var d = { list:list, text:text };
			console.log("blacklist saved:" + JSON.stringify(d));
			window.localStorage['comm-blacklist'] = JSON.stringify(d);
		}
	);
};

var setup = function() {
	window.plugin.commBlacklist.setupCallback();
	window.plugin.commBlacklist.blackIt();
};

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
