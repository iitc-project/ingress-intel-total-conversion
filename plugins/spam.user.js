// ==UserScript==
// @id          spam@numinit
// @name        IITC plugin: Report the spammers!
// @version     0.1@@DATETIMEVERSION@@
// @namespace   https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL   @@UPDATEURL@@
// @downloadURL @@DOWNLOADURL@@
// @description [@@BUILDNAME@@-@@BUILDDATE@@] Easy spammer reporting on the Intel Map.
// @include     https://www.ingress.com/intel*
// @include     http://www.ingress.com/intel*
// @match       https://www.ingress.com/intel*
// @match       http://www.ingress.com/intel*
// @grant       none
// ==/UserScript==

@@PLUGINSTART@@

window.plugin.spam = function() {};

// Go away, spammers.
window.plugin.spam.REGEXES = [/SELL:/ig];
window.plugin.spam.SUPPORT_URL = 'https://support.google.com/ingress/?hl=en#ts=2848681,2869441&topic=3261404&contact=1';

// Hook into the chat renderer
window.plugin.spam.renderData = window.chat.renderData;
window.plugin.spam.onRenderData = function(data, element, old) {
  var ret = window.plugin.spam.renderData(data, element, old);
  var elements = $("#" + element + ' table > tbody > tr:not(:has(summary))');
  elements.each(function(element_idx, element) {
    var children = $(element).children();
    if (children.length != 3) {
      return true;
    }
    var nick = $(children[1]).text();
    var msg  = children.last().text();
    var time = children.find('time');
    $.each(window.plugin.spam.REGEXES, function(regex_idx, regex) {
      var match = msg.match(regex);
      if (match) {
        nick = $.trim(nick).replace(/(^\<|\>$)/g, '');
        time.parent().append('<div class="pl_nudge_date"></div><div class="pl_nudge_pointy_spacer"></div>');
        time.appendTo(time.next());
        time.attr('title', 'Report spam!');
        time.parent().click(function(event) {
          window.open(window.plugin.spam.SUPPORT_URL);
        });
        return false;
      }
    });
  });
  return ret;
};

// Export the new chat renderer
window.chat.renderData = window.plugin.spam.onRenderData;

@@PLUGINEND@@
