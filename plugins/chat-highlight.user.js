// ==UserScript==
// @id             iitc-plugin-chat-highlight@hastarin
// @name           IITC plugin: Chat Highlight
// @category       Misc
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Highlights chat lines based on a user configurable regex
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.chatHighlight = function() {};

window.plugin.chatHighlight.KEY = 'chatHighlight';

window.plugin.chatHighlight.regExp = null;

window.plugin.chatHighlight.updateRegex = function(matchString) {
  window.plugin.chatHighlight.regExp = new RegExp(matchString, 'gi');
  localStorage[window.plugin.chatHighlight.KEY] = matchString;
}

// Highlight a chat line based on a regex
// See http://www.w3schools.com/jsref/jsref_match.asp for regex syntax
window.plugin.chatHighlight.check = function(data) {
  if($('#chatHighlight').val()) {
    var message = data.message.toString();
    data.highlight = window.plugin.chatHighlight.regExp.test(message);
  }
}

window.plugin.chatHighlight.setup = function() {
  var content = '<input id="chatHighlight" placeholder="Type regex to highlight" type="text">';
  $('#sidebar').append(content);
  $('#chatHighlight').keypress(function(e) {
    if((e.keyCode ? e.keyCode : e.which) !== 13) return;
    var data = $(this).val();
    window.plugin.chatHighlight.updateRegex(data);
  });
  if(localStorage[window.plugin.chatHighlight.KEY]) {
    $('#chatHighlight').val(localStorage[window.plugin.chatHighlight.KEY]);
    window.plugin.chatHighlight.regExp = new RegExp(localStorage[window.plugin.chatHighlight.KEY], 'gi');
  }
  window.addHook('chatPreRender', window.plugin.chatHighlight.check);
}

var setup =  window.plugin.chatHighlight.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
