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


window.setupDataTileParams = function() {
  // default values - used to fall back to if we can't detect those used in stock intel
  var DEFAULT_ZOOM_TO_TILES_PER_EDGE = [1,1,1,40,40,80,80,320,1000,2000,2000,4000,8000,16000,16000,32000];
  var DEFAULT_ZOOM_TO_LEVEL = [8,8,8,8,7,7,7,6,6,5,4,4,3,2,2,1,1];

  // stock intel doesn't have this array (they use a switch statement instead), but this is far neater
  var DEFAULT_ZOOM_TO_LINK_LENGTH = [200000,200000,200000,200000,200000,60000,60000,10000,5000,2500,2500,800,300,0,0];

  window.TILE_PARAMS = {};

  // not in stock to detect - we'll have to assume the above values...
  window.TILE_PARAMS.ZOOM_TO_LINK_LENGTH = DEFAULT_ZOOM_TO_LINK_LENGTH;


  if (niantic_params.ZOOM_TO_LEVEL && niantic_params.TILES_PER_EDGE) {
    window.TILE_PARAMS.ZOOM_TO_LEVEL = niantic_params.ZOOM_TO_LEVEL;
    window.TILE_PARAMS.TILES_PER_EDGE = niantic_params.TILES_PER_EDGE;


    // lazy numerical array comparison
    if ( JSON.stringify(niantic_params.ZOOM_TO_LEVEL) != JSON.stringify(DEFAULT_ZOOM_TO_LEVEL)) {
      console.warn('Tile parameter ZOOM_TO_LEVEL have changed in stock intel. Detected correct values, but code should be updated');
      debugger;
    }
    if ( JSON.stringify(niantic_params.TILES_PER_EDGE) != JSON.stringify(DEFAULT_ZOOM_TO_TILES_PER_EDGE)) {
      console.warn('Tile parameter TILES_PER_EDGE have changed in stock intel. Detected correct values, but code should be updated');
      debugger;
    }

  } else {
    dialog({
      title: 'IITC Warning',
      html: "<p>IITC failed to detect the ZOOM_TO_LEVEL and/or TILES_PER_EDGE settings from the stock intel site.</p>"
           +"<p>IITC is now using fallback default values. However, if detection has failed it's likely the values have changed."
           +" IITC may not load the map if these default values are wrong.</p>",
    });

    window.TILE_PARAMS.ZOOM_TO_LEVEL = DEFAULT_ZOOM_TO_LEVEL;
    window.TILE_PARAMS.TILES_PER_EDGE = DEFAULT_ZOOM_TO_TILES_PER_EDGE;
  }

  // 2015-07-01: niantic added code to the stock site that overrides the min zoom level for unclaimed portals to 15 and above
  // instead of updating the zoom-to-level array. makes no sense really....
  // we'll just chop off the array at that point, so the code defaults to level 0 (unclaimed) everywhere...
  window.TILE_PARAMS.ZOOM_TO_LEVEL = window.TILE_PARAMS.ZOOM_TO_LEVEL.slice(0,15);

}


window.debugMapZoomParameters = function() {

  //for debug purposes, log the tile params used for each zoom level
  console.log('DEBUG: Map Zoom Parameters');
  var doneZooms = {};
  for (var z=MIN_ZOOM; z<=21; z++) {
    var ourZoom = getDataZoomForMapZoom(z);
    console.log('DEBUG: map zoom '+z+': IITC requests '+ourZoom+(ourZoom!=z?' instead':''));
    if (!doneZooms[ourZoom]) {
      var params = getMapZoomTileParameters(ourZoom);
      var msg = 'DEBUG: data zoom '+ourZoom;
      if (params.hasPortals) {
        msg += ' has portals, L'+params.level+'+';
      } else {
        msg += ' NO portals (was L'+params.level+'+)';
      }
      msg += ', minLinkLength='+params.minLinkLength;
      msg += ', tiles per edge='+params.tilesPerEdge;
      console.log(msg);
      doneZooms[ourZoom] = true;
    }
  }
}



window.getMapZoomTileParameters = function(zoom) {


  // the current API allows the client to request a minimum portal level. the window.TILE_PARAMS.ZOOM_TO_LEVEL list are minimums
  // however, in my view, this can return excessive numbers of portals in many cases. let's try an optional reduction
  // of detail level at some zoom levels

  var level = window.TILE_PARAMS.ZOOM_TO_LEVEL[zoom] || 0;  // default to level 0 (all portals) if not in array

//  if (window.CONFIG_ZOOM_SHOW_LESS_PORTALS_ZOOMED_OUT) {
//    if (level <= 7 && level >= 4) {
//      // reduce portal detail level by one - helps reduce clutter
//      level = level+1;
//    }
//  }

  var maxTilesPerEdge = window.TILE_PARAMS.TILES_PER_EDGE[window.TILE_PARAMS.TILES_PER_EDGE.length-1];

  return {
    level: level,
    maxLevel: window.TILE_PARAMS.ZOOM_TO_LEVEL[zoom] || 0,  // for reference, for log purposes, etc
    tilesPerEdge: window.TILE_PARAMS.TILES_PER_EDGE[zoom] || maxTilesPerEdge,
    minLinkLength: window.TILE_PARAMS.ZOOM_TO_LINK_LENGTH[zoom] || 0,
    hasPortals: zoom >= window.TILE_PARAMS.ZOOM_TO_LINK_LENGTH.length,  // no portals returned at all when link length limits things
    zoom: zoom  // include the zoom level, for reference
  };
}


window.getDataZoomForMapZoom = function(zoom) {
  // we can fetch data at a zoom level different to the map zoom.

  //NOTE: the specifics of this are tightly coupled with the above ZOOM_TO_LEVEL and TILES_PER_EDGE arrays

  // firstly, some of IITCs zoom levels, depending on base map layer, can be higher than stock. limit zoom level
  // (stock site max zoom may vary depending on google maps detail in the area - 20 or 21 max is common)
  if (zoom > 21) {
    zoom = 21;
  }


  if (!window.CONFIG_ZOOM_DEFAULT_DETAIL_LEVEL) {

    // to improve the cacheing performance, we try and limit the number of zoom levels we retrieve data for
    // to avoid impacting server load, we keep ourselves restricted to a zoom level with the sane numbre
    // of tilesPerEdge and portal levels visible

    var origTileParams = getMapZoomTileParameters(zoom);

    while (zoom > MIN_ZOOM) {
      var newTileParams = getMapZoomTileParameters(zoom-1);

      if ( newTileParams.tilesPerEdge != origTileParams.tilesPerEdge
        || newTileParams.hasPortals != origTileParams.hasPortals
        || newTileParams.level*newTileParams.hasPortals != origTileParams.level*origTileParams.hasPortals  // multiply by 'hasPortals' bool - so comparison does not matter when no portals available
      ) {
        // switching to zoom-1 would result in a different detail level - so we abort changing things
        break;
      } else {
        // changing to zoom = zoom-1 results in identical tile parameters - so we can safely step back
        // with no increase in either server load or number of requests
        zoom = zoom-1;
      }
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
