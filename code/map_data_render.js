// MAP DATA RENDER ////////////////////////////////////////////////
// class to handle rendering into leaflet the JSON data from the servers



window.Render = function() {

  // when there are lots of portals close together, we only add some of them to the map
  // the idea is to keep the impression of the dense set of portals, without rendering them all
  this.CLUSTER_SIZE = L.Browser.mobile ? 16 : 8;  // the map is divided into squares of this size in pixels for clustering purposes. mobile uses larger markers, so therefore larger clustering areas
  this.CLUSTER_PORTAL_LIMIT = 4; // no more than this many portals are drawn in each cluster square

  // link length, in pixels, to be visible. use the portal cluster size, as shorter than this is likely hidden
  // under the portals
  this.LINK_VISIBLE_PIXEL_LENGTH = this.CLUSTER_SIZE;

  this.portalMarkerScale = undefined;
}


// start a render pass. called as we start to make the batch of data requests to the servers
window.Render.prototype.startRenderPass = function(level,bounds) {
  this.isRendering = true;

  this.deletedGuid = {};  // object - represents the set of all deleted game entity GUIDs seen in a render pass

  this.seenPortalsGuid = {};
  this.seenLinksGuid = {};
  this.seenFieldsGuid = {};

  this.bounds = bounds;

  this.clearPortalsBelowLevel(level);

  this.resetPortalClusters();
  this.resetLinkVisibility();

  this.rescalePortalMarkers();

}

window.Render.prototype.clearPortalsBelowLevel = function(level) {
  var count = 0;
  for (var guid in window.portals) {
    var p = portals[guid];
    // clear portals below specified level - unless it's the selected portal, or it's relevant to artifacts
    if (parseInt(p.options.level) < level && guid !== selectedPortal && !artifact.isInterestingPortal(guid) && !ornaments.isInterestingPortal(p)) {
      this.deletePortalEntity(guid);
      count++;
    }
  }
  console.log('Render: deleted '+count+' portals by level');
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

      if (guid == selectedPortal) {
        // the rare case of the selected portal being deleted. clear the details tab and deselect it
        renderPortalDetails(null);
      }

      this.deleteEntity(guid);

    }
  }

}

window.Render.prototype.processGameEntities = function(entities) {

  // we loop through the entities three times - for fields, links and portals separately
  // this is a reasonably efficient work-around for leafletjs limitations on svg render order


  for (var i in entities) {
    var ent = entities[i];

    if (ent[2].type == 'region' && !(ent[0] in this.deletedGuid)) {
      this.createFieldEntity(ent);
    }
  }

  for (var i in entities) {
    var ent = entities[i];

    if (ent[2].type == 'edge' && !(ent[0] in this.deletedGuid)) {
      this.createLinkEntity(ent);
    }
  }

  for (var i in entities) {
    var ent = entities[i];

    if (ent[2].type == 'portal' && !(ent[0] in this.deletedGuid)) {
      this.createPortalEntity(ent);
    }
  }



}


