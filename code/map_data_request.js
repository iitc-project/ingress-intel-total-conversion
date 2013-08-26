// MAP DATA REQUEST ///////////////////////////////////////////////////
// class to request the map data tiles from the Ingress servers
// and then pass it on to the render class for display purposes
// Uses the map data cache class to reduce network requests


window.Request = function() {
  this.cache = new DataCache();
  this.render = new Render();
  this.debugTiles = new RenderDebugTiles();

  this.activeRequestCount = 0;

  this.MAX_REQUESTS = 4;
  this.MAX_TILES_PER_REQUEST = 12;


}


window.Request.prototype.start = function() {

  this.cache.expire();

  this.debugTiles.reset();


  var bounds = clampLatLngBounds(map.getBounds());
  var zoom = getPortalDataZoom();
  var minPortalLevel = getPortalLevelForZoom(zoom);


  this.render.startRenderPass(bounds);
  this.render.clearPortalsBelowLevel(minPortalLevel);

  console.log('requesting data tiles at zoom '+zoom+' (L'+minPortalLevel+'+ portals), map zoom is '+map.getZoom());

  var x1 = lngToTile(bounds.getWest(), z);
  var x2 = lngToTile(bounds.getEast(), z);
  var y1 = latToTile(bounds.getNorth(), z);
  var y2 = latToTile(bounds.getSouth(), z);

  this.tileBounds = {};


  // y goes from left to right
  for (var y = y1; y <= y2; y++) {
    // x goes from bottom to top(?)
    for (var x = x1; x <= x2; x++) {
      var tile_id = pointToTileId(z, x, y);
      var latNorth = tileToLat(y,z);
      var latSouth = tileToLat(y+1,z);
      var lngWest = tileToLng(x,z);
      var lngEast = tileToLng(x+1,z);

      this.debugTiles.create(tile_id,[[latSouth,lngWest],[latNorth,lngEast]]);

      var boundsParam = generateBoundsParams(
        tile_id,
        latSouth,
        lngWest,
        latNorth,
        lngEast
      );

      this.tileBounds[tile_id] = boundsParam;

    }
  }


  this.renderCachedTiles();

  // if nothing left in the queue, end the render. otherwise, send network requests
  if (Object.keys(this.tileBounds).length == 0) {
    this.render.endRenderPass();
    // TODO: start timer for next refresh cycle here
  } else {
    this.processRequestQueue();
  }

}


window.Request.prototype.renderCachedTiles = function() {

  for (var tile_id in this.tileBounds) {
    if (this.cache.isFresh(tile_id) {
      // fresh cache data
      var data = this.cache.get(tile_id);
      // render it...
      // TODO?? make rendering sort-of asynchronous? rendering a large number of dense tiles is slow - so perhaps use a timer and render one/a few at a time??
      // (could even consider splitting these larger tiles into multiple render calls, perhaps?)
      this.render.processTileData(data);
      // .. and delete from the pending requests
      delete this.tileBounds[tile_id];
    }
  }

}


window.Request.prototype.processRequestQueue = function() {

}


window.Request.prototype.sendTileRequest = function(tiles) {

  var boundsParamList = [];

  for (var id in tiles) {
    var boundsParam = this.tileBounds[id];
    if (boundsParam) {
      push (boundsParamList, boundsParam);
    } else {
      console.warn('failed to find bounds for tile id '+id);
    }
  }

  var data = { boundsParamList: boundsParamList };

  this.activeRequestCount += 1;

  window.requests.add (window.postAjax('getThinnedEntitiesV4', data, 
    function(data, textStatus, jqXHR) { this.handleResponse (data, tiles, true); },  // request successful callback
    function() { this.handleResponse (undefined, tiles, false); }  // request failed callback
  ));
}

window.Request.prototype.requeueTile = function(id, error) {
  if (id in this.tileBounds) {
    // tile is currently wanted, requeue

    if (error) {
      // if error is true, it was a 'bad' error - in this case we limit the number of retries (or prefer stale cached data?)
      var data = this.cache.get(id);
      if (data) {
        // we have cached data - use it, even though it's stale
        this.render.processTileData (data);
        delete this.tileBounds[id];
      } else {
        // no cached data
      }

    } else {
      // if false, was a 'timeout', so unlimited retries (as the stock site does)

    }
  }
}


window.Request.prototype.handleResponse = function (data, tiles, success) {

  this.activeRequestCount -= 1;


  if (!success || !data || !data.result) {
    //request failed - requeue all the tiles(?)
    for (var id in tiles) {
      this.requeueTile(id, true);
    }
  } else {
    var m = data.result.map;

    for (var id in m) {
      var val = m[id];

      if ('error' in val) {
        // server returned an error for this individual data tile

        if (val.error == "TIMEOUT") {
          // TIMEOUT errors for individual tiles are 'expected'(!) - and result in a silent unlimited retries
          this.requeueTile(id, false);
        } else {
          console.warn('map data tile '+id+' failed: error=='+val.error);
          this.requeueTile(id, true);
        }
      } else {
        // no error for this data tile - process it

        // store the result in the cache
        this.cache.store (id, val);

        // if this tile was in the render list, render it
        // (requests aren't aborted when new requests are started, so it's entirely possible we don't want to render it!)
        if (id in this.tileBounds) {
          this.render.processTileData (val);

          delete this.tileBounds[id];
        }
      }

    }
  }

}
