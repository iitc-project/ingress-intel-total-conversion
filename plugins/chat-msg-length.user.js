// ==UserScript==
// @id             iitc-plugin-chat-msg-length@zaso
// @name           IITC plugin: Chat Message Length
// @category       Info
// @version        0.1.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Counts the chat message characters.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

  // use own namespace for plugin
  window.plugin.chatMsgLen = function() {};

  window.plugin.chatMsgLen.countChars = function() {
    var msgLen = $('#chattext').val().length;
    var cb = $('#chattext-count');
    if(msgLen > 256) { cb.addClass('red'); }
    else{ cb.removeClass('red'); }
    cb.text(256-msgLen);
  };

  window.plugin.chatMsgLen.setupCSS = function() {
    $("<style>").prop("type", "text/css").html(''
      +'#chatinput #chattext{width:92%;}'
      +'#chatinput #chattext-count{color:#28f428;display:inline;padding-left:1%;}'
      +'#chatinput #chattext-count.red{color:#f66;}'
    ).appendTo("head");
  };

  var setup =  function() {
    window.plugin.chatMsgLen.setupCSS();

    $('#chattext').after('<p id="chattext-count">256</p>');
    $('#chattext').bind('input propertychange', function() {
      window.plugin.chatMsgLen.countChars();
    });
    //Used 'focus' to update the counter when a player nickname is clicked
    $('#chattext').bind('focus', function() {
      window.plugin.chatMsgLen.countChars();
    });
  }

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@