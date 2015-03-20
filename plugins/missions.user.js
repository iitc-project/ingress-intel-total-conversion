// ==UserScript==
// @id             iitc-plugin-missions@jonatkins
// @name           IITC plugin: Missions
// @category       Info
// @version        0.0.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] WORK IN PROGRESS: view missions. Currently, only adds a mission start portal highlighter
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.missions = function() {};


window.plugin.missions.highlight = function(data) {
  var opacity = 0.7;
  var color = undefined;

  if (data.portal.options.data.mission50plus) {
    color='red';
  } else if (data.portal.options.data.mission) {
    color='darkorange';
  }

  if (color) {
    data.portal.setStyle({fillColor: color, fillOpacity: opacity});
  }
}

window.plugin.missions.setup  = function() {

  window.addPortalHighlighter('Mission start point', window.plugin.missions.highlight);

};

var setup =  window.plugin.missions.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
