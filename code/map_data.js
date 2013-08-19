// MAP DATA //////////////////////////////////////////////////////////
// these functions handle how and which entities are displayed on the
// map. They also keep them up to date, unless interrupted by user
// action.

// debug - display a set of rectangles on the map representing each data tile. the colour will represent it's state
window._debugDataTileStateLayer = undefined;

window.debugDataTileReset = function() {
  if (!window._debugDataTileStateLayer) {
    window._debugDataTileStateLayer = L.layerGroup();
    window.addLayerGroup("DEBUG Data Tiles", window._debugDataTileStateLayer, false);
  }

  window._debugDataTileIdToRectangle = {};
  window._debugDataTileStateLayer.clearLayers();
}

window.debugCreateTile = function(qk,bounds) {
  var s = {color: '#888', weight: 3, opacity: 0.7, fillColor: '#888', fillOpacity: 0.4, clickable: false};

  bounds = new L.LatLngBounds(bounds);
  bounds = bounds.pad(-0.02);

  var l = L.rectangle(bounds,s);
  window._debugDataTileIdToRectangle[qk] = l;
  window._debugDataTileStateLayer.addLayer(l);
}

window.debugSetTileColour = function(qk,bordercol,fillcol) {
  var l = window._debugDataTileIdToRectangle[qk];
  if (l) {
    var s = {color: bordercol, weight: 3, opacity: 0.3, fillColor: fillcol, fillOpacity: 0.1, clickable: false};
    l.setStyle(s);
  }
}


// cache for data tiles. indexed by the query key (qk)
window.cache = undefined;



// due to the cache (and race conditions in the server) - and now also oddities in the returned data
// we need to remember the deleted entities list across multiple requests
window._deletedEntityGuid = {}

