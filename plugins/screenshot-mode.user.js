// ==UserScript==
// @id             iitc-plugin-screenshot-mode@insane210
// @name           IITC plugin: Screenshot mode
// @category       Misc
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Hide user interface
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.screenshotMode = function() {};

window.plugin.screenshotMode.hideUI = function () {
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
}

var setup =  function() {
  document.addEventListener('keydown', function(e) {
    // pressed alt+h
    if (e.keyCode == 72 && !e.shiftKey && !e.ctrlKey && e.altKey && !e.metaKey) {
      window.plugin.screenshotMode.hideUI();
    }
  }, false);
  $('#toolbox').append(' <a onclick="window.plugin.screenshotMode.hideUI()" title="Hide UI">Hide UI</a>');
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
