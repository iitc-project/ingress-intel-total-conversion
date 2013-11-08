// ==UserScript==
// @id          noob-mention@numinit
// @name        IITC plugin: Noob Mention
// @version     0.1.@@DATETIMEVERSION@@
// @namespace   https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL   @@UPDATEURL@@
// @downloadURL @@DOWNLOADURL@@
// @description [@@BUILDNAME@@-@@BUILDDATE@@] Quickly mention noobs in chat.
// @include     https://www.ingress.com/intel*
// @include     http://www.ingress.com/intel*
// @match       https://www.ingress.com/intel*
// @match       http://www.ingress.com/intel*
// ==/UserScript==

@@PLUGINSTART@@

window.plugin.noob_mention = function() {
  $('#chattext').val($.makeArray($.unique($('td:contains("has joined the Resistance"), td:contains("has joined the Enlightened"), td:contains("has completed training"), td:contains("captured their first Portal")').map(function(i, a){return '@'+ $(a).parent().find('mark').html();}))).join(' '));
};

var setup = function() {
  $('toolbox').append('<a href="javascript:window.plugin.noob_mention();">Mention Noobs</a>');
};

@@PLUGINEND@@
