
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

  // finally send ajax requests
  $.each(tiles, function(ind, tls) {
    data = { minLevelOfDetail: -1 };
    data.boundsParamsList = tls;
    window.requests.add(window.postAjax('getThinnedEntitiesV2', data, window.handleDataResponse));
  });
}

// works on map data response and ensures entities are drawn/updated.
window.handleDataResponse = function(data, textStatus, jqXHR) {
  // remove from active ajax queries list
  if(!data || !data.result) {
    window.failedRequestCount++;
    console.warn(data);
    return;
  }

  var portalUpdateAvailable = false;
  var portalInUrlAvailable = false;
  var m = data.result.map;
  // defer rendering of portals because there is no z-index in SVG.
  // this means that what’s rendered last ends up on top. While the
  // portals can be brought to front, this costs extra time. They need
  // to be in the foreground, or they cannot be clicked. See
  // https://github.com/Leaflet/Leaflet/issues/185
  var ppp = [];
  var p2f = {};
  $.each(m, function(qk, val) {
    $.each(val.deletedGameEntityGuids, function(ind, guid) {
      if(getTypeByGuid(guid) === TYPE_FIELD && window.fields[guid] !== undefined) {
        $.each(window.fields[guid].options.vertices, function(ind, vertex) {
          if(window.portals[vertex.guid] === undefined) return true;
          fieldArray = window.portals[vertex.guid].options.portalV2.linkedFields;
          fieldArray.splice($.inArray(guid, fieldArray), 1);
        });
      }
      window.removeByGuid(guid);
    });

    $.each(val.gameEntities, function(ind, ent) {
      // ent = [GUID, id(?), details]
      // format for links: { controllingTeam, creator, edge }
      // format for portals: { controllingTeam, turret }

      if(ent[2].turret !== undefined) {
        if(selectedPortal == ent[0]) portalUpdateAvailable = true;
        if(urlPortal && ent[0] == urlPortal) portalInUrlAvailable = true;

        var latlng = [ent[2].locationE6.latE6/1E6, ent[2].locationE6.lngE6/1E6];
        if(!window.getPaddedBounds().contains(latlng)
              && selectedPortal != ent[0]
              && urlPortal != ent[0]
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

  $.each(ppp, function(ind, portal) { renderPortal(portal); });
  if(portals[selectedPortal]) {
    try {
      portals[selectedPortal].bringToFront();
    } catch(e) { /* portal is now visible, catch Leaflet error */ }
  }

  if(portalInUrlAvailable) {
    renderPortalDetails(urlPortal);
    urlPortal = null; // select it only once
  }

  if(portalUpdateAvailable) renderPortalDetails(selectedPortal);
  resolvePlayerNames();
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
  fieldsLayer.eachLayer(function(field) {
    if(b.intersects(field.getBounds())) return;
    cnt[2]++;
    fieldsLayer.removeLayer(field);
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
  if(Object.keys(portals).length >= MAX_DRAWN_PORTALS && ent[0] != selectedPortal)
    return removeByGuid(ent[0]);

  // hide low level portals on low zooms
  var portalLevel = getPortalLevel(ent[2]);
  if(portalLevel < getMinPortalLevel()  && ent[0] != selectedPortal)
    return removeByGuid(ent[0]);

  var team = getTeam(ent[2]);

  // do nothing if portal did not change
  var layerGroup = portalsLayers[parseInt(portalLevel)];
  var old = findEntityInLeaflet(layerGroup, window.portals, ent[0]);
  if(old) {
    var oo = old.options;
    var u = oo.team !== team;
    u = u || oo.level !== portalLevel;
    // nothing for the portal changed, so don’t update. Let resonators
    // manage themselves if they want to be updated.
    if(!u) return renderResonators(ent);
    // there were changes, remove old portal
    removeByGuid(ent[0]);
  }

  var latlng = [ent[2].locationE6.latE6/1E6, ent[2].locationE6.lngE6/1E6];

  // pre-loads player names for high zoom levels
  loadPlayerNamesForPortal(ent[2]);


  var lvWeight = Math.max(2, portalLevel / 1.5);
  var lvRadius = Math.max(portalLevel + 3, 5);

  var p = L.circleMarker(latlng, {
    radius: lvRadius,
    color: ent[0] == selectedPortal ? COLOR_SELECTED_PORTAL : COLORS[team],
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
        removeByGuid(portalResonatorGuid(portalGuid,i));
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
    if(window.selectedPortal != this.options.guid)
      window.portalResetColor(this);
  });

  p.on('click',    function() { window.renderPortalDetails(ent[0]); });
  p.on('dblclick', function() {
    window.renderPortalDetails(ent[0]);
    window.map.setView(latlng, 17);
  });

  window.renderResonators(ent);

  window.runHooks('portalAdded', {portal: p});

  // portalLevel contains a float, need to round down
  p.addTo(layerGroup);
}

window.renderResonators = function(ent) {
  var portalLevel = getPortalLevel(ent[2]);
  if(portalLevel < getMinPortalLevel()  && ent[0] != selectedPortal) return;

  if(!isResonatorsShow()) return;

  for(var i=0; i < ent[2].resonatorArray.resonators.length; i++) {
    var rdata = ent[2].resonatorArray.resonators[i];

    if(rdata == null) continue;

    if(window.resonators[portalResonatorGuid(ent[0],i)]) continue;

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
    var r =  L.circleMarker(Rlatlng, {
        radius: 3,
        // #AAAAAA outline seems easier to see the fill opacity
        color: '#AAAAAA',
        opacity: 1,
        weight: 1,
        fillColor: COLORS_LVL[rdata.level],
        fillOpacity: rdata.energyTotal/RESO_NRG[rdata.level],
        clickable: false,
        level: rdata.level,
        details: rdata,
        pDetails: ent[2],
        guid: portalResonatorGuid(ent[0],i) });

    r.on('remove',   function() { delete window.resonators[this.options.guid]; });
    r.on('add',      function() { window.resonators[this.options.guid] = this; });

    r.addTo(portalsLayers[parseInt(portalLevel)]);
  }
}

// append portal guid with -resonator-[slot] to get guid for resonators
window.portalResonatorGuid = function(portalGuid, slot) {
  return portalGuid + '-resonator-' + slot;
}

window.isResonatorsShow = function() {
  return map.getZoom() >= RESONATOR_DISPLAY_ZOOM_LEVEL;
}

window.portalResetColor = function(portal) {
  portal.setStyle({color: portal.options.fillColor});
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
    smoothFactor: 10
  });

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

  // assume that fields never change. If they do, they will have a
  // different ID.
  if(findEntityInLeaflet(fieldsLayer, fields, ent[0])) return;

  var team = getTeam(ent[2]);
  var reg = ent[2].capturedRegion;
  var latlngs = [
    [reg.vertexA.location.latE6/1E6, reg.vertexA.location.lngE6/1E6],
    [reg.vertexB.location.latE6/1E6, reg.vertexB.location.lngE6/1E6],
    [reg.vertexC.location.latE6/1E6, reg.vertexC.location.lngE6/1E6]
  ];
  var poly = L.polygon(latlngs, {
    fillColor: COLORS[team],
    fillOpacity: 0.25,
    stroke: false,
    clickable: false,
    smoothFactor: 10,
    vertices: ent[2].capturedRegion,
    lastUpdate: ent[1],
    guid: ent[0]});

  if(!getPaddedBounds().intersects(poly.getBounds())) return;

  poly.on('remove', function() { delete window.fields[this.options.guid]; });
  poly.on('add',    function() {
    // enable for debugging
    if(window.fields[this.options.guid]) console.warn('duplicate field detected');
    window.fields[this.options.guid] = this;
    this.bringToBack();
  });
  poly.addTo(fieldsLayer);
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
