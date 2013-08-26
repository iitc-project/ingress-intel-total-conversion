// MAP DATA //////////////////////////////////////////////////////////
// these functions handle how and which entities are displayed on the
// map. They also keep them up to date, unless interrupted by user
// action.

// cache for data tiles. indexed by the query key (qk)
window.cache = undefined;
window.render = undefined;
window.debugTiles = undefined;


// due to the cache (and race conditions in the server) - and now also oddities in the returned data
// we need to remember the deleted entities list across multiple requests
window._deletedEntityGuid = {}

// requests map data for current viewport. For details on how this
// works, refer to the description in “MAP DATA REQUEST CALCULATORS”
window.requestData = function() {
  if (window.cache === undefined) window.cache = new DataCache();
  if (window.render === undefined) window.render = new Render();


  console.log('refreshing data');
  requests.abort();
  window.statusTotalMapTiles = 0;
  window.statusCachedMapTiles = 0;
  window.statusSuccessMapTiles = 0;
  window.statusStaleMapTiles = 0;
  window.statusErrorMapTiles = 0;

  // clear the list of returned deleted entities
  window._deletedEntityGuid = {}

  if (!debugTiles) debugTiles = new RenderDebugTiles();
  debugTiles.reset();

  cache.expire();


  render.startRenderPass();


  //a limit on the number of map tiles to be pulled in a single request
  var MAX_TILES_PER_BUCKET = 18;
  // the number of separate buckets. more can be created if the size exceeds MAX_TILES_PER_BUCKET
  var BUCKET_COUNT = 4;

  var bounds = clampLatLngBounds(map.getBounds());

  //we query the server as if the zoom level was this. it may not match the actual map zoom level
  var z = getPortalDataZoom();
  console.log('requesting data tiles at zoom '+z+' (L'+getMinPortalLevelForZoom(z)+'+ portals), map zoom is '+map.getZoom());

  var x1 = lngToTile(bounds.getWest(), z);
  var x2 = lngToTile(bounds.getEast(), z);
  var y1 = latToTile(bounds.getNorth(), z);
  var y2 = latToTile(bounds.getSouth(), z);

  // will group requests by second-last quad-key quadrant
  tiles = {};
  fullBucketCount = 0;

  var requestTileCount = 0;

  // y goes from left to right
  for (var y = y1; y <= y2; y++) {
    // x goes from bottom to top(?)
    for (var x = x1; x <= x2; x++) {
      var tile_id = pointToTileId(z, x, y);
      var latNorth = tileToLat(y,z);
      var latSouth = tileToLat(y+1,z);
      var lngWest = tileToLng(x,z);
      var lngEast = tileToLng(x+1,z);

      debugTiles.create(tile_id,[[latSouth,lngWest],[latNorth,lngEast]]);
      window.statusTotalMapTiles++;

      // TODO?: if the selected portal is in this tile, always fetch the data
      if (cache.isFresh(tile_id)) {
        var tiledata = cache.get(tile_id);

        render.processTileData (tiledata);

        debugTiles.setColour(tile_id,'#0f0','#ff0');
        window.statusCachedMapTiles++;
      } else {
        // group requests into buckets based on the tile count retrieved via the network.
        var bucket = requestTileCount % BUCKET_COUNT;

        if (!tiles[bucket]) {
          //create empty bucket
          tiles[bucket] = [];
        }
        else if(tiles[bucket].length >= MAX_TILES_PER_BUCKET) {
          //too many items in bucket. rename it, and create a new empty one
          tiles[bucket+'_'+fullBucketCount] = tiles[bucket];
          fullBucketCount++;
          tiles[bucket] = [];      
        }

        requestTileCount++;

        var boundsParam = generateBoundsParams(
          tile_id,
          latSouth,
          lngWest,
          latNorth,
          lngEast
        );

        tiles[bucket].push(boundsParam);

        debugTiles.setColour(tile_id,'#00f','#000');
      }

    }
  }


  // send ajax requests
  console.log('requesting '+requestTileCount+' tiles in '+Object.keys(tiles).length+' requests');
  $.each(tiles, function(ind, tls) {
    // sort the tiles by the cache age - oldest/missing first. the server often times out requests and the first listed
    // are more likely to succeed. this will ensure we're more likely to have fresh data
    tls.sort(function(a,b) {
      var timea = cache.getTime(a.qk);
      var timeb = cache.getTime(b.qk);
      if (timea < timeb) return -1;
      if (timea > timeb) return 1;
      return 0;
    });

    data = { };
    data.boundsParamsList = tls;
    // keep a list of tile_ids with each request. in the case of a server error, we can try and use cached tiles if available
    var tile_ids = []
    $.each(tls,function(i,req) { tile_ids.push(req.qk); });
    window.requests.add(window.postAjax('getThinnedEntitiesV4', data, function(data, textStatus, jqXHR) { window.handleDataResponse(data,false,tile_ids); }, function() { window.handleFailedRequest(tile_ids); }));
  });

  if(tiles.length == 0) {
    // if everything was cached, we immediately end the render pass
    // otherwise, the render pass will be ended in the callbacks
    render.endRenderPass();
  }
}

