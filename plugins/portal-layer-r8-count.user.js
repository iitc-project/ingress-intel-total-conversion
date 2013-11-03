// ==UserScript==
// @id             iitc-plugin-portal-layer-r8-count@amsdams
// @name           IITC plugin: Portal Layer R8 Count
// @category       Layer
// @version        0.0.1.20131026.164441
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL https://raw.github.com/amsdams/iitc-plugins/master/portal-layer-r8-count.user.js
// @downloadURL https://raw.github.com/amsdams/iitc-plugins/master/portal-layer-r8-count.user.js
// @description    [local-2013-10-26-164441] Show portal level 8 resonator count on map.
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
window.plugin.portalLayerR8Count = function () {};
window.plugin.portalLayerR8Count.levelLayers = {};
window.plugin.portalLayerR8Count.levelLayerGroup = null;
// Use portal add and remove event to control render of portal level numbers
window.plugin.portalLayerR8Count.portalAdded = function (data) {
  data.portal.on('add', function () {
    plugin.portalLayerR8Count.renderLevel(this.options.guid, this.getLatLng());
  });
  data.portal.on('remove', function () {
    plugin.portalLayerR8Count.removeLevel(this.options.guid);
  });
}
window.plugin.portalLayerR8Count.getR8Count = function (d) {
  var count = 0;
  $.each(d.resonatorArray.resonators, function (ind, reso) {
    if(reso && reso.level == window.MAX_PORTAL_LEVEL) {
      count++;
    }
  });
  return count;
}
window.plugin.portalLayerR8Count.renderLevel = function (guid, latLng) {
  plugin.portalLayerR8Count.removeLevel(guid);
  var portal = window.portals[guid];
  // var d = window.portals[guid].options.details;
  var levelNumber = Math.floor(window.plugin.portalLayerR8Count.getR8Count(portal.options.details));
  portal.setStyle({
    fillColor: window.COLORS_LVL[levelNumber],
    fillOpacity: 0.7
  });
  var level = L.marker(latLng, {
    icon: L.divIcon({
      className: 'plugin-portal-r8-count',
      iconAnchor: [6, 7],
      iconSize: [12, 10],
      html: "<div class='defense-label'>" + levelNumber + "xR8</div>"
    }),
    guid: guid
  });
  plugin.portalLayerR8Count.levelLayers[guid] = level;
  level.addTo(plugin.portalLayerR8Count.levelLayerGroup);
}
window.plugin.portalLayerR8Count.removeLevel = function (guid) {
  var previousLayer = plugin.portalLayerR8Count.levelLayers[guid];
  if(previousLayer) {
    plugin.portalLayerR8Count.levelLayerGroup.removeLayer(previousLayer);
    delete plugin.portalLayerR8Count.levelLayers[guid];
  }
}
var setup = function () {
  $("<style>")
    .prop("type", "text/css")
    .html(".plugin-portal-r8-count {\
         font-size: 10px;\
         color: #FFFFBB;\
         font-family: monospace;\
         text-align: center;\
         text-shadow: 0 0 0.5em black, 0 0 0.5em black, 0 0 0.5em black;\
         pointer-events: none;\
         -webkit-text-size-adjust:none;\
        }\
        .defense-label {\
         position:relative;\
         background-color:#1B3E59;\
         opacity:.6;\
         border:0.5px solid #FFCE00;\
         width:28px;\
         text-align:center;\
         color:#FFFFFF;\
         text-align:center;\
         border-radius:6px;\
         left: -27px;\
         top: -2px;\
        }")
    .appendTo("head");
  window.plugin.portalLayerR8Count.levelLayerGroup = new L.LayerGroup();
  window.addLayerGroup('Portal R8 Count', window.plugin.portalLayerR8Count.levelLayerGroup, true);
  window.addHook('portalAdded', window.plugin.portalLayerR8Count.portalAdded);
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

