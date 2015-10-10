// ==UserScript==
// @id             iitc-plugin-chat-hook-test
// @name           IITC plugin: chat hook test
// @category       Info
// @version        0.0.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/mnoeljones/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Tests for chat hooks
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
window.plugin.chatHookTests = function() {};

window.plugin.chatHookTests.linked_portal = function(data) {
  console.log(data.time + ": ");
  for (var portal in data.portals) {
    console.log("Portal " + portal.name);
  }
  console.log(" linked by " + data.nick);
}

var setup =  function() {
  if (!window.plugin.chatHooks) {
    
  }
  window.plugin.chatHooks.addChatHook('CH_PORTAL_LINKED', window.plugin.chatHookTests.linked_portal);
  //addHook('factionChatDataAvailable', window.plugin.chatHooks.handleFactionData);
};

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