// requests map data for current viewport. For details on how this
// works, refer to the description in “MAP DATA REQUEST CALCULATORS”
window.requestData = function() {
  if (window.cache === undefined) window.cache = new DataCache();


  console.log('refreshing data');
  requests.abort();
  cleanUp();
  window.statusTotalMapTiles = 0;
  window.statusCachedMapTiles = 0;
  window.statusSuccessMapTiles = 0;
  window.statusStaleMapTiles = 0;
  window.statusErrorMapTiles = 0;

  // clear the list of returned deleted entities
  window._deletedEntityGuid = {}

  debugDataTileReset();

  cache.expire();

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

  var cachedData = { result: { map: {} } };
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

      debugCreateTile(tile_id,[[latSouth,lngWest],[latNorth,lngEast]]);
      window.statusTotalMapTiles++;

      // TODO?: if the selected portal is in this tile, always fetch the data
      if (cache.isFresh(tile_id)) {
        // TODO: don't add tiles from the cache when 1. they were fully visible before, and 2. the zoom level is unchanged
        // TODO?: if a closer zoom level has all four tiles in the cache, use them instead?
        cachedData.result.map[tile_id] = cache.get(tile_id);
        debugSetTileColour(tile_id,'#0f0','#ff0');
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

        debugSetTileColour(tile_id,'#00f','#000');
      }

    }
  }

  // Reset previous result of Portal Render Limit handler
  portalRenderLimit.init();

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

  // process the requests from the cache
  console.log('got '+Object.keys(cachedData.result.map).length+' data tiles from cache');
  if(Object.keys(cachedData.result.map).length > 0) {
    handleDataResponse(cachedData, true);
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
      debugSetTileColour(tile_id,'#800','#ff0');
      console.log('(using stale cache entry for map tile '+tile_id+')');
      window.statusStaleMapTiles++;
    } else {
      // no cached data
      debugSetTileColour(tile_id,'#800','#f00');
      window.statusErrorMapTiles++;
    }
  });
  if(Object.keys(cachedData.result.map).length > 0) {
    handleDataResponse(cachedData, true);
  }

  if(requests.isLastRequest('getThinnedEntitiesV4')) {
    var leftOverPortals = portalRenderLimit.mergeLowLevelPortals(null);
    handlePortalsRender(leftOverPortals);
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
          debugSetTileColour(qk, '#f00','#f00');
          // no data in cache for this tile. continue processing - it's possible it also has some valid data
          window.statusErrorMapTiles++;
        } else {
          // stale cache entry exists - use it
          val = cacheVal;
          debugSetTileColour(qk, '#f00','#ff0');
          console.log('(using stale cache entry for map tile '+qk+')');
          window.statusStaleMapTiles++;
        }
      } else {
        // not an error - store this tile into the cache
        cache.store(qk,val);
        debugSetTileColour(qk, '#0f0','#0f0');
        window.statusSuccessMapTiles++;
      }

    }

    $.each(val.deletedGameEntityGuids || [], function(ind, guid) {
      // avoid processing a delete we've already done
      if (guid in window._deletedEntityGuid)
        return;

      // store that we've processed it
      window._deletedEntityGuid[guid] = true;

      // if the deleted entity is a field, remove this field from the linkedFields entries for any portals
      if(getTypeByGuid(guid) === TYPE_FIELD && window.fields[guid] !== undefined) {
        $.each(window.fields[guid].options.vertices, function(ind, vertex) {
          if(window.portals[vertex.guid] === undefined) return true;
          fieldArray = window.portals[vertex.guid].options.details.portalV2.linkedFields;
          fieldArray.splice($.inArray(guid, fieldArray), 1);
        });
      }

      // TODO? if the deleted entity is a link, remove it from any portals linkedEdges

      window.removeByGuid(guid);
    });

    $.each(val.gameEntities || [], function(ind, ent) {
      // ent = [GUID, id(?), details]
      // format for links: { controllingTeam, creator, edge }
      // format for portals: { controllingTeam, turret }

      // skip entities in the deleted list
      if(ent[0] in window._deletedEntityGuid) return true;


      if(ent[2].turret !== undefined) {
        // TODO? remove any linkedEdges or linkedFields that have entries in window._deletedEntityGuid

        var latlng = [ent[2].locationE6.latE6/1E6, ent[2].locationE6.lngE6/1E6];
        if(!window.getPaddedBounds().contains(latlng)
              && selectedPortal !== ent[0]
              && urlPortal !== ent[0]
              && !(urlPortalLL && urlPortalLL[0] === latlng[0] && urlPortalLL[1] === latlng[1])
          ) return;

        if('imageByUrl' in ent[2] && 'imageUrl' in ent[2].imageByUrl) {
          if(window.location.protocol === 'https:') {
            ent[2].imageByUrl.imageUrl = ent[2].imageByUrl.imageUrl.indexOf('www.panoramio.com') !== -1
                                       ? ent[2].imageByUrl.imageUrl.replace(/^http:\/\/www/, 'https://ssl').replace('small', 'medium')
                                       : ent[2].imageByUrl.imageUrl.replace(/^http:\/\//, '//');
          }
        } else {
          ent[2].imageByUrl = {'imageUrl': DEFAULT_PORTAL_IMG};
        }

        ppp[ent[0]] = ent; // delay portal render
      } else if(ent[2].edge !== undefined) {
        renderLink(ent);
      } else if(ent[2].capturedRegion !== undefined) {
        $.each(ent[2].capturedRegion, function(ind, vertex) {
          if(p2f[vertex.guid] === undefined)
            p2f[vertex.guid] = new Array();
          p2f[vertex.guid].push(ent[0]);
        });
        renderField(ent);
      } else {
        throw('Unknown entity: ' + JSON.stringify(ent));
      }
    });
  });

  $.each(ppp, function(ind, portal) {
    // when both source and destination portal are in the same response, no explicit 'edge' is returned
    // instead, we need to reconstruct them from the data within the portal details

    if ('portalV2' in portal[2] && 'linkedEdges' in portal[2].portalV2) {
      $.each(portal[2].portalV2.linkedEdges, function (ind, edge) {
        // don't reconstruct deleted links
        if (edge.edgeGuid in window._deletedEntityGuid)
          return;

        // no data for other portal - can't reconstruct
        if (!ppp[edge.otherPortalGuid])
          return;

        var otherportal = ppp[edge.otherPortalGuid];

        // check other portal has matching data for the reverse direction
        var hasOtherEdge = false;

        if ('portalV2' in otherportal[2] && 'linkedEdges' in otherportal[2].portalV2) {
          $.each(otherportal[2].portalV2.linkedEdges, function(otherind, otheredge) {
            if (otheredge.edgeGuid == edge.edgeGuid) {
              hasOtherEdge = true;
            }
          });
        }

        if (!hasOtherEdge)
          return;

        renderLink([
          edge.edgeGuid,
          0,  // link data modified time - set to 0 as it's unknown
          {
            "controllingTeam": portal[2].controllingTeam,
            "edge": {
              "destinationPortalGuid": edge.isOrigin ? ppp[edge.otherPortalGuid][0] : portal[0],
              "destinationPortalLocation": edge.isOrigin ? ppp[edge.otherPortalGuid][2].locationE6 : portal[2].locationE6,
              "originPortalGuid": !edge.isOrigin ? ppp[edge.otherPortalGuid][0] : portal[0],
              "originPortalLocation": !edge.isOrigin ? ppp[edge.otherPortalGuid][2].locationE6 : portal[2].locationE6
            },
          }
        ]);

      });
    }

    if(portal[2].portalV2['linkedFields'] === undefined) {
      portal[2].portalV2['linkedFields'] = [];
    }
    if(p2f[portal[0]] !== undefined) {
      $.merge(p2f[portal[0]], portal[2].portalV2['linkedFields']);
      portal[2].portalV2['linkedFields'] = uniqueArray(p2f[portal[0]]);
    }
  });

  // Process the portals with portal render limit handler first
  // Low level portal will hold until last request
  var newPpp = portalRenderLimit.splitOrMergeLowLevelPortals(ppp);
  // Clean up level of portal which over render limit after portalRenderLimit handler counted the new portals
  portalRenderLimit.cleanUpOverLimitPortalLevel();
  handlePortalsRender(newPpp);

  resolvePlayerNames();
  renderUpdateStatus();
  runHooks('requestFinished', {success: true});
}

