// MAP DATA REQUEST ///////////////////////////////////////////////////
// class to request the map data tiles from the Ingress servers
// and then pass it on to the render class for display purposes
// Uses the map data cache class to reduce network requests


window.MapDataRequest = function() {
  this.cache = new DataCache();
  this.render = new Render();
  this.debugTiles = new RenderDebugTiles();

  this.activeRequestCount = 0;
  this.requestedTiles = {};

  // no more than this many requests in parallel
  this.MAX_REQUESTS = 4;
  // no more than this many tiles in one request
  this.MAX_TILES_PER_REQUEST = 16;
  // but don't create more requests if it would make less than this per request
  this.MIN_TILES_PER_REQUEST = 4;

  // number of times to retty a tile after a 'bad' error (i.e. not a timeout)
  this.MAX_TILE_RETRIES = 3;

  // refresh timers
  this.MOVE_REFRESH = 2.5; //refresh time to use after a move
  this.STARTUP_REFRESH = 1; //refresh time used on first load of IITC
  this.IDLE_RESUME_REFRESH = 5; //refresh time used after resuming from idle
  this.REFRESH = 60;  //minimum refresh time to use when not idle and not moving
  this.FETCH_TO_REFRESH_FACTOR = 2;  //refresh time is based on the time to complete a data fetch, times this value

  // ensure we have some initial map status
  this.setStatus ('startup');
}


window.MapDataRequest.prototype.start = function() {
  var savedContext = this;

  // setup idle resume function
  window.addResumeFunction ( function() { savedContext.setStatus('refreshing'); savedContext.refreshOnTimeout(savedContext.IDLE_RESUME_REFRESH); } );

  // and map move callback
  window.map.on('moveend', function() { savedContext.setStatus('refreshing'); savedContext.refreshOnTimeout(savedContext.MOVE_REFRESH); } );

  // and on movestart, we clear the request queue
  window.map.on('movestart', function() { savedContext.setStatus('paused'); savedContext.clearQueue(); } );

  // then set a timeout to start the first refresh
  this.refreshOnTimeout (this.STARTUP_REFRESH);
  this.setStatus ('refreshing');

}

window.MapDataRequest.prototype.refreshOnTimeout = function(seconds) {

  if (this.timer) {
    console.log("cancelling existing map refresh timer");
    clearTimeout(this.timer);
    this.timer = undefined;
  }


  console.log("starting map refresh in "+seconds+" seconds");

  // 'this' won't be right inside the callback, so save it
  var savedContext = this;
  this.timer = setTimeout ( function() { savedContext.timer = undefined; savedContext.refresh(); }, seconds*1000);
}


window.MapDataRequest.prototype.clearQueue = function() {
  this.tileBounds = {};
}


window.MapDataRequest.prototype.setStatus = function(short,long,progress) {
  this.status = { short: short, long: long, progress: progress };
  window.renderUpdateStatus();
}


window.MapDataRequest.prototype.getStatus = function() {
  return this.status;
};


window.MapDataRequest.prototype.refresh = function() {

  //time the refresh cycle
  this.refreshStartTime = new Date().getTime();


  this.cache.expire();

  this.debugTiles.reset();

  // a 'set' to keep track of hard failures for tiles
  this.tileErrorCount = {};

  // fill tileBounds with the data needed to request each tile
  this.tileBounds = {};


  var bounds = clampLatLngBounds(map.getBounds());
  var zoom = getPortalDataZoom();
  var minPortalLevel = getMinPortalLevelForZoom(zoom);

  window.runHooks ('mapDataRefreshStart', {bounds: bounds, zoom: zoom});

  this.render.startRenderPass(bounds);
  this.render.clearPortalsBelowLevel(minPortalLevel);

  console.log('requesting data tiles at zoom '+zoom+' (L'+minPortalLevel+'+ portals), map zoom is '+map.getZoom());


  var x1 = lngToTile(bounds.getWest(), zoom);
  var x2 = lngToTile(bounds.getEast(), zoom);
  var y1 = latToTile(bounds.getNorth(), zoom);
  var y2 = latToTile(bounds.getSouth(), zoom);

  this.cachedTileCount = 0;
  this.requestedTileCount = 0;
  this.successTileCount = 0;
  this.failedTileCount = 0;
  this.staleTileCount = 0;

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

      if (this.cache.isFresh(tile_id) ) {
        // data is fresh in the cache - just render it
        this.debugTiles.setState(tile_id, 'cache-fresh');
        this.render.processTileData (this.cache.get(tile_id));
        this.cachedTileCOunt += 1;
      } else {
        // no fresh data - queue a request
        var boundsParams = generateBoundsParams(
          tile_id,
          latSouth,
          lngWest,
          latNorth,
          lngEast
        );

        this.tileBounds[tile_id] = boundsParams;
        this.requestedTileCount += 1;
      }
    }
  }


  this.processRequestQueue(true);
}




