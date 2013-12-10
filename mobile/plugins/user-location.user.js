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
    color: 'orange',
    opacity: 0.7,
    fillOpacity: 0,
    weight: 1.5,
    clickable: false
  });

  marker.addTo(window.map);
  circle.addTo(window.map);
  var container = $(".container", marker._icon);

  window.plugin.userLocation.marker = marker;
  window.plugin.userLocation.circle = circle;
  window.plugin.userLocation.icon = icon;
  window.plugin.userLocation.container = container;

  if('ondeviceorientation' in window)
    window.addEventListener('deviceorientation', window.plugin.userLocation.onDeviceOrientation, false);
};

window.plugin.userLocation.onDeviceOrientation = function(e) {
  var direction, delta, heading;

  if (typeof e.webkitCompassHeading !== 'undefined') {
    direction = e.webkitCompassHeading;
    if (typeof window.orientation !== 'undefined') {
      direction += window.orientation;
    }
  }
  else {
    // http://dev.w3.org/geo/api/spec-source-orientation.html#deviceorientation
    direction = 360 - e.alpha;
  }

  var container = window.plugin.userLocation.container;
  container
    .removeClass("circle")
    .addClass("arrow")
    .css({
      "transform": "rotate(" + direction + "deg)",
      "webkitTransform": "rotate(" + direction + "deg)"
    });
}

window.plugin.userLocation.updateLocation = function(lat, lng) {
  var latlng = new L.LatLng(lat, lng);
  window.plugin.userLocation.marker.setLatLng(latlng);
  window.plugin.userLocation.circle.setLatLng(latlng);
};

var setup = window.plugin.userLocation.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
