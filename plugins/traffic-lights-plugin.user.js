// ==UserScript==
// @id             iitc-plugin-traffic-lights@ivanatora
// @name           IITC plugin: show traffic lights
// @category       Info
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Show some really bad places for a portal that can be hacked from a car waiting on a red light
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @include        https://*.ingress.com/mission/*
// @include        http://*.ingress.com/mission/*
// @match          https://*.ingress.com/mission/*
// @match          http://*.ingress.com/mission/*
// @grant          none
// @require         https://rawgit.com/mapbox/leaflet-geodesy/gh-pages/leaflet-geodesy.js
// @require         https://api.mapbox.com/mapbox.js/plugins/turf/v2.0.2/turf.min.js
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.trafficLights = function() {

}

window.plugin.trafficLights.searchTraffic = function() {
  if(plugin.trafficLights.isQueryRunning) return;
  
  plugin.trafficLights.isQueryRunning = true;
  
  $.ajax({
    url        : 'https://overpass-api.de/api/interpreter?data=' +
    '[out:json][timeout:25];' +
    '(node["highway"="traffic_signals"](' + window.plugin.trafficLights.getBbox() + '););' +
    'out body;' +
    '>;' +
    'out skel qt;',
    dataType   : 'json',
    crossDomain: true,
    success    : function(res) {
      if(plugin.trafficLights.circleUnion) {
        map.removeLayer(plugin.trafficLights.circleUnion);
      }
      
      plugin.trafficLights.isQueryRunning = false;
      for(var i in res.elements) {
        var center = L.latLng(res.elements[ i ].lat, res.elements[ i ].lon);
        
        var circ = LGeo.circle(center, 180, { color: 'red' }).addTo(plugin.trafficLights.circleLayer);
      }
      
      plugin.trafficLights.circleUnion = window.plugin.trafficLights.unify(plugin.trafficLights.circleLayer.getLayers()).addTo(map);
    }
  })
}

window.plugin.trafficLights.getBbox = function() {
  var bbox = map.getBounds();
  var a = bbox._southWest,
      b = bbox._northEast;
  return [ a.lat, a.lng, b.lat, b.lng ].join(",");
}

//union function using turf.js
window.plugin.trafficLights.unify = function(polyList) {
  for(var i = 0; i < polyList.length; ++i) {
    if(i == 0) {
      var unionTemp = polyList[ i ].toGeoJSON();
    } else {
      unionTemp = turf.union(unionTemp, polyList[ i ].toGeoJSON());
    }
  }
  return L.geoJson(unionTemp, { style: plugin.trafficLights.unionStyle });
}

var setup = function() {
  plugin.trafficLights.isQueryRunning = false;
  plugin.trafficLights.circleLayer = L.layerGroup();
  plugin.trafficLights.circleUnion = L.layerGroup();
  
  plugin.trafficLights.unionStyle = {
    fillColor  : '#FA0',
    fillOpacity: 0.2,
    color      : '#F00',
    opacity    : 0.5,
    weight     : 3
  }
  
  map.on('zoomend', window.plugin.trafficLights.searchTraffic);
  map.on('moveend', window.plugin.trafficLights.searchTraffic);
  
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
