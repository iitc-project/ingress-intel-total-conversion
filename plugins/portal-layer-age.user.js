// ==UserScript==
// @id             iitc-plugin-portal-layer-age@amsdams
// @name           IITC plugin: Portal Layer Age
// @category       Layer
// @version        0.0.1.20131026.164441
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL https://raw.github.com/amsdams/iitc-plugins/master/portal-layer-age.user.js
// @downloadURL https://raw.github.com/amsdams/iitc-plugins/master/portal-layer-age.user.js
// @description    [local-2013-10-26-164441] Show portal age in days.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////
// use own namespace for plugin
window.plugin.portalLayerAge = function () {};
window.plugin.portalLayerAge.levelLayers = {};
window.plugin.portalLayerAge.levelLayerGroup = null;
// Use portal add and remove event to control render of portal level numbers
window.plugin.portalLayerAge.portalAdded = function (data) {
  data.portal.on('add', function () {
    plugin.portalLayerAge.renderLevel(this.options.guid, this.getLatLng());
  });
  data.portal.on('remove', function () {
    plugin.portalLayerAge.removeLevel(this.options.guid);
  });
}
window.plugin.portalLayerAge.getR8Count = function (d) {
  var count = 0;
  $.each(d.resonatorArray.resonators, function (ind, reso) {
    if(!reso || reso.level == window.MAX_PORTAL_LEVEL) {
      count++;
    }
  });
  return count;
}
// length can be "s" or "l" for "short" or "long"
window.plugin.portalLayerAge.secondsToString = function (seconds, length) {
  var numdays = Math.floor(seconds / 86400);
  var numhours = Math.floor((seconds % 86400) / 3600);
  var numminutes = Math.floor(((seconds % 86400) % 3600) / 60);
  var numseconds = ((seconds % 86400) % 3600) % 60;
  if(length === "l") {
    return numdays + " days " + numhours + " hours " + numminutes + " minutes " + numseconds + " seconds";
  } else {
    return numdays + "d" + numhours + "h";
  }
}
window.plugin.portalLayerAge.renderLevel = function (guid, latLng) {
  plugin.portalLayerAge.removeLevel(guid);
  var portal = window.portals[guid];
  var now = new Date();
  var now_ms = now.getTime(); // + (now.getTimezoneOffset() * 60000);
  var age_in_seconds = 0;
  var age_string_long = 'This portal is not captured.';
  var age_string_short = 'n/a';
  if(portal.options.details.hasOwnProperty('captured') && portal.options.details.captured.hasOwnProperty('capturedTime')) {
    var age_in_seconds = Math
      .floor((now_ms - portal.options.details.captured.capturedTime) / 1000);
    var age_string_long = window.plugin.portalLayerAge.secondsToString(
      age_in_seconds, 'l');
    var age_string_short = window.plugin.portalLayerAge.secondsToString(
      age_in_seconds, 's');
  }
  var level = L.marker(latLng, {
    icon: L.divIcon({
      className: 'plugin-portal-age',
      iconAnchor: [6, 7],
      iconSize: [12, 10],
      html: "<div class='age-label'>" + age_string_short + "</div>"
    }),
    guid: guid
  });
  plugin.portalLayerAge.levelLayers[guid] = level;
  level.addTo(plugin.portalLayerAge.levelLayerGroup);
}
window.plugin.portalLayerAge.removeLevel = function (guid) {
  var previousLayer = plugin.portalLayerAge.levelLayers[guid];
  if(previousLayer) {
    plugin.portalLayerAge.levelLayerGroup.removeLayer(previousLayer);
    delete plugin.portalLayerAge.levelLayers[guid];
  }
}
var setup = function () {
  $("<style>")
    .prop("type", "text/css")
    .html(
      ".plugin-portal-age {\
       font-size: 10px;\
       color: #FFFFBB;\
       font-family: monospace;\
       text-align: center;\
       text-shadow: 0 0 0.5em black, 0 0 0.5em black, 0 0 0.5em black;\
       pointer-events: none;\
       -webkit-text-size-adjust:none;\
      }\
      .age-label {\
       position:relative;\
       background-color:#1B3E59;\
       opacity:.6;\
       border:0.5px solid #FFCE00;\
       width:40px;\
       text-align:center;\
       color:#FFFFFF;\
       text-align:center;\
       border-radius:6px;\
       left: -17px;\
       top: -20px;\
      }")
    .appendTo("head");
  window.plugin.portalLayerAge.levelLayerGroup = new L.LayerGroup();
  window.addLayerGroup('Portal Age', window.plugin.portalLayerAge.levelLayerGroup,
    true);
  window.addHook('portalAdded', window.plugin.portalLayerAge.portalAdded);
}
// PLUGIN END //////////////////////////////////////////////////////////

if(window.iitcLoaded && typeof setup === 'function') {
  setup();
} else {
  if(window.bootPlugins)
    window.bootPlugins.push(setup);
  else
    window.bootPlugins = [setup];
}
} // wrapper end
// inject code into site context
var script = document.createElement('script');
script.appendChild(document.createTextNode('('+ wrapper +')();'));
(document.body || document.head || document.documentElement).appendChild(script);

