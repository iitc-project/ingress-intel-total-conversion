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
window.plugin.chatHooksTest = function() {};



window.plugin.chatHooksTest.resonator = function(data) {
  portal = data.portals[0];
  //console.log("resonator event @ " + portal.latE6/1E6 + "," + portal.lngE6/1E6);
  lat = portal.latE6/1E6;
  lng = portal.lngE6/1E6;
  plugin.chatHooksTest.addCircle(lat, lng);
};

window.plugin.chatHooksTest.linked_portal = function(data) {
  portal = data.portals[0];
  str = data.time + ": from " + portal.name + " to " + data.portals[1].name;
  str += " linked by " + data.nick;
  //console.log(str);
  //L.circle(L.latLng(portal.latE6/1E6, portal.lngE6/1E6), 40, fill=true).addTo(plugin.chatHooksTest.layer)
  lat = portal.latE6/1E6;
  lng = portal.lngE6/1E6;
  plugin.chatHooksTest.addCircle(lat, lng);
};

window.plugin.chatHooksTest.addCircle = function(lat, lng) {
  console.log("Adding circle at " + lat + ", " + lng);
  L.circle(L.latLng(lat, lng), 40, fill=true).addTo(plugin.chatHooksTest.layer);
};

var setup =  function() {
  if (!window.plugin.chatHooks) {

  }
  window.plugin.chatHooksTest.layer = new L.LayerGroup();
  window.addLayerGroup('chathookstest', window.plugin.chatHooksTest.layer, true);

  window.plugin.chatHooks.addChatHook('CH_PORTAL_LINKED', window.plugin.chatHooksTest.linked_portal);
  window.plugin.chatHooks.addChatHook('CH_RESO_DEPLOYED', window.plugin.chatHooksTest.resonator);
  window.plugin.chatHooks.addChatHook('CH_RESO_DESTROYED', window.plugin.chatHooksTest.resonator);
  //addHook('factionChatDataAvailable', window.plugin.chatHooks.handleFactionData);
};

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
