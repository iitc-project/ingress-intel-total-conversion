// MAP DATA REQUEST CALCULATORS //////////////////////////////////////
// Ingress Intel splits up requests for map data (portals, links,
// fields) into tiles. To get data for the current viewport (i.e. what
// is currently visible) it first calculates which tiles intersect.
// For all those tiles, it then calculates the lat/lng bounds of that
// tile and a quadkey. Both the bounds and the quadkey are “somewhat”
// required to get complete data.
//
// Convertion functions courtesy of
// http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames

window.lngToTile = function(lng, zoom) {
  return Math.floor((lng + 180) / 360 * Math.pow(2, (zoom>12)?zoom:(zoom+2)));
}

window.latToTile = function(lat, zoom) {
  return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) +
    1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, (zoom>12)?zoom:(zoom+2)));
}

window.tileToLng = function(x, zoom) {
  return x / Math.pow(2, (zoom>12)?zoom:(zoom+2)) * 360 - 180;
}

window.tileToLat = function(y, zoom) {
  var n = Math.PI - 2 * Math.PI * y / Math.pow(2,  (zoom>12)?zoom:(zoom+2));
  return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

window.pointToTileId = function(zoom, x, y) {
  return zoom + "_" + x + "_" + y;
}

// given tile id and bounds, returns the format as required by the
// Ingress API to request map data.
window.generateBoundsParams = function(tile_id, minLat, minLng, maxLat, maxLng) {
  return {
    id: tile_id,
    qk: tile_id,
    minLatE6: Math.round(minLat * 1E6),
    minLngE6: Math.round(minLng * 1E6),
    maxLatE6: Math.round(maxLat * 1E6),
    maxLngE6: Math.round(maxLng * 1E6)
  };
}

window.getResonatorLatLng = function(dist, slot, portalLatLng) {
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