window.MapDataRequest.prototype.processRequestQueue = function(isFirstPass) {

  // if nothing left in the queue, end the render. otherwise, send network requests
  if (Object.keys(this.tileBounds).length == 0) {
    this.render.endRenderPass();

    var endTime = new Date().getTime();
    var duration = (endTime - this.refreshStartTime)/1000;

    console.log("finished requesting data! (took "+duration+" seconds to complete)");

    window.runHooks ('mapDataRefreshEnd', {});


    if (!window.isIdle()) {
      // refresh timer based on time to run this pass, with a minimum of REFRESH seconds
      var refreshTimer = Math.max(this.REFRESH, duration*this.FETCH_TO_REFRESH_FACTOR);
      this.refreshOnTimeout(refreshTimer);
      this.setStatus ('done');
    } else {
      console.log("suspending map refresh - is idle");
      this.setStatus ('idle');
    }
    return;
  }

  // create a list of tiles that aren't requested over the network
  var pendingTiles = {};
  for (var id in this.tileBounds) {
    if (!(id in this.requestedTiles) ) {
      pendingTiles[id] = true;
    }
  }

  console.log("- request state: "+Object.keys(this.requestedTiles).length+" tiles in "+this.activeRequestCount+" active requests, "+Object.keys(pendingTiles).length+" tiles queued");


  var requestTileCount = Math.min(this.MAX_TILES_PER_REQUEST,Math.max(this.MIN_TILES_PER_REQUEST, Object.keys(pendingTiles).length/this.MAX_REQUESTS));

  while (this.activeRequestCount < this.MAX_REQUESTS && Object.keys(pendingTiles).length > 0) {
    // let's distribute the requests evenly throughout the pending list.

    var pendingTilesArray = Object.keys(pendingTiles);

    var mod = Math.ceil(pendingTilesArray.length / requestTileCount);

    var tiles = [];
    for (var i in pendingTilesArray) {
      if ((i % mod) == 0) {
        id = pendingTilesArray[i];
        tiles.push(id);
        delete pendingTiles[id];
      }
    }

    console.log("-- asking for "+tiles.length+" tiles in one request");
    this.sendTileRequest(tiles);
  }

  // update status
  var pendingTileCount = this.requestedTileCount - (this.successTileCount+this.failedTileCount+this.staleTileCount);
  var longText = 'Tiles: ' + this.cachedTileCount + ' cached, ' +
                 this.successTileCount + ' loaded, ' +
                 (this.staleTileCount ? this.staleTileCount + 'stale, ' : '') +
                 (this.failedTileCount ? this.failedTileCount + 'failed, ' : '') +
                 pendingTileCount + ' remaining';

  progress = this.requestedTileCount > 0 ? (this.requestedTileCount-pendingTileCount) / this.requestedTileCount : undefined;
  this.setStatus ('loading', longText, progress);
}


window.MapDataRequest.prototype.sendTileRequest = function(tiles) {

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

window.MapDataRequest.prototype.requeueTile = function(id, error) {
  if (id in this.tileBounds) {
    // tile is currently wanted...

    // first, see if the error can be ignored due to retry counts
    if (error) {
      this.tileErrorCount[id] = (this.tileErrorCount[id]||0)+1;
      if (this.tileErrorCount[id] < this.MAX_TILE_RETRIES) {
        // retry limit low enough - clear the error flag
        error = false;
      }
    }

    if (error) {
      // if error is still true, retry limit hit. use stale data from cache if available
      var data = this.cache.get(id);
      if (data) {
        // we have cached data - use it, even though it's stale
        this.debugTiles.setState (id, 'cache-stale');
        this.render.processTileData (data);
        this.staleTileCount += 1;
      } else {
        // no cached data
        this.debugTiles.setState (id, 'error');
        this.failedTileCount += 1;
      }
      // and delete from the pending requests...
      delete this.tileBounds[id];

    } else {
      // if false, was a 'timeout', so unlimited retries (as the stock site does)
      this.debugTiles.setState (id, 'retrying');
    }
  } // else the tile wasn't currently wanted (an old non-cancelled request) - ignore
}


window.MapDataRequest.prototype.handleResponse = function (data, tiles, success) {

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
          this.debugTiles.setState (id, 'ok');

          this.render.processTileData (val);

          delete this.tileBounds[id];
          this.successTileCount += 1;

        } // else we don't want this tile (from an old non-cancelled request) - ignore
      }

    }
  }

  this.processRequestQueue();
}
