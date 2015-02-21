// ==UserScript==
// @id             iitc-plugin-distance-to-portal@jonatkins
// @name           IITC plugin: Distance to portal
// @category       Info
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Allows your current location to be set manually, then shows the distance to the selected portal. Useful when managing portal keys.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.distanceToPortal = function() {};

window.plugin.distanceToPortal.addDistance = function(info) {

  var ll = info.portal.getLatLng();

  var text;

  if (window.plugin.distanceToPortal.currentLoc) {
    var dist = window.plugin.distanceToPortal.currentLoc.distanceTo(ll);

    if (dist >= 10000) {
      dist = Math.round(dist/1000)+'km';
    } else if (dist >= 1000) {
      dist = Math.round(dist/100)/10+'km';
    } else {
      dist = Math.round(dist)+'m';
    }

    var bearing = window.plugin.distanceToPortal.currentLoc.bearingTo(ll);
    var bearingWord = window.plugin.distanceToPortal.currentLoc.bearingWordTo(ll);

    text = 'Distance: '+dist+' <span id="portal-distance-bearing" style="transform: rotate('+bearing+'deg)"></span> '
      + zeroPad(bearing, 3) + '° ' + bearingWord;
  } else {
    text = 'Location not set';
  }

  var div = $('<div>')
    .attr({
      id: 'portal-distance',
      title: 'Double-click to set/change current location',
    })
    .html(text)
    .on('dblclick', window.plugin.distanceToPortal.setLocation);

  $('#resodetails').after(div);

};


window.plugin.distanceToPortal.setLocation = function() {
  if (window.plugin.distanceToPortal.currentLocMarker) {
    map.removeLayer(window.plugin.distanceToPortal.currentLocMarker);
    window.plugin.distanceToPortal.currentLocMarker = null;
    return;
  }


  if (!window.plugin.distanceToPortal.currentLoc) {
    window.plugin.distanceToPortal.currentLoc = map.getCenter();
  }


  var markerTemplate = '@@INCLUDESTRING:images/marker-icon.svg.template@@';
  window.plugin.distanceToPortal.currentLocMarker = L.marker(window.plugin.distanceToPortal.currentLoc,{
    icon: L.divIcon({
      iconSize: new L.Point(25, 41),
      iconAnchor: new L.Point(12, 41),
      html: markerTemplate.replace(/%COLOR%/g, '#444'),
      className: 'leaflet-iitc-distance-to-portal-location'
    }),
    draggable: true,
  });

  window.plugin.distanceToPortal.currentLocMarker.on('dragend', function(e) {
    window.plugin.distanceToPortal.currentLoc = window.plugin.distanceToPortal.currentLocMarker.getLatLng();

    localStorage['plugin-distance-to-portal'] = JSON.stringify({lat:window.plugin.distanceToPortal.currentLoc.lat, lng:window.plugin.distanceToPortal.currentLoc.lng});

    // bit nasty, but easiest way of refreshing the distance after marker is moved
    if (selectedPortal) renderPortalDetails(selectedPortal);
  });

  map.addLayer(window.plugin.distanceToPortal.currentLocMarker);
};


window.plugin.distanceToPortal.setup  = function() {
  // https://github.com/gregallensworth/Leaflet/
  @@INCLUDERAW:external/LatLng_Bearings.js@@

  try {
    window.plugin.distanceToPortal.currentLoc = L.latLng(JSON.parse(localStorage['plugin-distance-to-portal']));
  } catch(e) {
    window.plugin.distanceToPortal.currentLoc = null;
  }

  window.plugin.distanceToPortal.currentLocMarker = null;

  $('<style>').prop('type', 'text/css').html('@@INCLUDESTRING:plugins/distance-to-portal.css@@').appendTo('head');

  addHook('portalDetailsUpdated', window.plugin.distanceToPortal.addDistance);
};

var setup =  window.plugin.distanceToPortal.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
