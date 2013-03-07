
// MAP DATA //////////////////////////////////////////////////////////
// these functions handle how and which entities are displayed on the
// map. They also keep them up to date, unless interrupted by user
// action.


// requests map data for current viewport. For details on how this
// works, refer to the description in “MAP DATA REQUEST CALCULATORS”
window.requestData = function() {
  console.log('refreshing data');
  requests.abort();
  cleanUp();

  var magic = convertCenterLat(map.getCenter().lat);
  var R = calculateR(magic);

  var bounds = map.getBounds();
  // convert to point values
  topRight = convertLatLngToPoint(bounds.getNorthEast(), magic, R);
  bottomLeft = convertLatLngToPoint(bounds.getSouthWest() , magic, R);
  // how many quadrants intersect the current view?
  quadsX = Math.abs(bottomLeft.x - topRight.x);
  quadsY = Math.abs(bottomLeft.y - topRight.y);

  // will group requests by second-last quad-key quadrant
  tiles = {};

  // walk in x-direction, starts right goes left
  for(var i = 0; i <= quadsX; i++) {
    var x = Math.abs(topRight.x - i);
    var qk = pointToQuadKey(x, topRight.y);
    var bnds = convertPointToLatLng(x, topRight.y, magic, R);
    if(!tiles[qk.slice(0, -1)]) tiles[qk.slice(0, -1)] = [];
    tiles[qk.slice(0, -1)].push(generateBoundsParams(qk, bnds));

    // walk in y-direction, starts top, goes down
    for(var j = 1; j <= quadsY; j++) {
      var qk = pointToQuadKey(x, topRight.y + j);
      var bnds = convertPointToLatLng(x, topRight.y + j, magic, R);
      if(!tiles[qk.slice(0, -1)]) tiles[qk.slice(0, -1)] = [];
      tiles[qk.slice(0, -1)].push(generateBoundsParams(qk, bnds));
    }
  }

  // Reset previous result of Portal Render Limit handler
  portalRenderLimit.init();
  // finally send ajax requests
  $.each(tiles, function(ind, tls) {
    data = { minLevelOfDetail: -1 };
    data.boundsParamsList = tls;
    window.requests.add(window.postAjax('getThinnedEntitiesV2', data, window.handleDataResponse, window.handleFailedRequest));
  });
}

// Handle failed map data request
window.handleFailedRequest = function() {
  if(requests.isLastRequest('getThinnedEntitiesV2')) {
    var leftOverPortals = portalRenderLimit.mergeLowLevelPortals(null);
    handlePortalsRender(leftOverPortals);
  }
  runHooks('requestFinished', {success: false});
}