window.handlePortalsRender = function(portals) {
  var portalInUrlAvailable = false;

  // Preserve selectedPortal because it will get lost on re-rendering
  // the portal
  var oldSelectedPortal = selectedPortal;
  runHooks('portalDataLoaded', {portals : portals});
  $.each(portals, function(guid, portal) {
    //~ if(selectedPortal === portal[0]) portalUpdateAvailable = true;
    if(urlPortalLL && urlPortalLL[0] === portal[2].locationE6.latE6/1E6 && urlPortalLL[1] === portal[2].locationE6.lngE6/1E6) {
      urlPortal = guid;
      portalInUrlAvailable = true;
      urlPortalLL = null;
    }
    if(window.portals[guid]) {
      highlightPortal(window.portals[guid]);
    }
    renderPortal(portal);
  });

  // restore selected portal if still available
  var selectedPortalGroup = portals[oldSelectedPortal];
  if(selectedPortalGroup) {
    selectedPortal = oldSelectedPortal;
    renderPortalDetails(selectedPortal);
    try {
      selectedPortalGroup.bringToFront();
    } catch(e) { /* portal is now visible, catch Leaflet error */ }
  }

  if(portalInUrlAvailable) {
    renderPortalDetails(urlPortal);
    urlPortal = null; // select it only once
  }
}

// removes entities that are still handled by Leaflet, although they
// do not intersect the current viewport.
window.cleanUp = function() {
  var cnt = [0,0,0];
  var b = getPaddedBounds();
  var minlvl = getMinPortalLevel();
  for(var i = 0; i < portalsLayers.length; i++) {
    // i is also the portal level
    portalsLayers[i].eachLayer(function(item) {
      var itemGuid = item.options.guid;
      // check if 'item' is a portal
      if(getTypeByGuid(itemGuid) != TYPE_PORTAL) return true;
      // portal must be in bounds and have a high enough level. Also don’t
      // remove if it is selected.
      if(itemGuid == window.selectedPortal ||
        (b.contains(item.getLatLng()) && i >= minlvl)) return true;
      cnt[0]++;
      portalsLayers[i].removeLayer(item);
    });
  }
  linksLayer.eachLayer(function(link) {
    if(b.intersects(link.getBounds())) return;
    cnt[1]++;
    linksLayer.removeLayer(link);
  });
  fieldsLayer.eachLayer(function(fieldgroup) {
    fieldgroup.eachLayer(function(item) {
      if(!item.options.guid) return true; // Skip MU div container as this doesn't have the bounds we need
      if(b.intersects(item.getBounds())) return;
      cnt[2]++;
      fieldsLayer.removeLayer(fieldgroup);
    });
  });
  console.log('removed out-of-bounds: '+cnt[0]+' portals, '+cnt[1]+' links, '+cnt[2]+' fields');
}


