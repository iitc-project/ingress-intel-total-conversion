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

  // known correct as of 2014-08-14
  ZOOM_TO_TILES_PER_EDGE = [64, 64, 64, 64, 256, 256, 256, 1024, 1024, 1536, 4096, 4096, 6500, 6500, 6500];
  MAX_TILES_PER_EDGE = 9000;
  ZOOM_TO_LEVEL = [8, 8, 8, 8, 7, 7, 7, 6, 6, 5, 4, 4, 3, 2, 2, 1, 1];


  return {
    level: ZOOM_TO_LEVEL[zoom] || 0,  // default to level 0 (all portals) if not in array
    tilesPerEdge: ZOOM_TO_TILES_PER_EDGE[zoom] || MAX_TILES_PER_EDGE,
    zoom: zoom  // include the zoom level, for reference
  };
}


window.getDataZoomForMapZoom = function(zoom) {
  // we can fetch data at a zoom level different to the map zoom.

  //NOTE: the specifics of this are tightly coupled with the above ZOOM_TO_LEVEL and ZOOM_TO_TILES_PER_EDGE arrays

  // firstly, some of IITCs zoom levels, depending on base map layer, can be higher than stock. limit zoom level
  // (stock site max zoom may vary depending on google maps detail in the area - 20 or 21 max is common)
  if (zoom > 20) {
    zoom = 20;
  }

  if (!window.CONFIG_ZOOM_DEFAULT_DETAIL_LEVEL) {
    // some reasonable optimisations of data retreival

    switch(zoom) {
      case 2:
      case 3:
        // L8 portals - fall back to the furthest out view. less detail, faster retreival. cache advantages when zooming
        // (note: iitc + stock both limited so zoom 0 never possible)
        zoom = 1;
        break;

      case 4:
        // default is L7 - but this is a crazy number of tiles. fall back to L8 (but higher detail than above)
        // (the back-end does, unfortunately, rarely (never?) returns large fields with L8-only portals
        zoom = 3;
        break;

      case 5:
      case 6:
        // default L7 - pull out to furthest L7 zoom
        zoom = 4;
        break;

      case 8:
        // default L6 - pull back to highest L6 zoom
        zoom = 7;
        break;

      // L5 portals - only one zoom level

      case 11:
        // default L4 - pull back to lower detail L4
        zoom = 10;
        break;

      // L3 portals - only one zoom level

      case 14:
        // L2 portals - pull back to furthest
        zoom = 13;
        break;

      case 16:
        // L1 portals - pull back to furthest zoom
        zoom = 15;
        break;

      default:
        if (zoom >= 18) {
          // all portals - pull back to furthest zoom
          zoom = 17;
        }
        break;
    }
  }

  if (window.CONFIG_ZOOM_SHOW_MORE_PORTALS) {
    if (zoom >= 15 && zoom <= 16) {
      //L1+ and closer zooms. the 'all portals' zoom uses the same tile size, so it's no harm to request things at that zoom level
      zoom = 17;
    }
  }

  return zoom;
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
//change to quadkey construction
//as of 2014-05-06: zoom_x_y_minlvl_maxlvl_maxhealth

  return params.zoom + "_" + x + "_" + y + "_" + params.level + "_8_100";
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
