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


window.levelToTilesPerEdge = function(level) {
  var LEVEL_TO_TILES_PER_EDGE = [65536, 65536, 16384, 16384, 4096, 1536, 1024, 256, 32];
  return LEVEL_TO_TILES_PER_EDGE[level];
}


window.lngToTile = function(lng, level) {
  return Math.floor((lng + 180) / 360 * levelToTilesPerEdge(level));
}

window.latToTile = function(lat, level) {
  return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) +
    1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * levelToTilesPerEdge(level));
}

window.tileToLng = function(x, level) {
  return x / levelToTilesPerEdge(level) * 360 - 180;
}

window.tileToLat = function(y, level) {
  var n = Math.PI - 2 * Math.PI * y / levelToTilesPerEdge(level);
  return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

window.pointToTileId = function(level, x, y) {
  return level + "_" + x + "_" + y;
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