// removes given entity from map
window.removeByGuid = function(guid) {
  switch(getTypeByGuid(guid)) {
    case TYPE_PORTAL:
      if(!window.portals[guid]) return;
      var p = window.portals[guid];
      for(var i = 0; i < portalsLayers.length; i++)
        portalsLayers[i].removeLayer(p);
      break;
    case TYPE_LINK:
      if(!window.links[guid]) return;
      linksLayer.removeLayer(window.links[guid]);
      break;
    case TYPE_FIELD:
      if(!window.fields[guid]) return;
      fieldsLayer.removeLayer(window.fields[guid]);
      break;
    case TYPE_RESONATOR:
      if(!window.resonators[guid]) return;
      var r = window.resonators[guid];
      for(var i = 1; i < portalsLayers.length; i++)
        portalsLayers[i].removeLayer(r);
      break;
    default:
      console.warn('unknown GUID type: ' + guid);
      //window.debug.printStackTrace();
  }
}


// Separation of marker style setting from the renderPortal method
// Having this as a separate function allows subsituting alternate marker rendering (for plugins)
window.getMarker = function(ent, portalLevel, latlng, team) {
  var lvWeight = Math.max(2, Math.floor(portalLevel) / 1.5);
  var lvRadius = Math.floor(portalLevel) + 4;
  if(team === window.TEAM_NONE) {
    lvRadius = 7;
  }
    
  var p = L.circleMarker(latlng, {
    radius: lvRadius + (L.Browser.mobile ? PORTAL_RADIUS_ENLARGE_MOBILE : 0),
    color: ent[0] === selectedPortal ? COLOR_SELECTED_PORTAL : COLORS[team],
    opacity: 1,
    weight: lvWeight,
    fillColor: COLORS[team],
    fillOpacity: 0.5,
    clickable: true,
    level: portalLevel,
    team: team,
    ent: ent,
    details: ent[2],
    guid: ent[0]});
    
    return p;
}


// renders a portal on the map from the given entity
window.renderPortal = function(ent) {
  if(window.portalsCount >= MAX_DRAWN_PORTALS && ent[0] !== selectedPortal)
    return removeByGuid(ent[0]);

  // hide low level portals on low zooms
  var portalLevel = getPortalLevel(ent[2]);
  if(portalLevel < getMinPortalLevel()  && ent[0] !== selectedPortal)
    return removeByGuid(ent[0]);

  var team = getTeam(ent[2]);

  // do nothing if portal did not change
  var layerGroup = portalsLayers[parseInt(portalLevel)];
  var old = findEntityInLeaflet(layerGroup, window.portals, ent[0]);
  if(!changing_highlighters && old) {
    var oo = old.options;

    // if the data we have is older than/the same as the data already rendered, do nothing
    if (oo.ent[1] >= ent[1]) {
      // let resos handle themselves if they need to be redrawn
      renderResonators(ent[0], ent[2], old);
      return;
    }

    // Default checks to see if a portal needs to be re-rendered
    var u = oo.team !== team;
    u = u || oo.level !== portalLevel;

    // Allow plugins to add additional conditions as to when a portal gets re-rendered
    var hookData = {portal: ent[2], oldPortal: oo.details, portalGuid: ent[0], mtime: ent[1], oldMtime: oo.ent[1], reRender: false};
    runHooks('beforePortalReRender', hookData);
    u = u || hookData.reRender;

    // nothing changed that requires re-rendering the portal.
    if(!u) {
      // let resos handle themselves if they need to be redrawn
      renderResonators(ent[0], ent[2], old);
      // update stored details for portal details in sidebar.
      old.options.details = ent[2];
      return;
    }
  }

  // there were changes, remove old portal. Don’t put this in old, in
  // case the portal changed level and findEntityInLeaflet doesn’t find
  // it.
  removeByGuid(ent[0]);

  var latlng = [ent[2].locationE6.latE6/1E6, ent[2].locationE6.lngE6/1E6];

  // pre-loads player names for high zoom levels
  loadPlayerNamesForPortal(ent[2]);

  var p = getMarker(ent, portalLevel, latlng, team);

  p.on('remove', function() {
    var portalGuid = this.options.guid

    // remove attached resonators, skip if
    // all resonators have already removed by zooming
    if(isResonatorsShow()) {
      for(var i = 0; i <= 7; i++)
        removeByGuid(portalResonatorGuid(portalGuid, i));
    }
    delete window.portals[portalGuid];
    window.portalsCount --;
    if(window.selectedPortal === portalGuid) {
      window.unselectOldPortal();
    }
  });

  p.on('add', function() {
    // enable for debugging
    if(window.portals[this.options.guid]) throw('duplicate portal detected');
    window.portals[this.options.guid] = this;
    window.portalsCount ++;

    window.renderResonators(this.options.guid, this.options.details, this);
    // handles the case where a selected portal gets removed from the
    // map by hiding all portals with said level
    if(window.selectedPortal !== this.options.guid)
      window.portalResetColor(this);
  });

  p.on('click',    function() { window.renderPortalDetails(ent[0]); });
  p.on('dblclick', function() {
    window.renderPortalDetails(ent[0]);
    window.map.setView(latlng, 17);
  });

  highlightPortal(p);
  window.runHooks('portalAdded', {portal: p});
  p.addTo(layerGroup);
}

