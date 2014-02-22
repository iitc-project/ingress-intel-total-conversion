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


window.getMapZoomTileParameters = function(zoom) {
  // these arrays/constants are based on those in the stock intel site. it's essential we keep them in sync with their code
  // (it may be worth reading the values from their code rather than using our own copies? it's a case of either
  //  breaking if they rename their variables if we do, or breaking if they change the values if we don't)
  var ZOOM_TO_TILES_PER_EDGE = [32, 32, 32, 32, 256, 256, 256, 1024, 1024, 1536, 4096, 4096, 16384, 16384, 16384];
  var MAX_TILES_PER_EDGE = 65536;
  var ZOOM_TO_LEVEL = [8, 8, 8, 8, 7, 7, 7, 6, 6, 5, 4, 4, 3, 2, 2, 1, 1];

  return {
    level: ZOOM_TO_LEVEL[zoom] || 0,  // default to level 0 (all portals) if not in array
    tilesPerEdge: ZOOM_TO_TILES_PER_EDGE[zoom] || MAX_TILES_PER_EDGE,
    zoom: zoom  // include the zoom level, for reference
  };
}


window.lngToTile = function(lng, params) {
  return Math.floor((lng + 180) / 360 * params.tilesPerEdge);
}

window.latToTile = function(lat, params) {
  return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) +
    1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * params.tilesPerEdge);
}

window.tileToLng = function(x, params) {
  return x / params.tilesPerEdge * 360 - 180;
}

window.tileToLat = function(y, params) {
  var n = Math.PI - 2 * Math.PI * y / params.tilesPerEdge;
  return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

window.pointToTileId = function(params, x, y) {
  return params.zoom + "_" + x + "_" + y;
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
