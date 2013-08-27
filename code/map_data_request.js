// MAP DATA REQUEST ///////////////////////////////////////////////////
// class to request the map data tiles from the Ingress servers
// and then pass it on to the render class for display purposes
// Uses the map data cache class to reduce network requests


window.Request = function() {
  this.cache = new DataCache();
  this.render = new Render();
  this.debugTiles = new RenderDebugTiles();

  this.activeRequestCount = 0;
  this.requestedTiles = {};

  this.MAX_REQUESTS = 4;
  this.MAX_TILES_PER_REQUEST = 12;

}


window.Request.prototype.start = function() {

  this.cache.expire();

  this.debugTiles.reset();


  var bounds = clampLatLngBounds(map.getBounds());
  var zoom = getPortalDataZoom();
  var minPortalLevel = getMinPortalLevelForZoom(zoom);


  this.render.startRenderPass(bounds);
  this.render.clearPortalsBelowLevel(minPortalLevel);

  console.log('requesting data tiles at zoom '+zoom+' (L'+minPortalLevel+'+ portals), map zoom is '+map.getZoom());

  // fill tileBounds with the data needed to request each tile
  this.tileBounds = {};

  var x1 = lngToTile(bounds.getWest(), zoom);
  var x2 = lngToTile(bounds.getEast(), zoom);
  var y1 = latToTile(bounds.getNorth(), zoom);
  var y2 = latToTile(bounds.getSouth(), zoom);

  // y goes from left to right
  for (var y = y1; y <= y2; y++) {
    // x goes from bottom to top(?)
    for (var x = x1; x <= x2; x++) {
      var tile_id = pointToTileId(zoom, x, y);
      var latNorth = tileToLat(y,zoom);
      var latSouth = tileToLat(y+1,zoom);
      var lngWest = tileToLng(x,zoom);
      var lngEast = tileToLng(x+1,zoom);

      this.debugTiles.create(tile_id,[[latSouth,lngWest],[latNorth,lngEast]]);

      var boundsParams = generateBoundsParams(
        tile_id,
        latSouth,
        lngWest,
        latNorth,
        lngEast
      );

      this.tileBounds[tile_id] = boundsParams;

    }
  }


  this.renderCachedTiles();


  this.processRequestQueue();
}


window.Request.prototype.renderCachedTiles = function() {

  for (var tile_id in this.tileBounds) {
    if (this.cache.isFresh(tile_id)) {
      // fresh cache data

      this.debugTiles.setState(tile_id, 'cache-fresh');

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
  console.log("Request.processRequestQueue...");

  // if nothing left in the queue, end the render. otherwise, send network requests
  if (Object.keys(this.tileBounds).length == 0) {
    this.render.endRenderPass();
    // TODO: start timer for next refresh cycle here
    console.log("Request.processRequestQueue: ended");

    return;
  }


  // create a list of tiles that aren't requested over the network
  var pendingTiles = {};
  for (var id in this.tileBounds) {
    if (!(id in this.requestedTiles) ) {
      pendingTiles[id] = true;
    }
  }

  console.log("Request.processRequestQueue: "+Object.keys(pendingTiles).length+" tiles waiting");


  while (this.activeRequestCount < this.MAX_REQUESTS && Object.keys(pendingTiles).length > 0) {
    // let's distribute the requests evenly throughout the pending list.

    var pendingTilesArray = Object.keys(pendingTiles);

    var mod = Math.ceil(Object.keys(pendingTiles).length / this.MAX_TILES_PER_REQUEST);

    var tiles = [];
    for (var i in pendingTilesArray) {
      if ((i % mod) == 0) {
        id = pendingTilesArray[i];
        tiles.push(id);
        delete pendingTiles[id];
//        if (tiles.length >= this.MAX_TILES_PER_REQUEST) {
//          break;
//        }
      }
    }

    console.log("Request.processRequestQueue: asking for "+tiles.length+" tiles in one request");
    this.sendTileRequest(tiles);
  }

}


window.Request.prototype.sendTileRequest = function(tiles) {

  var boundsParamsList = [];

  for (var i in tiles) {
    var id = tiles[i];

    this.debugTiles.setState (id, 'requested');

    this.requestedTiles[id] = true;

    var boundsParams = this.tileBounds[id];
    if (boundsParams) {
      boundsParamsList.push (boundsParams);
    } else {
      console.warn('failed to find bounds for tile id '+id);
    }
  }

  var data = { boundsParamsList: boundsParamsList };

  this.activeRequestCount += 1;

  var savedThis = this;

  window.requests.add (window.postAjax('getThinnedEntitiesV4', data, 
    function(data, textStatus, jqXHR) { savedThis.handleResponse (data, tiles, true); },  // request successful callback
    function() { savedThis.handleResponse (undefined, tiles, false); }  // request failed callback
  ));
}

window.Request.prototype.requeueTile = function(id, error) {
  if (id in this.tileBounds) {
    // tile is currently wanted...

    if (error) {
      // if error is true, it was a 'bad' error - in this case we limit the number of retries (or prefer stale cached data?)
      var data = this.cache.get(id);
      if (data) {
        // we have cached data - use it, even though it's stale
        this.debugTiles.setState (id, 'cache-stale');
        this.render.processTileData (data);
        delete this.tileBounds[id];
      } else {
        // no cached data
        this.debugTiles.setState (id, 'error');
      }
      // and delete from the pending requests...
      delete this.tileBounds[id];

    } else {
      // if false, was a 'timeout', so unlimited retries (as the stock site does)
      this.debugTiles.setState (id, 'retrying');
    }
  }
}


window.Request.prototype.handleResponse = function (data, tiles, success) {

  this.activeRequestCount -= 1;

  for (var i in tiles) {
    var id = tiles[i];
    delete this.requestedTiles[id];
  }


  if (!success || !data || !data.result) {
    console.warn("Request.handleResponse: request failed - requeing...");

    //request failed - requeue all the tiles(?)
    for (var i in tiles) {
      var id = tiles[i];
      this.requeueTile(id, true);
    }
  } else {

    // TODO: use result.minLevelOfDetail ??? stock site doesn't use it yet...

    var m = data.result.map;

    for (var id in m) {
      var val = m[id];

      if ('error' in val) {
        // server returned an error for this individual data tile

        if (val.error == "TIMEOUT") {
          console.log('map data tile '+id+' returned TIMEOUT');
          // TIMEOUT errors for individual tiles are 'expected'(!) - and result in a silent unlimited retries
          this.requeueTile(id, false);
        } else {
          console.warn('map data tile '+id+' failed: error=='+val.error);
          this.requeueTile(id, true);
        }
      } else {
        // no error for this data tile - process it
        console.log('map data tile '+id+' is good...');

        // store the result in the cache
        this.cache.store (id, val);

        // if this tile was in the render list, render it
        // (requests aren't aborted when new requests are started, so it's entirely possible we don't want to render it!)
        if (id in this.tileBounds) {
          this.debugTiles.setState (id, 'ok');

          this.render.processTileData (val);

          delete this.tileBounds[id];
        }
      }

    }
  }

  this.processRequestQueue();
}