window.renderResonators = function(portalGuid, portalDetails, portalLayer) {
  if(!isResonatorsShow()) return;

  // only draw when the portal is not hidden
  if(portalLayer && !window.map.hasLayer(portalLayer)) return;

  var portalLevel = getPortalLevel(portalDetails);
  var portalLatLng = [portalDetails.locationE6.latE6/1E6, portalDetails.locationE6.lngE6/1E6];

  var reRendered = false;
  $.each(portalDetails.resonatorArray.resonators, function(i, rdata) {
    // skip if resonator didn't change
    var oldRes = window.resonators[portalResonatorGuid(portalGuid, i)];
    if(oldRes) {
      if(isSameResonator(oldRes.options.details, rdata)) return true;
      // remove old resonator if exist
      removeByGuid(oldRes.options.guid);
    }

    // skip and remove old resonator if no new resonator
    if(rdata === null) return true;

    var resoLatLng = getResonatorLatLng(rdata.distanceToPortal, rdata.slot, portalLatLng);
    var resoGuid = portalResonatorGuid(portalGuid, i);

    // the resonator
    var resoStyle =
      portalGuid === selectedPortal ? OPTIONS_RESONATOR_SELECTED : OPTIONS_RESONATOR_NON_SELECTED;
    var resoProperty = $.extend({
        fillColor: COLORS_LVL[rdata.level],
        fillOpacity: rdata.energyTotal/RESO_NRG[rdata.level],
        guid: resoGuid
      }, resoStyle);

    var reso =  L.circleMarker(resoLatLng, resoProperty);

    // line connecting reso to portal
    var connProperty =
      portalGuid === selectedPortal ? OPTIONS_RESONATOR_LINE_SELECTED : OPTIONS_RESONATOR_LINE_NON_SELECTED;

    var conn = L.polyline([portalLatLng, resoLatLng], connProperty);

    // put both in one group, so they can be handled by the same logic.
    var r = L.layerGroup([reso, conn]);
    r.options = {
      level: rdata.level,
      details: rdata,
      pDetails: portalDetails,
      guid: resoGuid
    };

    // However, LayerGroups (and FeatureGroups) don’t fire add/remove
    // events, thus this listener will be attached to the resonator. It
    // doesn’t matter to which element these are bound since Leaflet
    // will add/remove all elements of the LayerGroup at once.
    reso.on('remove', function() { delete window.resonators[this.options.guid]; });
    reso.on('add',    function() {
      if(window.resonators[this.options.guid]) throw('duplicate resonator detected');
      window.resonators[this.options.guid] = r;
    });

    r.addTo(portalsLayers[parseInt(portalLevel)]);
    reRendered = true;
  });
  // if there is any resonator re-rendered, bring portal to front
  if(reRendered && portalLayer) portalLayer.bringToFront();
}

// append portal guid with -resonator-[slot] to get guid for resonators
window.portalResonatorGuid = function(portalGuid, slot) {
  return portalGuid + '-resonator-' + slot;
}

window.isResonatorsShow = function() {
  return map.getZoom() >= RESONATOR_DISPLAY_ZOOM_LEVEL;
}

