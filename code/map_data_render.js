// MAP DATA RENDER ////////////////////////////////////////////////
// class to handle rendering into leaflet the JSON data from the servers



window.Render = function() {

}


// start a render pass. called as we start to make the batch of data requests to the servers
window.Render.prototype.startRenderPass = function() {
  this.isRendering = true;

  this.deletedGuid = {};  // object - represents the set of all deleted game entity GUIDs seen in a render pass
}

// process deleted entity list and entity data
window.Render.prototype.processTileData = function(deleted, entities) {
  this.processDeletedGameEntityGuids(deleted);
  this.processGameEntities(entities);
}


window.Render.prototype.processDeletedGamEntityGuids = function(deleted) {
  for(var i in deleted) {
    var guid = deleted[i];

    if ( !(guid in this.deletedGuid) ) {
      this.deletedGuid[guid] = true;  // flag this guid as having being processed

      // the original code this is based on checked to see if the guid was for a field - and if so, removed it from the linkedFields of the relevant portals
      // given that the server will also return updated portals - and the linkedFields data is not actively used in IITC, this seems pointless.

      this.deleteEntity(guid);

    }
  }

}

window.Render.prototype.processGameEntities = function(entities) {
  for (var i in entities) {
    var ent = entities[i];

    // don't create entities in the 'deleted' list
    if (!(ent[0] in this.deletedGuid)) {
      this.createEntity(ent);
    }
  }

  // TODO: reconstruct links 'optimised' out of the data from the portal link data


}

// end a render pass. does any cleaning up required, postponed processing of data, etc. called when the render
// is considered complete
window.Render.prototype.endRenderPass = function() {

  this.isRendering = false;
}



window.Render.prototype.deleteEntity = function(guid) {

  if (guid in window.portals) {
    var p = window.portals[guid];
    for(var i in portalsLayers) {
      portalsLayers[i].removeLayer(p);
    }
    delete window.portals[guid];
  } else if (guid in window.links) {
    var l = window.links[guid];
    linksLayer.removeLayer(l);
    delete window.links[guid];
  } else if (guid in window.fields) {
    var f = window.fields[guid];
    fieldsLayer.removeLayer[guid];
    delete window.fields[f];
  }

}


window.Render.prototype.createEntity = function(ent) {

  // ent[0] == guid
  // ent[1] == mtime
  // ent[2] == data


  // logic on detecting entity type based on the stock site javascript.
  if ("portalV2" in ent[2]) {
    this.createPortalEntity(ent);
  } else if ("capturedRegion" in ent[2]) {
    this.createFieldEntity(ent);
  } else if ("edge" in ent[2]) {
    this.createLinkEntity(ent);
  } else {
    console.warn("Unknown entity found: "+JSON.stringify(ent));
  }

}


window.Render.prototype.createPortalEntity = function(ent) {
  // check if entity already exists
  if (ent[0] in window.portals) {
    // yes. now check to see if the entity data we have is newer than that in place
    var p = window.portals[ent[0]];

    if (p.options.timestamp >= ent[1]) return; // this data is identical or older - abort processing

    // the data we have is newer. many data changes require re-rendering of the portal
    // (e.g. level changed, so size is different, or stats changed so highlighter is different)
    // so to keep things simple we'll always re-create the entity in this case

    deleteEntity(ent[0]);
  }

  var portalLevel = getPortalLevel(ent[2]);
  var team = getTeam(ent[2]);

  var latlng = L.latlng(ent[2].locationE6.latE6/1E6, ent[2].locationE6.lngE6/1E6);

  var marker = this.createMarker(ent, portalLevel, latlng, team);


  window.runHooks('portalAdded', {portal: marker});

  window.portals[ent[0]] = marker;

  //TODO? postpone adding to the map layer
  portalsLayers[parseInt(portalLevel)].addLayer(marker);

}

window.Render.prototype.createMarker = function(ent, portalLevel, latlng, team) {

  var options = this.portalPolyOptions (ent, portalLevel, team);

  var marker = L.circleMarker (latlng, options);

  return marker;
}

window.Render.prototype.portalPolyOptions = function(ent, portalLevel, team) {
  var lvWeight = Math.max(2, Math.floor(portalLevel) / 1.5);
  var lvRadius = team === window.TEAM_NONE ? 7 : Math.floor(portalLevel) + 4;

  var options = {
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
    guid: ent[0],
    timestamp: ent[1],
    details: ent[2],
    ent: ent // LEGACY - TO BE REMOVED AT SOME POINT! use .guid, .timestamp and .details instead
  };

  return options;
}


window.Render.prototype.createFieldEntity = function(ent) {
  // check if entity already exists
  if(ent[0] in window.fields) {
    // yes. in theory, we should never get updated data for an existing field. they're created, and they're destroyed - never changed
    // but theory and practice may not be the same thing...
    var f = window.fields[ent[0]];

    if (f.options.timestamp >= ent[1]) return; // this data is identical (or order) than that rendered - abort processing

    // the data we have is newer - two options
    // 1. just update the data, assume the field render appearance is unmodified
    // 2. delete the entity, then re-create with the new data
    deleteEntity(ent[0]); // option 2, for now
  }

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
    guid: ent[0],
    timestamp: ent[1],
    details: ent[2]
  });


  window.fields[ent[0]] = poly;

  // TODO? postpone adding to the layer??
  fieldsLayer.addLayer(poly);
}

window.Render.prototype.createLinkEntity = function(ent) {
  // check if entity already exists
  if (ent[0] in window.links) {
    // yes. now, as sometimes links are 'faked', they have incomplete data. if the data we have is better, replace the data
    var l = window.links[ent[0]];

    // the faked data will have older timestamps than real data (currently, faked set to zero)
    if (l.options.timestamp >= ent[1]) return; // this data is older or identical to the rendered data - abort processing

    // the data is newer/better - two options
    // 1. just update the data. assume the link render appearance is unmodified
    // 2. delete the entity, then re-create it with the new data
    deleteEntity(ent[0]); // option 2 - for now
  }

  var team = getTeam(ent[2]);
  var edge = ent[2].edge;
  var latlngs = [
    L.latlng(edge.originPortalLocation.latE6/1E6, edge.originPortalLocation.lngE6/1E6),
    L.latlng(edge.destinationPortalLocation.latE6/1E6, edge.destinationPortalLocation.lngE6/1E6)
  ];
  var poly = L.geodesicPolyline(latlngs, {
    color: COLORS[team],
    opacity: 1,
    weight: 2,
    clickable: false,
    guid: ent[0],
    timestamp: ent[1],
    details: ent[2]
  });

  window.links[ent[0]] = poly;

  // TODO? postpone adding to the layer??
  linksLayer.addLayer(poly);
}
