// ==UserScript==
// @id             iitc-plugin-draw-resonators@xelio
// @name           IITC plugin: Draw resonators
// @category  Deleted
// @version        0.4.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Draw resonators on map for currently selected portal.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////
window.RESONATOR_MIN_ZOOM = 16;

// use own namespace for plugin
window.plugin.drawResonators = function() {};

window.plugin.drawResonators.levelLayerGroup = null;

window.plugin.drawResonators.handledata = function(data) {
window.plugin.drawResonators.levelLayerGroup.clearLayers();
window.plugin.drawResonators.drawData(data);
}

window.plugin.drawResonators.drawData = function(portal) {
if(window.map.getZoom() < window.RESONATOR_MIN_ZOOM) return;
  var portalDetails = portal.portalDetails;
  var portalLatLng = [portalDetails.locationE6.latE6/1E6, portalDetails.locationE6.lngE6/1E6];
  for(var i in portalDetails.resonatorArray.resonators) {
    resoData = portalDetails.resonatorArray.resonators[i];
    if(resoData === null) continue;

    var resoLatLng = window.plugin.drawResonators.getResonatorLatLng(resoData.distanceToPortal, resoData.slot, portalLatLng);

    var resoMarker = window.plugin.drawResonators.createResoMarker(resoData, resoLatLng);
    var connMarker = window.plugin.drawResonators.createConnMarker(resoData, resoLatLng, portalLatLng);

    window.plugin.drawResonators.levelLayerGroup.addLayer(resoMarker);
    window.plugin.drawResonators.levelLayerGroup.addLayer(connMarker);
  }
}

window.plugin.drawResonators.getResonatorLatLng = function(dist, slot, portalLatLng) {
  // offset in meters
  var dn = dist*SLOT_TO_LAT[slot];
  var de = dist*SLOT_TO_LNG[slot];

  // Coordinate offset in radians
  var dLat = dn/EARTH_RADIUS;
  var dLon = de/(EARTH_RADIUS*Math.cos(Math.PI/180*portalLatLng[0]));

  // OffsetPosition, decimal degrees
  var lat0 = portalLatLng[0] + dLat * 180/Math.PI;
  var lon0 = portalLatLng[1] + dLon * 180/Math.PI;

  return [lat0, lon0];
}

window.plugin.drawResonators.createResoMarker = function(resoData, resoLatLng) {
  var resoProperty = {
  fillColor: COLORS_LVL[resoData.level],
  fillOpacity: resoData.energyTotal/RESO_NRG[resoData.level],
  color: '#aaa',
  weight: 1,
  radius: 3,
  opacity: 1,
  clickable: false};
  resoProperty.type = 'resonator';
  resoProperty.details = resoData;
  var reso = L.circleMarker(resoLatLng, resoProperty);
  return reso;
}

window.plugin.drawResonators.createConnMarker = function(resoData, resoLatLng, portalLatLng) {
  var connProperty = {
  opacity: 0.25,
  weight: 2,
  color: '#FFA000',
  dashArray: '0,10' + (new Array(25).join(',8,4')),
  fill: false,
  clickable: false};
  connProperty.type = 'connector';
  connProperty.details = resoData;
  var conn = L.polyline([portalLatLng, resoLatLng], connProperty);
  return conn;
}

window.plugin.drawResonators.zoomListener = function() {
  if(window.map.getZoom() < window.RESONATOR_MIN_ZOOM) {
    window.plugin.drawResonators.levelLayerGroup.clearLayers();
  };
}

var setup = function() {

  window.plugin.drawResonators.levelLayerGroup = new L.LayerGroup();

  window.addLayerGroup('Draw Reso', window.plugin.drawResonators.levelLayerGroup, true);

  window.addHook('portalDetailsUpdated', window.plugin.drawResonators.handledata);
  
  window.map.on('zoomend', function() {
    window.plugin.drawResonators.zoomListener();
  });

}
// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@