window.isSameResonator = function(oldRes, newRes) {
  if(!oldRes && !newRes) return true;
  if(!oldRes || !newRes) return false;
  if(typeof oldRes !== typeof newRes) return false;
  if(oldRes.level !== newRes.level) return false;
  if(oldRes.energyTotal !== newRes.energyTotal) return false;
  if(oldRes.distanceToPortal !== newRes.distanceToPortal) return false;
  return true;
}

window.portalResetColor = function(portal) {
  portal.setStyle({color:  COLORS[getTeam(portal.options.details)]});
  resonatorsResetStyle(portal.options.guid);
}

window.resonatorsResetStyle = function(portalGuid) {
  window.resonatorsSetStyle(portalGuid, OPTIONS_RESONATOR_NON_SELECTED, OPTIONS_RESONATOR_LINE_NON_SELECTED);
}

window.resonatorsSetSelectStyle = function(portalGuid) {
  window.resonatorsSetStyle(portalGuid, OPTIONS_RESONATOR_SELECTED, OPTIONS_RESONATOR_LINE_SELECTED);
}

window.resonatorsSetStyle = function(portalGuid, resoStyle, lineStyle) {
  for(var i = 0; i < 8; i++) {
    resonatorLayerGroup = resonators[portalResonatorGuid(portalGuid, i)];
    if(!resonatorLayerGroup) continue;
    // bring resonators and their connection lines to front separately.
    // this way the resonators are drawn on top of the lines.
    resonatorLayerGroup.eachLayer(function(layer) {
      if (!layer.options.guid)  // Resonator line
        layer.bringToFront().setStyle(lineStyle);
    });
    resonatorLayerGroup.eachLayer(function(layer) {
      if (layer.options.guid) // Resonator
        layer.bringToFront().setStyle(resoStyle);
    });
  }
  portals[portalGuid].bringToFront();
}

// renders a link on the map from the given entity
window.renderLink = function(ent) {
  if(window.linksCount >= MAX_DRAWN_LINKS)
    return removeByGuid(ent[0]);

  // some links are constructed from portal linkedEdges data. These have no valid 'creator' data.
  // replace with the more detailed data
  // (we assume the other values - coordinates, etc - remain unchanged)
  var found=findEntityInLeaflet(linksLayer, links, ent[0]);
  if (found) {
    if (!found.options.data.creator && ent[2].creator) {
      //our existing data has no creator, but the new data does - update
      found.options.data = ent[2];
    }
    return;
  }

  var team = getTeam(ent[2]);
  var edge = ent[2].edge;
  var latlngs = [
    [edge.originPortalLocation.latE6/1E6, edge.originPortalLocation.lngE6/1E6],
    [edge.destinationPortalLocation.latE6/1E6, edge.destinationPortalLocation.lngE6/1E6]
  ];
  var poly = L.geodesicPolyline(latlngs, {
    color: COLORS[team],
    opacity: 1,
    weight:2,
    clickable: false,
    guid: ent[0],
    data: ent[2],
    smoothFactor: 0 // doesn’t work for two points anyway, so disable
  });
  // determine which links are very short and don’t render them at all.
  // in most cases this will go unnoticed, but improve rendering speed.
  poly._map = window.map;
  poly.projectLatlngs();
  var op = poly._originalPoints;
  var dist = Math.abs(op[0].x - op[1].x) + Math.abs(op[0].y - op[1].y);
  if(dist <= 10) {
    return;
  }

  if(!getPaddedBounds().intersects(poly.getBounds())) return;

  poly.on('remove', function() {
    delete window.links[this.options.guid]; 
    window.linksCount--;
  });
  poly.on('add',    function() {
    // enable for debugging
    if(window.links[this.options.guid]) throw('duplicate link detected');
    window.links[this.options.guid] = this;
    window.linksCount++;
    this.bringToBack();
  });
  poly.addTo(linksLayer);
}

