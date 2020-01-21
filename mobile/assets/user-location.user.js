// ==UserScript==
// @id             iitc-plugin-user-location@cradle
// @name           IITC plugin: User Location
// @category       Tweaks
// @version        0.2.0.20181101.60209
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      none
// @downloadURL    none
// @description    [mobile-2018-11-01-060209] Show user location marker on map
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @include        https://*.ingress.com/mission/*
// @include        http://*.ingress.com/mission/*
// @match          https://*.ingress.com/mission/*
// @match          http://*.ingress.com/mission/*
// @grant          none
// ==/UserScript==


function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

//PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
//(leaving them in place might break the 'About IITC' page or break update checks)
plugin_info.buildName = 'mobile';
plugin_info.dateTimeVersion = '20181101.60209';
plugin_info.pluginId = 'user-location';
//END PLUGIN AUTHORS NOTE



// PLUGIN START ////////////////////////////////////////////////////////

window.plugin.userLocation = function() {};

window.plugin.userLocation.follow = false;

window.plugin.userLocation.setup = function() {
  $('<style>').prop('type', 'text/css').html('.user-location {\n  pointer-events: none;\n}\n\n.user-location .container {\n  height: 32px;\n  width: 32px;\n          transform-origin: center;\n  -webkit-transform-origin: center;\n}\n\n.user-location .container .inner,\n.user-location .container .outer {\n  position: absolute;\n}\n\n.user-location .res .inner {\n  background-color: #03baf4;\n  border-color: #03baf4;\n}\n\n.user-location .res .outer {\n  background-color: #0088b3;\n  border-color: #0088b3;\n}\n\n.user-location .enl .inner {\n  background-color: #1ee681;\n  border-color: #1ee681;\n}\n\n.user-location .enl .outer {\n  background-color: #00aa4e;\n  border-color: #00aa4e;\n}\n\n.user-location .circle .inner,\n.user-location .circle .outer {\n  width: 32px;\n  height: 32px;\n  border-radius: 16px;\n}\n\n.user-location .circle .inner {\n  transform: scale(0.6);\n  -webkit-transform: scale(0.6);\n}\n\n.user-location .arrow .inner,\n.user-location .arrow .outer {\n  left: 4px;\n  width: 0px;\n  height: 0px;\n  border-style: solid;\n  border-width: 0px 12px 32px;\n  border-left-color: transparent;\n  border-right-color: transparent;\n  background: transparent;\n}\n\n.user-location .arrow .inner {\n  transform: scale(0.6) translateY(15%);\n  -webkit-transform: scale(0.6) translateY(15%);\n}\n\n').appendTo('head');

  $('<div style="position:absolute; left:-9999em; top:-9999em;">').html('<svg xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg">\n	<radialGradient id="user-location-gradient">\n		<stop style="stop-color: #ffa500; stop-opacity: 0; " offset="0.875" />\n		<stop style="stop-color: #ffa500; stop-opacity: 1; " offset="1" />\n	</radialGradient>\n</svg>\n').prependTo('body');

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

  window.plugin.userLocation.locationLayer = new L.LayerGroup();

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
  if(window.map.getZoom() < 16 || L.Path.CANVAS) {
    if (window.plugin.userLocation.locationLayer.hasLayer(window.plugin.userLocation.circle))
      window.plugin.userLocation.locationLayer.removeLayer(window.plugin.userLocation.circle);
  } else {
    if (!window.plugin.userLocation.locationLayer.hasLayer(window.plugin.userLocation.circle))
      window.plugin.userLocation.locationLayer.addLayer(window.plugin.userLocation.circle);
  }
};

window.plugin.userLocation.locate = function(lat, lng, accuracy, persistentZoom) {
  if(window.plugin.userLocation.follow) {
    window.plugin.userLocation.follow = false;
    if(typeof android !== 'undefined' && android && android.setFollowMode)
      android.setFollowMode(window.plugin.userLocation.follow);
    return;
  }

  var latlng = new L.LatLng(lat, lng);

  var latAccuracy = 180 * accuracy / 40075017;
  var lngAccuracy = latAccuracy / Math.cos(L.LatLng.DEG_TO_RAD * lat);

  var zoom = window.map.getBoundsZoom(L.latLngBounds(
    [lat - latAccuracy, lng - lngAccuracy],
    [lat + latAccuracy, lng + lngAccuracy]));

  // an extremely close view is pretty pointless (especially with maps that support zoom level 20+)
  // so limit to 17 (enough to see all portals)
  zoom = (persistentZoom) ? map.getZoom() : Math.min(zoom,17);

  if(window.map.getCenter().distanceTo(latlng) < 10) {
    window.plugin.userLocation.follow = true;
    if(typeof android !== 'undefined' && android && android.setFollowMode)
      android.setFollowMode(window.plugin.userLocation.follow);
  }

  window.map.setView(latlng, zoom);
}

window.plugin.userLocation.onLocationChange = function(lat, lng) {
  if(!window.plugin.userLocation.marker) return;

  var latlng = new L.LatLng(lat, lng);
  window.plugin.userLocation.marker.setLatLng(latlng);
  window.plugin.userLocation.circle.setLatLng(latlng);

  if(window.plugin.distanceToPortal) {
    window.plugin.distanceToPortal.currentLoc = latlng;
    window.plugin.distanceToPortal.updateDistance();
  }

  if(window.plugin.userLocation.follow) {
    // move map if marker moves more than 35% from the center
    // 100% - 2*15% = 70% → 35% from center in either direction
    if(map.getBounds().pad(-0.15).contains(latlng))
      return;

    window.map.setView(latlng);
  }
};

window.plugin.userLocation.onOrientationChange = function(direction) {
  if(!window.plugin.userLocation.marker) return;

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


setup.info = plugin_info; //add the script info data to the function as a property
if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);


