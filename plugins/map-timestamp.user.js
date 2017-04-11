// ==UserScript==
// @id             iitc-plugin-map-timestamp
// @name           IITC plugin: Add timestamp for map (for screnshots)
// @category       Info
// @version        0.0.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Show the times used for the septicycle and checkpoints for regional scoreboards.
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
window.plugin.mapTimestamp = function() {};

window.plugin.mapTimestamp.setup  = function() {

  // add a div in front of the update status line
  $('#updatestatus').prepend('<div id="timestamp" style="padding: 8px;"></div>');

  window.plugin.mapTimestamp.update();
};

window.plugin.mapTimestamp.update = function() {

  var text = 'Time: ' + new Date();

  $('#timestamp').text(text);

  setTimeout (window.plugin.mapTimestamp.update, 60*1000);
};

var setup =  window.plugin.mapTimestamp.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