// end a render pass. does any cleaning up required, postponed processing of data, etc. called when the render
// is considered complete
window.Render.prototype.endRenderPass = function() {

  // check to see if there are any entities we haven't seen. if so, delete them
  for (var guid in window.portals) {
    // special case for selected portal - it's kept even if not seen
    // artifact (e.g. jarvis shard) portals are also kept - but they're always 'seen'
    if (!(guid in this.seenPortalsGuid) && guid !== selectedPortal) {
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

  // reorder portals to be after links/fields
  this.bringPortalsToFront();

  this.isRendering = false;

  // re-select the selected portal, to re-render the side-bar. ensures that any data calculated from the map data is up to date
  if (selectedPortal) {
    renderPortalDetails (selectedPortal);
  }
}

window.Render.prototype.bringPortalsToFront = function() {
  for (var lvl in portalsFactionLayers) {
    // portals are stored in separate layers per faction
    // to avoid giving weight to one faction or another, we'll push portals to front based on GUID order
    var lvlPortals = {};
    for (var fac in portalsFactionLayers[lvl]) {
      var layer = portalsFactionLayers[lvl][fac];
      if (layer._map) {
        layer.eachLayer (function(p) {
          lvlPortals[p.options.guid] = p;
        });
      }
    }

    var guids = Object.keys(lvlPortals);
    guids.sort();

    for (var j in guids) {
      var guid = guids[j];
      lvlPortals[guid].bringToFront();
    }
  }

  // artifact portals are always brought to the front, above all others
  $.each(artifact.getInterestingPortals(), function(i,guid) {
    if (portals[guid] && portals[guid]._map) {
      portals[guid].bringToFront();
    }
  });

}


window.Render.prototype.deleteEntity = function(guid) {
  this.deletePortalEntity(guid);
  this.deleteLinkEntity(guid);
  this.deleteFieldEntity(guid);
}

window.Render.prototype.deletePortalEntity = function(guid) {
  if (guid in window.portals) {
    var p = window.portals[guid];
    this.removePortalFromMapLayer(p);
    delete window.portals[guid];
  }
}

window.Render.prototype.deleteLinkEntity = function(guid) {
  if (guid in window.links) {
    var l = window.links[guid];
    if (linksFactionLayers[l.options.team].hasLayer(l)) {
      linksFactionLayers[l.options.team].removeLayer(l);
    }
    delete window.links[guid];
  }
}


window.Render.prototype.deleteFieldEntity = function(guid) {
  if (guid in window.fields) {
    var f = window.fields[guid];
    var fd = f.options.details;

    fieldsFactionLayers[f.options.team].removeLayer(f);
    delete window.fields[guid];
  }
}




window.Render.prototype.createPortalEntity = function(ent) {
  this.seenPortalsGuid[ent[0]] = true;  // flag we've seen it

  var previousData = undefined;

  // check if entity already exists
  if (ent[0] in window.portals) {
    // yes. now check to see if the entity data we have is newer than that in place
    var p = window.portals[ent[0]];

    if (p.options.timestamp >= ent[1]) return; // this data is identical or older - abort processing

    // the data we have is newer. many data changes require re-rendering of the portal
    // (e.g. level changed, so size is different, or stats changed so highlighter is different)
    // so to keep things simple we'll always re-create the entity in this case

    // remember the old details, for the callback

    previousData = p.options.data;

    this.deletePortalEntity(ent[0]);
  }

  var portalLevel = parseInt(ent[2].level);
  var team = teamStringToId(ent[2].team);
  // the data returns unclaimed portals as level 1 - but IITC wants them treated as level 0
  if (team == TEAM_NONE) portalLevel = 0;

  var latlng = L.latLng(ent[2].latE6/1E6, ent[2].lngE6/1E6);

  var dataOptions = {
    level: portalLevel,
    team: team,
    ent: ent,  // LEGACY - TO BE REMOVED AT SOME POINT! use .guid, .timestamp and .details instead
    guid: ent[0],
    timestamp: ent[1],
    data: ent[2]
  };

  window.pushPortalGuidPositionCache(ent[0], ent[2].latE6, ent[2].lngE6);

  var marker = createMarker(latlng, dataOptions);

  marker.on('click', function() { window.renderPortalDetails(ent[0]); });
  marker.on('dblclick', function() { window.renderPortalDetails(ent[0]); window.map.setView(latlng, 17); });


  window.runHooks('portalAdded', {portal: marker, previousData: previousData});

  window.portals[ent[0]] = marker;

  // check for URL links to portal, and select it if this is the one
  if (urlPortalLL && urlPortalLL[0] == marker.getLatLng().lat && urlPortalLL[1] == marker.getLatLng().lng) {
    // URL-passed portal found via pll parameter - set the guid-based parameter
    console.log('urlPortalLL '+urlPortalLL[0]+','+urlPortalLL[1]+' matches portal GUID '+ent[0]);

    urlPortal = ent[0];
    urlPortalLL = undefined;  // clear the URL parameter so it's not matched again
  }
  if (urlPortal == ent[0]) {
    // URL-passed portal found via guid parameter - set it as the selected portal
    console.log('urlPortal GUID '+urlPortal+' found - selecting...');
    selectedPortal = ent[0];
    urlPortal = undefined;  // clear the URL parameter so it's not matched again
  }

  // (re-)select the portal, to refresh the sidebar on any changes
  if (ent[0] == selectedPortal) {
    console.log('portal guid '+ent[0]+' is the selected portal - re-rendering portal details');
    renderPortalDetails (selectedPortal);
  }

  //TODO? postpone adding to the map layer
  this.addPortalToMapLayer(marker);

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

  var team = teamStringToId(ent[2].team);
  var latlngs = [
    L.latLng(ent[2].points[0].latE6/1E6, ent[2].points[0].lngE6/1E6),
    L.latLng(ent[2].points[1].latE6/1E6, ent[2].points[1].lngE6/1E6),
    L.latLng(ent[2].points[2].latE6/1E6, ent[2].points[2].lngE6/1E6)
  ];

  var poly = L.geodesicPolygon(latlngs, {
    fillColor: COLORS[team],
    fillOpacity: 0.25,
    stroke: false,
    clickable: false,

    team: team,
    guid: ent[0],
    timestamp: ent[1],
    data: ent[2],
  });

  runHooks('fieldAdded',{field: poly});

  window.fields[ent[0]] = poly;

  // TODO? postpone adding to the layer??
  fieldsFactionLayers[poly.options.team].addLayer(poly);
}

window.Render.prototype.createLinkEntity = function(ent,faked) {
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

  var team = teamStringToId(ent[2].team);
  var latlngs = [
    L.latLng(ent[2].oLatE6/1E6, ent[2].oLngE6/1E6),
    L.latLng(ent[2].dLatE6/1E6, ent[2].dLngE6/1E6)
  ];
  var poly = L.geodesicPolyline(latlngs, {
    color: COLORS[team],
    opacity: 1,
    weight: faked ? 1 : 2,
    clickable: false,

    team: team,
    guid: ent[0],
    timestamp: ent[1],
    data: ent[2]
  });

  runHooks('linkAdded', {link: poly});

  window.links[ent[0]] = poly;

  // only add the link to the layer if it's long enough to be seen
  if (this.linkVisible(poly)) {
    linksFactionLayers[poly.options.team].addLayer(poly);
  }
}



window.Render.prototype.rescalePortalMarkers = function() {
  if (this.portalMarkerScale === undefined || this.portalMarkerScale != portalMarkerScale()) {
    this.portalMarkerScale = portalMarkerScale();

    console.log('Render: map zoom '+map.getZoom()+' changes portal scale to '+portalMarkerScale()+' - redrawing all portals');

    //NOTE: we're not calling this because it resets highlights - we're calling it as it
    // resets the style (inc size) of all portal markers, applying the new scale
    resetHighlightedPortals();
  }
}



// portal clustering functionality

window.Render.prototype.resetPortalClusters = function() {

  this.portalClusters = {};

  // first, place the portals into the clusters
  for (var pguid in window.portals) {
    var p = window.portals[pguid];
    var cid = this.getPortalClusterID(p);

    if (!(cid in this.portalClusters)) this.portalClusters[cid] = [];

    this.portalClusters[cid].push(pguid);
  }

  // now, for each cluster, sort by some arbitrary data (the level+guid will do), and display the first CLUSTER_PORTAL_LIMIT
  for (var cid in this.portalClusters) {
    var c = this.portalClusters[cid];

    c.sort(function(a,b) {
      var ka = (8-portals[a].options.level)+a;
      var kb = (8-portals[b].options.level)+b;
      if (ka<kb) return -1;
      else if (ka>kb) return 1;
      else return 0;
    });

    for (var i=0; i<c.length; i++) {
      var guid = c[i];
      var p = window.portals[guid];
      var layerGroup = portalsFactionLayers[parseInt(p.options.level)][p.options.team];
      if ((i<this.CLUSTER_PORTAL_LIMIT || p.options.guid == selectedPortal || artifact.isInterestingPortal(p.options.guid) || ornaments.isInterestingPortal(p)) && this.bounds.contains(p.getLatLng())) {
        if (!layerGroup.hasLayer(p)) {
          layerGroup.addLayer(p);
        }
      } else {
        if (layerGroup.hasLayer(p)) {
          layerGroup.removeLayer(p);
        }
      }
    }
  }

}

// add the portal to the visible map layer unless we pass the cluster limits
window.Render.prototype.addPortalToMapLayer = function(portal) {

  var cid = this.getPortalClusterID(portal);

  if (!(cid in this.portalClusters)) this.portalClusters[cid] = [];

  this.portalClusters[cid].push(portal.options.guid);

  window.ornaments.addPortal(portal);

  // now, at this point, we could match the above re-cluster code - sorting, and adding/removing as necessary
  // however, it won't make a lot of visible difference compared to just pushing to the end of the list, then
  // adding to the visible layer if the list is below the limit
  if(this.portalClusters[cid].length < this.CLUSTER_PORTAL_LIMIT
  || portal.options.guid == selectedPortal
  || artifact.isInterestingPortal(portal.options.guid)
  || ornaments.isInterestingPortal(portal)) {
    if (this.bounds.contains(portal.getLatLng())) {
      portalsFactionLayers[parseInt(portal.options.level)][portal.options.team].addLayer(portal);
    }
  }
}

window.Render.prototype.removePortalFromMapLayer = function(portal) {

  //remove it from the portalsLevels layer
  portalsFactionLayers[parseInt(portal.options.level)][portal.options.team].removeLayer(portal);

  window.ornaments.removePortal(portal);

  // and ensure there's no mention of the portal in the cluster list
  var cid = this.getPortalClusterID(portal);

  if (cid in this.portalClusters) {
    var index = this.portalClusters[cid].indexOf(portal.options.guid);
    if (index >= 0) {
      this.portalClusters[cid].splice(index,1);
      // FIXME? if this portal was in on the screen (in the first 10), and we still have 10+ portals, add the new 10th to the screen?
    }
  }
}

window.Render.prototype.getPortalClusterID = function(portal) {
  // project the lat/lng into absolute map pixels
  var z = map.getZoom();

  var point = map.project(portal.getLatLng(), z);

  var clusterpoint = point.divideBy(this.CLUSTER_SIZE).round();

  return z+":"+clusterpoint.x+":"+clusterpoint.y;
}



window.Render.prototype.linkVisible = function(link) {

  if (!this.bounds.intersects(link.getBounds())) {
    return false;
  }

  var lengthSquared = this.getLinkPixelLengthSquared (link);

  return lengthSquared >= this.LINK_VISIBLE_PIXEL_LENGTH*this.LINK_VISIBLE_PIXEL_LENGTH;
}


window.Render.prototype.resetLinkVisibility = function() {

  for (var guid in window.links) {
    var link = window.links[guid];

    var visible = this.linkVisible(link);

    if (visible) {
      if (!linksFactionLayers[link.options.team].hasLayer(link)) linksFactionLayers[link.options.team].addLayer(link);
    } else {
      if (linksFactionLayers[link.options.team].hasLayer(link)) linksFactionLayers[link.options.team].removeLayer(link);
    }
  }
}


window.Render.prototype.getLinkPixelLengthSquared = function(link) {
  var z = map.getZoom();

  var latLngs = link.getLatLngs();
  if (latLngs.length != 2) {
    console.warn ('Link had '+latLngs.length+' points - expected 2!');
    return undefined;
  }

  var point0 = map.project(latLngs[0]);
  var point1 = map.project(latLngs[1]);

  var dx = point0.x - point1.x;
  var dy = point0.y - point1.y;

  var lengthSquared = (dx*dx)+(dy*dy);

  return lengthSquared;
}