// Handle failed map data request
window.handleFailedRequest = function(tile_ids) {
  console.log('request failed: tiles '+tile_ids.join(','));

  var cachedData = { result: { map: {} } };  
  $.each(tile_ids, function(ind,tile_id) {
    var cached = cache.get(tile_id);
    if (cached) {
      // we have stale cached data - use it
      cachedData.result.map[tile_id] = cached;
      debugTiles.setColour(tile_id,'#800','#ff0');
      console.log('(using stale cache entry for map tile '+tile_id+')');
      window.statusStaleMapTiles++;
    } else {
      // no cached data
      debugTiles.setColour(tile_id,'#800','#f00');
      window.statusErrorMapTiles++;
    }
  });
  if(Object.keys(cachedData.result.map).length > 0) {
    handleDataResponse(cachedData, true);
  }

  if(requests.isLastRequest('getThinnedEntitiesV4')) {
    render.endRenderPass();
//    var leftOverPortals = portalRenderLimit.mergeLowLevelPortals(null);
//    handlePortalsRender(leftOverPortals);
  }
  runHooks('requestFinished', {success: false});
}

// works on map data response and ensures entities are drawn/updated.
window.handleDataResponse = function(data, fromCache, tile_ids) {
  // remove from active ajax queries list
  if(!data || !data.result) {
    window.failedRequestCount++;
    console.warn(data);
    handleFailedRequest(tile_ids);
    return;
  }

  var m = data.result.map;
  // defer rendering of portals because there is no z-index in SVG.
  // this means that what’s rendered last ends up on top. While the
  // portals can be brought to front, this costs extra time. They need
  // to be in the foreground, or they cannot be clicked. See
  // https://github.com/Leaflet/Leaflet/issues/185
  var ppp = {};
  var p2f = {};
  $.each(m, function(qk, val) {

    // if this request wasn't from the cache, check it's status. store in the cache if good
    // for debugging, we set the debug tile colours. cached tiles have colours set elsewhere so are not set here
    if (!fromCache) {

      if('error' in val) {
        console.log('map data tile '+qk+' response error: '+val.error);

        // try to use data in the cache, even if it's stale
        var cacheVal = cache.get(qk);

        if (!cacheVal) {
          debugTiles.setColour(qk, '#f00','#f00');
          // no data in cache for this tile. continue processing - it's possible it also has some valid data
          window.statusErrorMapTiles++;
        } else {
          // stale cache entry exists - use it
          val = cacheVal;
          debugTiles.setColour(qk, '#f00','#ff0');
          console.log('(using stale cache entry for map tile '+qk+')');
          window.statusStaleMapTiles++;
        }
      } else {
        // not an error - store this tile into the cache
        cache.store(qk,val);
        debugTiles.setColour(qk, '#0f0','#0f0');
        window.statusSuccessMapTiles++;
      }

    }

    render.processTileData(val);

  });


  resolvePlayerNames();
  renderUpdateStatus();

  if(requests.isLastRequest('getThinnedEntitiesV4')) {
    render.endRenderPass();
//    var leftOverPortals = portalRenderLimit.mergeLowLevelPortals(null);
//    handlePortalsRender(leftOverPortals);
  }
  runHooks('requestFinished', {success: true});
}

