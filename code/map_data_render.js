// MAP DATA RENDER ////////////////////////////////////////////////
// class to handle rendering into leaflet the JSON data from the servers



window.Render = function() {
  // below this many portals displayed, we reorder the SVG at the end of the render pass to put portals above fields/links
  this.LOW_PORTAL_COUNT = 350;


}


// start a render pass. called as we start to make the batch of data requests to the servers
window.Render.prototype.startRenderPass = function(bounds) {
  this.isRendering = true;

  this.deletedGuid = {};  // object - represents the set of all deleted game entity GUIDs seen in a render pass

  this.seenPortalsGuid = {};
  this.seenLinksGuid = {};
  this.seenFieldsGuid = {};

  this.minPortalLevel = undefined;
  // clear all entities outside of the bounds
}

window.Render.prototype.clearPortalsBelowLevel = function(level) {
  if (this.minPortalLevel === undefined) {
    this.minPortalLevel = level;
    for (var guid in window.portals) {
      var p = portals[guid];
      if (parseInt(p.options.level) < level) {
        this.deletePortalEntity(guid);
      }
    }
  }
}


// process deleted entity list and entity data
window.Render.prototype.processTileData = function(tiledata) {
  this.processDeletedGameEntityGuids(tiledata.deletedGameEntityGuids||[]);
  this.processGameEntities(tiledata.gameEntities||[]);
}


window.Render.prototype.processDeletedGameEntityGuids = function(deleted) {
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

  // now reconstruct links 'optimised' out of the data from the portal link data

}

// end a render pass. does any cleaning up required, postponed processing of data, etc. called when the render
// is considered complete
window.Render.prototype.endRenderPass = function() {

  // check to see if there's eny entities we haven't seen. if so, delete them
  for (var guid in window.portals) {
    if (!(guid in this.seenPortalsGuid)) {
      this.deletePortalEntity(guid);
    }
  }
  for (var guid in window.links) {
    if (!(guid in this.seenLinksGuid)) {
      this.deleteLinkEntity(guid);
    }
  }
  for (var guid in window.fields) {
    if (!(guid in this.seenFieldsGuid)) {
      this.deleteFieldEntity(guid);
    }
  }

  // reorder portals to be after links/fields, but only if the number is low
  if (Object.keys(window.portals).length <= this.LOW_PORTAL_COUNT) {
    for (var i in window.portalsLayers) {
      var layer = window.portalsLayers[i];
      if (window.map.hasLayer(layer)) {
        layer.eachLayer (function(p) {
          p.bringToFront();
        });
      }
    }

  }

  this.isRendering = false;
}



window.Render.prototype.deleteEntity = function(guid) {
  this.deletePortalEntity(guid);
  this.deleteLinkEntity(guid);
  this.deleteFieldEntity(guid);
}

window.Render.prototype.deletePortalEntity = function(guid) {
  if (guid in window.portals) {
    var p = window.portals[guid];
    for(var i in portalsLayers) {
      portalsLayers[i].removeLayer(p);
    }
    delete window.portals[guid];
  }
}

window.Render.prototype.deleteLinkEntity = function(guid) {
  if (guid in window.links) {
    var l = window.links[guid];
    linksLayer.removeLayer(l);
    delete window.links[guid];
  }
}

window.Render.prototype.deleteFieldEntity = function(guid) {
  if (guid in window.fields) {
    var f = window.fields[guid];
    fieldsLayer.removeLayer(f);
    delete window.fields[guid];
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
  this.seenPortalsGuid[ent[0]] = true;  // flag we've seen it

  // check if entity already exists
  if (ent[0] in window.portals) {
    // yes. now check to see if the entity data we have is newer than that in place
    var p = window.portals[ent[0]];

    if (p.options.timestamp >= ent[1]) return; // this data is identical or older - abort processing

    // the data we have is newer. many data changes require re-rendering of the portal
    // (e.g. level changed, so size is different, or stats changed so highlighter is different)
    // so to keep things simple we'll always re-create the entity in this case

    this.deletePortalEntity(ent[0]);
  }

  var portalLevel = getPortalLevel(ent[2]);
  var team = getTeam(ent[2]);

  var latlng = L.latLng(ent[2].locationE6.latE6/1E6, ent[2].locationE6.lngE6/1E6);

//TODO: move marker creation, style setting, etc into a separate class
//(as it's called from elsewhere - e.g. selecting/deselecting portals)

//ALSO: change API for highlighters - make them return the updated style rather than directly calling setStyle on the portal marker
//(can this be done in a backwardly-compatable way??)

  var dataOptions = {
    level: portalLevel,
    team: team,
    ent: ent,  // LEGACY - TO BE REMOVED AT SOME POINT! use .guid, .timestamp and .details instead
    guid: ent[0],
    timestamp: ent[1],
    details: ent[2]
  };

  var marker = createMarker(latlng, dataOptions);

  marker.on('click', function() { window.renderPortalDetails(ent[0]); });
  marker.on('dblclick', function() { window.renderPortalDetails(ent[0]); window.map.setView(latlng, 17); });

  // handle highlighting of the selected portal
  if (ent[0] === selectedPortal) {
    setMarkerStyle (marker, true);
  }


  window.runHooks('portalAdded', {portal: marker});

  window.portals[ent[0]] = marker;

  //TODO? postpone adding to the map layer
  portalsLayers[parseInt(portalLevel)].addLayer(marker);

}


window.Render.prototype.createFieldEntity = function(ent) {
  this.seenFieldsGuid[ent[0]] = true;  // flag we've seen it

  // check if entity already exists
  if(ent[0] in window.fields) {
    // yes. in theory, we should never get updated data for an existing field. they're created, and they're destroyed - never changed
    // but theory and practice may not be the same thing...
    var f = window.fields[ent[0]];

    if (f.options.timestamp >= ent[1]) return; // this data is identical (or order) than that rendered - abort processing

    // the data we have is newer - two options
    // 1. just update the data, assume the field render appearance is unmodified
    // 2. delete the entity, then re-create with the new data
    this.deleteFieldEntity(ent[0]); // option 2, for now
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
  this.seenLinksGuid[ent[0]] = true;  // flag we've seen it

  // check if entity already exists
  if (ent[0] in window.links) {
    // yes. now, as sometimes links are 'faked', they have incomplete data. if the data we have is better, replace the data
    var l = window.links[ent[0]];

    // the faked data will have older timestamps than real data (currently, faked set to zero)
    if (l.options.timestamp >= ent[1]) return; // this data is older or identical to the rendered data - abort processing

    // the data is newer/better - two options
    // 1. just update the data. assume the link render appearance is unmodified
    // 2. delete the entity, then re-create it with the new data
    this.deleteLinkEntity(ent[0]); // option 2 - for now
  }

  var team = getTeam(ent[2]);
  var edge = ent[2].edge;
  var latlngs = [
    L.latLng(edge.originPortalLocation.latE6/1E6, edge.originPortalLocation.lngE6/1E6),
    L.latLng(edge.destinationPortalLocation.latE6/1E6, edge.destinationPortalLocation.lngE6/1E6)
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
