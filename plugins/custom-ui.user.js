// ==UserScript==
// @id             iitc-plugin-custom-ui@insane210
// @name           IITC plugin: Custom UI
// @category       Misc
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Hide user interface elements
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.customUI = function() {};
    
window.plugin.customUI.ScreenshotMode = false;

window.plugin.customUI.loadSettings = function () {
	if (localStorage.getItem('customUI') == null) {
		var options = {
			// id: [enabled, 'name'],
			chatcontrols: [true, 'Chattabs'],
			chat: [true, 'Chat'],
			chatinput: [true, 'Chatinput'],
			sidebar: [true, 'Sidebar'],
			updatestatus: [true, 'Statusbar'],
			bookmarks: [true, 'Bookmarks'],
			portal_highlight_select: [true, 'Portal highlighter'],
			drawtools: [true, 'Drawtools'],
			mouse: [true, 'Mouse pointer'],
		};
		
		localStorage.setItem('customUI', options);
	};
	
	window.plugin.customUI.options = localStorage.getItem('customUI');
}

window.plugin.customUI.toggleScreenshotMode = function () {
  if (window.plugin.customUI.ScreenshotMode) {
		$('#chatcontrols').toggle();
		$('#chat').toggle();
		$('#chatinput').toggle();
		$('#sidebartoggle').toggle();
		$('#scrollwrapper').toggle();
		$('#updatestatus').toggle();
		$('#bkmrksTrigger').toggle();
		$('#bookmarksBox').toggle();
		$('#portal_highlight_select').toggle();
		$('.leaflet-control-container').toggle();
		
		$('*').css({'cursor': ''});
		
		window.plugin.customUI.ScreenshotMode = false;
  } else {
		$('#chatcontrols').toggle();
		$('#chat').toggle();
		$('#chatinput').toggle();
		$('#sidebartoggle').toggle();
		$('#scrollwrapper').toggle();
		$('#updatestatus').toggle();
		$('#bkmrksTrigger').toggle();
		$('#bookmarksBox').toggle();
		$('#portal_highlight_select').toggle();
		$('.leaflet-control-container').toggle();
		
		$('*').css({'cursor': 'none'});
		
		window.plugin.customUI.ScreenshotMode = true;
  }
}

window.plugin.customUI.showOptions = function() {

  var html = '<label for="customUI-chatcontrols"><input type="checkbox" id="customUI-chatcontrols"> Chatcontrols</label>'
		   + '<label for="customUI-chat"><input type="checkbox" id="customUI-chat"> Chat</label>'
		   + '<label for="customUI-chatinput"><input type="checkbox" id="customUI-chatinput"> Chatinput</label>'
		   + '<label for="customUI-sidebar"><input type="checkbox" id="customUI-sidebar"> Sidebar</label>';
           // + '<a onclick="window.plugin.drawTools.optCopy();" tabindex="0">Copy Drawn Items</a>'
           // + '<a onclick="window.plugin.drawTools.optPaste();return false;" tabindex="0">Paste Drawn Items</a>'
           // + (window.requestFile != undefined
             // ? '<a onclick="window.plugin.drawTools.optImport();return false;" tabindex="0">Import Drawn Items</a>' : '')
           // + ((typeof android !== 'undefined' && android && android.saveFile)
             // ? '<a onclick="window.plugin.drawTools.optExport();return false;" tabindex="0">Export Drawn Items</a>' : '')
           // + '<a onclick="window.plugin.drawTools.optReset();return false;" tabindex="0">Reset Drawn Items</a>'
           // + '<a onclick="window.plugin.drawTools.snapToPortals();return false;" tabindex="0">Snap to portals</a>';

  dialog({
    html: html,
    id: 'plugin-customUI-options',
    dialogClass: 'ui-dialog',
    title: 'Custom UI Options'
  });
}

var setup =  function() {
  $('head').append('<style>' +
    '#dialog-plugin-customUI-options label { display: block; }' +
    '#dialog-plugin-customUI-options input { vertical-align: middle; }' +
    '</style>');
	
  window.plugin.customUI.loadSettings();
	
  document.addEventListener('keydown', function(e) {
    // pressed alt+h
    if (e.keyCode == 72 && !e.shiftKey && !e.ctrlKey && e.altKey && !e.metaKey) {
      window.plugin.customUI.toggleScreenshotMode();
    }
  }, false);
  $('#toolbox').append(' <a onclick="window.plugin.customUI.showOptions()" title="Show custom UI settings">Custom UI Opt</a>');
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
