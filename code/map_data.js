
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
  $.each(m, function(qk, val) {
    $.each(val.deletedGameEntityGuids, function(ind, guid) {
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
      } else if(ent[2].edge !== undefined)
        renderLink(ent);
      else if(ent[2].capturedRegion !== undefined)
        renderField(ent);
      else
        throw('Unknown entity: ' + JSON.stringify(ent));
    });
  });

  $.each(ppp, function(ind, portal) { renderPortal(portal); });
  if(portals[selectedPortal]) portals[selectedPortal].bringToFront();

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
    portalsLayers[i].eachLayer(function(portal) {
      // portal must be in bounds and have a high enough level. Also don’t
      // remove if it is selected.
      if(portal.options.guid == window.selectedPortal ||
        (b.contains(portal.getLatLng()) && i >= minlvl)) return;
      cnt[0]++;
      portalsLayers[i].removeLayer(portal);
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
  // portals end in “.11” or “.12“, links in “.9", fields in “.b”
  // .11 == portals
  // .12 == portals
  // .9  == links
  // .b  == fields
  // .c  == player/creator
  // .d  == chat messages
  switch(guid.slice(33)) {
    case '11':
    case '12':
      if(!window.portals[guid]) return;
      var p = window.portals[guid];
      for(var i = 0; i < portalsLayers.length; i++)
        portalsLayers[i].removeLayer(p);
      break;
    case '9':
      if(!window.links[guid]) return;
      linksLayer.removeLayer(window.links[guid]);
      break;
    case 'b':
      if(!window.fields[guid]) return;
      fieldsLayer.removeLayer(window.fields[guid]);
      break;
    default:
      console.warn('unknown GUID type: ' + guid);
      //window.debug.printStackTrace();
  }
}



// renders a portal on the map from the given entity
window.renderPortal = function(ent) {
  removeByGuid(ent[0]);

  if(Object.keys(portals).length >= MAX_DRAWN_PORTALS && ent[0] != selectedPortal)
    return;

  var latlng = [ent[2].locationE6.latE6/1E6, ent[2].locationE6.lngE6/1E6];
  // needs to be checked before, so the portal isn’t added to the
  // details list and other places
  //if(!getPaddedBounds().contains(latlng)) return;

  // hide low level portals on low zooms
  var portalLevel = getPortalLevel(ent[2]);
  if(portalLevel < getMinPortalLevel()  && ent[0] != selectedPortal) return;

  // pre-load player names for high zoom levels
  if(map.getZoom() >= PRECACHE_PLAYER_NAMES_ZOOM) {
    if(ent[2].captured && ent[2].captured.capturingPlayerId)
      getPlayerName(ent[2].captured.capturingPlayerId);
    if(ent[2].resonatorArray && ent[2].resonatorArray.resonators)
      $.each(ent[2].resonatorArray.resonators, function(ind, reso) {
        if(reso) getPlayerName(reso.ownerGuid);
      });
  }

  var team = getTeam(ent[2]);

  var p = L.circleMarker(latlng, {
    radius: 7,
    color: ent[0] == selectedPortal ? COLOR_SELECTED_PORTAL : COLORS[team],
    opacity: 1,
    weight: 3,
    fillColor: COLORS[team],
    fillOpacity: 0.5,
    clickable: true,
    level: portalLevel,
    details: ent[2],
    guid: ent[0]});

  p.on('remove',   function() { delete window.portals[this.options.guid]; });
  p.on('add',      function() {
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
  // portalLevel contains a float, need to round down
  p.addTo(portalsLayers[parseInt(portalLevel)]);
}

window.portalResetColor = function(portal) {
  portal.setStyle({color: portal.options.fillColor});
}

// renders a link on the map from the given entity
window.renderLink = function(ent) {
  removeByGuid(ent[0]);
  if(Object.keys(links).length >= MAX_DRAWN_LINKS) return;

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
  poly.on('add',    function() { window.links[this.options.guid] = this; });
  poly.addTo(linksLayer).bringToBack();
}

// renders a field on the map from a given entity
window.renderField = function(ent) {
  window.removeByGuid(ent[0]);
  if(Object.keys(fields).length >= MAX_DRAWN_FIELDS) return;

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
    guid: ent[0]});

  if(!getPaddedBounds().intersects(poly.getBounds())) return;

  poly.on('remove', function() { delete window.fields[this.options.guid]; });
  poly.on('add',    function() { window.fields[this.options.guid] = this; });
  poly.addTo(fieldsLayer).bringToBack();
}
