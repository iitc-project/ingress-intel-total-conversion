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

  var ZOOM_TO_TILES_PER_EDGE = [64, 64, 128, 128, 256, 256, 256, 1024, 1024, 1536, 4096, 4096, 6500, 6500, 6500];
  var MAX_TILES_PER_EDGE = 9000;
  var ZOOM_TO_LEVEL = [8, 8, 8, 8, 7, 7, 7, 6, 6, 5, 4, 4, 3, 2, 2, 1, 1];

  // the current API allows the client to request a minimum portal level. the ZOOM_TO_LEVEL list are minimums
  // however, in my view, this can return excessive numbers of portals in many cases. let's try an optional reduction
  // of detail level at some zoom levels

  var level = ZOOM_TO_LEVEL[zoom] || 0;  // default to level 0 (all portals) if not in array

  if (window.CONFIG_ZOOM_SHOW_LESS_PORTALS_ZOOMED_OUT) {
    if (level <= 7 && level >= 4) {
      // reduce portal detail level by one - helps reduce clutter
      level = level+1;
    }

  }

  return {
    level: level,
    maxLevel: ZOOM_TO_LEVEL[zoom] || 0,  // for reference, for log purposes, etc
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

  var origTileParams = getMapZoomTileParameters(zoom);

  if (!window.CONFIG_ZOOM_DEFAULT_DETAIL_LEVEL) {

    // to improve the cacheing performance, we try and limit the number of zoom levels we retrieve data for
    // to avoid impacting server load, we keep ourselves restricted to a zoom level with the sane numbre
    // of tilesPerEdge and portal levels visible

    while (zoom > 1) {
      var newTileParams = getMapZoomTileParameters(zoom-1);
      if (newTileParams.tilesPerEdge != origTileParams.tilesPerEdge || newTileParams.level != origTileParams.level) {
        // switching to zoom-1 would result in a different detail level - so we abort changing things
        break;
      } else {
        // changing to zoom = zoom-1 results in identical tile parameters - so we can safely step back
        // with no increase in either server load or number of requests
        zoom = zoom-1;
      }
    }

  }

  if (window.CONFIG_ZOOM_SHOW_MORE_PORTALS) {
    // this is, in theory, slightly 'unfriendly' to the servers. in practice, this isn't the case - and it can even be nicer
    // as it vastly improves cacheing in IITC and also reduces the amount of panning/zooming a user would do
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