// renders a field on the map from a given entity
window.renderField = function(ent) {
  if(window.fieldsCount >= MAX_DRAWN_FIELDS)
    return window.removeByGuid(ent[0]);

  var old = findEntityInLeaflet(fieldsLayer, window.fields, ent[0]);
  // If this already exists and the zoom level has not changed, we don't need to do anything
  if(old && map.getZoom() === old.options.creationZoom) return;

  var team = getTeam(ent[2]);
  var reg = ent[2].capturedRegion;
  var latlngs = [
    L.latLng(reg.vertexA.location.latE6/1E6, reg.vertexA.location.lngE6/1E6),
    L.latLng(reg.vertexB.location.latE6/1E6, reg.vertexB.location.lngE6/1E6),
    L.latLng(reg.vertexC.location.latE6/1E6, reg.vertexC.location.lngE6/1E6)
  ];

  var poly = L.geodesicPolygon(latlngs, {
    fillColor: COLORS[team],
    fillOpacity: 0.25,
    stroke: false,
    clickable: false,
    smoothFactor: 0, // hiding small fields will be handled below
    guid: ent[0]});

  // determine which fields are too small to be rendered and don’t
  // render them, so they don’t count towards the maximum fields limit.
  // This saves some DOM operations as well, but given the relatively
  // low amount of fields there isn’t much to gain.
  // The algorithm is the same as used by Leaflet.
  poly._map = window.map;
  poly.projectLatlngs();
  var count = L.LineUtil.simplify(poly._originalPoints, 6).length;
  if(count <= 2) return;

  if(!getPaddedBounds().intersects(poly.getBounds())) return;

  // Curve fit equation to normalize zoom window area
  var areaZoomRatio = calcTriArea(latlngs)/Math.exp(14.2714860198866-1.384987247*map.getZoom());
  var countForMUDisplay = L.LineUtil.simplify(poly._originalPoints, FIELD_MU_DISPLAY_POINT_TOLERANCE).length

  // Do nothing if zoom did not change. We need to recheck the field if the
  // zoom level is different then when the field was rendered as it could
  // now be appropriate or not to show an MU count
  if(old) {
    var layerCount = 0;
    old.eachLayer(function(item) {
        layerCount++;
    });
    // Don't do anything since we already have an MU display and we still want to
    if(areaZoomRatio > FIELD_MU_DISPLAY_AREA_ZOOM_RATIO && countForMUDisplay > 2 && layerCount === 2) return;
    // Don't do anything since we don't have an MU display and don't want to
    if(areaZoomRatio <= FIELD_MU_DISPLAY_AREA_ZOOM_RATIO && countForMUDisplay <= 2 && layerCount === 1) return;
    removeByGuid(ent[0]);
  }

  // put both in one group, so they can be handled by the same logic.
  if (areaZoomRatio > FIELD_MU_DISPLAY_AREA_ZOOM_RATIO && countForMUDisplay > 2) {
    // centroid of field for placing MU count at
    var centroid = [
      (latlngs[0].lat + latlngs[1].lat + latlngs[2].lat)/3,
      (latlngs[0].lng + latlngs[1].lng + latlngs[2].lng)/3
    ];

    var fieldMu = L.marker(centroid, {
      icon: L.divIcon({
        className: 'fieldmu',
        iconSize: [70,12],
        html: digits(ent[2].entityScore.entityScore)
        }),
      clickable: false
      });
    var f = L.layerGroup([poly, fieldMu]);
  } else {
    var f = L.layerGroup([poly]);
  }
  f.options = {
    vertices: reg,
    lastUpdate: ent[1],
    creationZoom: map.getZoom(),
    guid: ent[0],
    data: ent[2]
  };

  // However, LayerGroups (and FeatureGroups) don’t fire add/remove
  // events, thus this listener will be attached to the field. It
  // doesn’t matter to which element these are bound since Leaflet
  // will add/remove all elements of the LayerGroup at once.
  poly.on('remove', function() {
    delete window.fields[this.options.guid];
    window.fieldsCount--;
  });
  poly.on('add',    function() {
    // enable for debugging
    if(window.fields[this.options.guid]) console.warn('duplicate field detected');
    window.fields[this.options.guid] = f;
    window.fieldsCount++;
    this.bringToBack();
  });
  f.addTo(fieldsLayer);
}


// looks for the GUID in either the layerGroup or entityHash, depending
// on which is faster. Will either return the Leaflet entity or null, if
// it does not exist.
// For example, to find a field use the function like this:
// field = findEntityInLeaflet(fieldsLayer, fields, 'asdasdasd');
window.findEntityInLeaflet = function(layerGroup, entityHash, guid) {
  // fast way
  if(map.hasLayer(layerGroup)) return entityHash[guid] || null;

  // slow way in case the layer is currently hidden
  var ent = null;
  layerGroup.eachLayer(function(entity) {
    if(entity.options.guid !== guid) return true;
    ent = entity;
    return false;
  });
  return ent;
}
