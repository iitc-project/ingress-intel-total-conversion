// MAP DATA REQUEST CALCULATORS //////////////////////////////////////
// Ingress Intel splits up requests for map data (portals, links,
// fields) into tiles. To get data for the current viewport (i.e. what
// is currently visible) it first calculates which tiles intersect.
// For all those tiles, it then calculates the lat/lng bounds of that
// tile and a quadkey. Both the bounds and the quadkey are “somewhat”
// required to get complete data.
//
// Conversion functions courtesy of
// http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames


window.zoomToTilesPerEdge = function(zoom) {
//  var LEVEL_TO_TILES_PER_EDGE = [65536, 65536, 16384, 16384, 4096, 1536, 1024, 256, 32];
//  return LEVEL_TO_TILES_PER_EDGE[level];
  var ZOOM_TO_TILES_PER_EDGE = [32, 32, 32, 32, 256, 256, 256, 1024, 1024, 1536, 4096, 4096, 16384, 16384, 16384];
  return ZOOM_TO_TILES_PER_EDGE[zoom] || 65536;
}


window.lngToTile = function(lng, zoom) {
  return Math.floor((lng + 180) / 360 * zoomToTilesPerEdge(zoom));
}

window.latToTile = function(lat, zoom) {
  return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) +
    1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * zoomToTilesPerEdge(zoom));
}

window.tileToLng = function(x, zoom) {
  return x / zoomToTilesPerEdge(zoom) * 360 - 180;
}

window.tileToLat = function(y, zoom) {
  var n = Math.PI - 2 * Math.PI * y / zoomToTilesPerEdge(zoom);
  return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

window.pointToTileId = function(zoom, x, y) {
  return zoom + "_" + x + "_" + y;
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
