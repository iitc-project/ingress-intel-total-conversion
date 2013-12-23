// ==UserScript==
// @id             iitc-plugin-user-location@cradle
// @name           IITC plugin: User Location
// @category       Tweaks
// @version        0.2.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Show user location marker on map
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

window.plugin.userLocation = function() {};

window.plugin.userLocation.locationLayer = new L.LayerGroup();

window.plugin.userLocation.setup = function() {
  $('<style>').prop('type', 'text/css').html('@@INCLUDESTRING:mobile/plugins/user-location.css@@').appendTo('head');

  $('<div style="position:absolute; left:-9999em; top:-9999em;">').html('@@INCLUDESTRING:mobile/plugins/user-location.svg@@').prependTo('body');

  var cssClass = PLAYER.team === 'RESISTANCE' ? 'res' : 'enl';

  var icon = L.divIcon({
    iconSize: L.point(32, 32),
    iconAnchor: L.point(16, 16),
    className: 'user-location',
    html: '<div class="container ' + cssClass + ' circle"><div class="outer"></div><div class="inner"></div></div>'
  });

  var marker = L.marker(new L.LatLng(0,0), {
    icon: icon,
    zIndexOffset: 300,
    clickable: false
  });

  var circle = new L.Circle(new L.LatLng(0,0), 40, {
    stroke: false,
    opacity: 0.7,
    fillOpacity: 1,
    fillColor: "url(#user-location-gradient)",
    weight: 1.5,
    clickable: false
  });

  marker.addTo(window.plugin.userLocation.locationLayer);
  window.plugin.userLocation.locationLayer.addTo(window.map);
  window.addLayerGroup('User location', window.plugin.userLocation.locationLayer, true);

  window.plugin.userLocation.marker = marker;
  window.plugin.userLocation.circle = circle;
  window.plugin.userLocation.icon = icon;

  window.map.on('zoomend', window.plugin.userLocation.onZoomEnd);
  window.plugin.userLocation.onZoomEnd();
};

window.plugin.userLocation.onZoomEnd = function() {
  if(window.map.getZoom() < 16)
    window.plugin.userLocation.locationLayer.removeLayer(window.plugin.userLocation.circle);
  else
    window.plugin.userLocation.locationLayer.addLayer(window.plugin.userLocation.circle);
};

window.plugin.userLocation.locate = function(lat, lng, accuracy) {
  var latlng = new L.LatLng(lat, lng);

  var latAccuracy = 180 * accuracy / 40075017;
  var lngAccuracy = latAccuracy / Math.cos(L.LatLng.DEG_TO_RAD * lat);

  var zoom = window.map.getBoundsZoom(L.latLngBounds(
    [lat - latAccuracy, lng - lngAccuracy],
    [lat + latAccuracy, lng + lngAccuracy]));

  // an extremely close view is pretty pointless (especially with maps that support zoom level 20+)
  // so limit to 17 (enough to see all portals)
  zoom = Math.min(zoom,17);

  window.map.setView(latlng, zoom);
}

window.plugin.userLocation.onLocationChange = function(lat, lng) {
  var latlng = new L.LatLng(lat, lng);
  window.plugin.userLocation.marker.setLatLng(latlng);
  window.plugin.userLocation.circle.setLatLng(latlng);
};

window.plugin.userLocation.onOrientationChange = function(direction) {
  var container = $(".container", window.plugin.userLocation.marker._icon);

  if(direction === null) {
    container
      .removeClass("arrow")
      .addClass("circle")
      .css({
        "transform": "",
        "webkitTransform": ""
      });
  } else {
    container
      .removeClass("circle")
      .addClass("arrow")
      .css({
        "transform": "rotate(" + direction + "deg)",
        "webkitTransform": "rotate(" + direction + "deg)"
      });
  }
}

var setup = window.plugin.userLocation.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