// works on map data response and ensures entities are drawn/updated.
window.handleDataResponse = function(data, textStatus, jqXHR) {
  // remove from active ajax queries list
  if(!data || !data.result) {
    window.failedRequestCount++;
    console.warn(data);
    handleFailedRequest();
    return;
  }

  var m = data.result.map;
  // defer rendering of portals because there is no z-index in SVG.
  // this means that what’s rendered last ends up on top. While the
  // portals can be brought to front, this costs extra time. They need
  // to be in the foreground, or they cannot be clicked. See
  // https://github.com/Leaflet/Leaflet/issues/185
  var ppp = [];
  var p2f = {};
  $.each(m, function(qk, val) {
    $.each(val.deletedGameEntityGuids || [], function(ind, guid) {
      if(getTypeByGuid(guid) === TYPE_FIELD && window.fields[guid] !== undefined) {
        $.each(window.fields[guid].options.vertices, function(ind, vertex) {
          if(window.portals[vertex.guid] === undefined) return true;
          fieldArray = window.portals[vertex.guid].options.details.portalV2.linkedFields;
          fieldArray.splice($.inArray(guid, fieldArray), 1);
        });
      }
      window.removeByGuid(guid);
    });

    $.each(val.gameEntities || [], function(ind, ent) {
      // ent = [GUID, id(?), details]
      // format for links: { controllingTeam, creator, edge }
      // format for portals: { controllingTeam, turret }

      if(ent[2].turret !== undefined) {

        var latlng = [ent[2].locationE6.latE6/1E6, ent[2].locationE6.lngE6/1E6];
        if(!window.getPaddedBounds().contains(latlng)
              && selectedPortal !== ent[0]
              && urlPortal !== ent[0]
          ) return;



        ppp.push(ent); // delay portal render
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
  $.each(portals, function(ind, portal) {
    //~ if(selectedPortal === portal[0]) portalUpdateAvailable = true;
    if(urlPortal && portal[0] === urlPortal) portalInUrlAvailable = true;
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



// renders a portal on the map from the given entity
window.renderPortal = function(ent) {
  if(Object.keys(portals).length >= MAX_DRAWN_PORTALS && ent[0] !== selectedPortal)
    return removeByGuid(ent[0]);

  // hide low level portals on low zooms
  var portalLevel = getPortalLevel(ent[2]);
  if(portalLevel < getMinPortalLevel()  && ent[0] !== selectedPortal)
    return removeByGuid(ent[0]);

  var team = getTeam(ent[2]);

  // do nothing if portal did not change
  var layerGroup = portalsLayers[parseInt(portalLevel)];
  var old = findEntityInLeaflet(layerGroup, window.portals, ent[0]);
  if(old) {
    var oo = old.options;

    // Default checks to see if a portal needs to be re-rendered
    var u = oo.team !== team;
    u = u || oo.level !== portalLevel;

    // Allow plugins to add additional conditions as to when a portal gets re-rendered
    var hookData = {portal: ent[2], oldPortal: oo.details, reRender: false};
    runHooks('beforePortalReRender', hookData);
    u = u || hookData.reRender;

    // nothing changed that requires re-rendering the portal.
    if(!u) {
      // let resos handle themselves if they need to be redrawn
      renderResonators(ent, old);
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
    details: ent[2],
    guid: ent[0]});

  p.on('remove', function() {
    var portalGuid = this.options.guid

    // remove attached resonators, skip if
    // all resonators have already removed by zooming
    if(isResonatorsShow()) {
      for(var i = 0; i <= 7; i++)
        removeByGuid(portalResonatorGuid(portalGuid, i));
    }
    delete window.portals[portalGuid];
    if(window.selectedPortal === portalGuid) {
      window.unselectOldPortal();
      window.map.removeLayer(window.portalAccessIndicator);
      window.portalAccessIndicator = null;
    }
  });

  p.on('add', function() {
    // enable for debugging
    if(window.portals[this.options.guid]) throw('duplicate portal detected');
    window.portals[this.options.guid] = this;
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

  window.renderResonators(ent, null);

  window.runHooks('portalAdded', {portal: p});
  p.addTo(layerGroup);
}

window.renderResonators = function(ent, portalLayer) {
  if(!isResonatorsShow()) return;

  var portalLevel = getPortalLevel(ent[2]);
  if(portalLevel < getMinPortalLevel()  && ent[0] !== selectedPortal) return;
  var portalLatLng = [ent[2].locationE6.latE6/1E6, ent[2].locationE6.lngE6/1E6];

  var layerGroup = portalsLayers[parseInt(portalLevel)];
  var reRendered = false;
  $.each(ent[2].resonatorArray.resonators, function(i, rdata) {
    // skip if resonator didn't change
    if(portalLayer) {
      var oldRes = findEntityInLeaflet(layerGroup, window.resonators, portalResonatorGuid(ent[0], i));
      if(oldRes && isSameResonator(oldRes.options.details, rdata)) return true;
      if(oldRes) {
        if(isSameResonator(oldRes.options.details, rdata)) return true;
        removeByGuid(oldRes.options.guid);
      }
    }

    // skip and remove old resonator if no new resonator
    if(rdata === null) {
      return true;
    }

    // offset in meters
    var dn = rdata.distanceToPortal*SLOT_TO_LAT[rdata.slot];
    var de = rdata.distanceToPortal*SLOT_TO_LNG[rdata.slot];

    // Coordinate offset in radians
    var dLat = dn/EARTH_RADIUS;
    var dLon = de/(EARTH_RADIUS*Math.cos(Math.PI/180*(ent[2].locationE6.latE6/1E6)));

    // OffsetPosition, decimal degrees
    var lat0 = ent[2].locationE6.latE6/1E6 + dLat * 180/Math.PI;
    var lon0 = ent[2].locationE6.lngE6/1E6 + dLon * 180/Math.PI;
    var Rlatlng = [lat0, lon0];

    var resoGuid = portalResonatorGuid(ent[0], i);

    // the resonator
    var resoStyle =
      ent[0] === selectedPortal ? OPTIONS_RESONATOR_SELECTED : OPTIONS_RESONATOR_NON_SELECTED;
    var resoProperty = $.extend({
        opacity: 1,
        fillColor: COLORS_LVL[rdata.level],
        fillOpacity: rdata.energyTotal/RESO_NRG[rdata.level],
        clickable: false,
        guid: resoGuid
      }, resoStyle);

    var reso =  L.circleMarker(Rlatlng, resoProperty);

    // line connecting reso to portal
    var connStyle =
      ent[0] === selectedPortal ? OPTIONS_RESONATOR_LINE_SELECTED : OPTIONS_RESONATOR_LINE_NON_SELECTED;
    var connProperty =  $.extend({
        color: '#FFA000',
        dashArray: '0,10,8,4,8,4,8,4,8,4,8,4,8,4,8,4,8,4,8,4',
        fill: false,
        clickable: false
      }, connStyle);

    var conn = L.polyline([portalLatLng, Rlatlng], connProperty);


    // put both in one group, so they can be handled by the same logic.
    var r = L.layerGroup([reso, conn]);
    r.options = {
      level: rdata.level,
      details: rdata,
      pDetails: ent[2],
      guid: resoGuid
    };

    // However, LayerGroups (and FeatureGroups) don’t fire add/remove
    // events, thus this listener will be attached to the resonator. It
    // doesn’t matter to which element these are bound since Leaflet
    // will add/remove all elements of the LayerGroup at once.
    reso.on('remove', function() { delete window.resonators[this.options.guid]; });
    reso.on('add',    function() {
      if(window.resonators[this.options.guid]) {
        console.error('dup reso: ' + this.options.guid);
        window.debug.printStackTrace();
      }
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
  if(Object.keys(links).length >= MAX_DRAWN_LINKS)
    return removeByGuid(ent[0]);

  // assume that links never change. If they do, they will have a
  // different ID.
  if(findEntityInLeaflet(linksLayer, links, ent[0])) return;

  var team = getTeam(ent[2]);
  var edge = ent[2].edge;
  var latlngs = [
    [edge.originPortalLocation.latE6/1E6, edge.originPortalLocation.lngE6/1E6],
    [edge.destinationPortalLocation.latE6/1E6, edge.destinationPortalLocation.lngE6/1E6]
  ];
  var poly = L.polyline(latlngs, {
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

  poly.on('remove', function() { delete window.links[this.options.guid]; });
  poly.on('add',    function() {
    // enable for debugging
    if(window.links[this.options.guid]) throw('duplicate link detected');
    window.links[this.options.guid] = this;
    this.bringToBack();
  });
  poly.addTo(linksLayer);
}

// renders a field on the map from a given entity
window.renderField = function(ent) {
  if(Object.keys(fields).length >= MAX_DRAWN_FIELDS)
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

  var poly = L.polygon(latlngs, {
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
  poly.on('remove', function() { delete window.fields[this.options.guid]; });
  poly.on('add',    function() {
    // enable for debugging
    if(window.fields[this.options.guid]) console.warn('duplicate field detected');
    window.fields[this.options.guid] = f;
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
