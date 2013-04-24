
// MAP DATA REQUEST CALCULATORS //////////////////////////////////////
// Ingress Intel splits up requests for map data (portals, links,
// fields) into tiles. To get data for the current viewport (i.e. what
// is currently visible) it first calculates which tiles intersect.
// For all those tiles, it then calculates the lat/lng bounds of that
// tile and a quadkey. Both the bounds and the quadkey are “somewhat”
// required to get complete data. No idea how the projection between
// lat/lng and tiles works.
// What follows now are functions that allow conversion between tiles
// and lat/lng as well as calculating the quad key. The variable names
// may be misleading.
// The minified source for this code was in gen_dashboard.js after the
// “// input 89” line (alternatively: the class was called “Xe”).

window.convertCenterLat = function(centerLat) {
  return Math.round(256 * 0.9999 * Math.abs(1 / Math.cos(centerLat * DEG2RAD)));
}

window.calculateR = function(convCenterLat) {
  return 1 << window.map.getZoom() - (convCenterLat / 256 - 1);
}

window.convertLatLngToPoint = function(latlng, magic, R) {
  var x = (magic + latlng.lng * magic / 180)*R;
  var l = Math.sin(latlng.lat * DEG2RAD);
  var y =  (magic + Math.log((1+l)/(1-l)) * -(magic / (2*Math.PI)))*R;
  return {x: Math.floor(x/magic), y: Math.floor(y/magic)};
}

window.convertPointToLatLng = function(x, y, magic, R) {
  var e = {};
  e.sw = {
    // orig function put together from all over the place
    // lat: (2 * Math.atan(Math.exp((((y + 1) * magic / R) - (magic/ 2)) / (-1*(magic / (2 * Math.PI))))) - Math.PI / 2) / (Math.PI / 180),
    // shortened version by your favorite algebra program.
    lat: (360*Math.atan(Math.exp(Math.PI - Math.PI*(y+1)/R)))/Math.PI - 90,
    lng: 180*x/R-180
  };
  e.ne = {
    //lat: (2 * Math.atan(Math.exp(((y * magic / R) - (magic/ 2)) / (-1*(magic / (2 * Math.PI))))) - Math.PI / 2) / (Math.PI / 180),
    lat: (360*Math.atan(Math.exp(Math.PI - Math.PI*y/R)))/Math.PI - 90,
    lng: 180*(x+1)/R-180
  };
  return e;
}

// calculates the quad key for a given point. The point is not(!) in
// lat/lng format.
window.pointToQuadKey = function(x, y) {
  return window.map.getZoom() + "_" + x + "_" + y;
}

// given quadkey and bounds, returns the format as required by the
// Ingress API to request map data.
window.generateBoundsParams = function(quadkey, bounds) {
  return {
    id: quadkey,
    qk: quadkey,
    minLatE6: Math.round(bounds.sw.lat * 1E6),
    minLngE6: Math.round(bounds.sw.lng * 1E6),
    maxLatE6: Math.round(bounds.ne.lat * 1E6),
    maxLngE6: Math.round(bounds.ne.lng * 1E6)
  };
}
