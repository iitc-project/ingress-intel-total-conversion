// MAP DATA RENDER ////////////////////////////////////////////////
// class to handle rendering into leaflet the JSON data from the servers



window.Render = function() {
  // below this many portals displayed, we reorder the SVG at the end of the render pass to put portals above fields/links
  this.LOW_PORTAL_COUNT = 350;


}


// start a render pass. called as we start to make the batch of data requests to the servers
window.Render.prototype.startRenderPass = function() {
  this.isRendering = true;

  this.deletedGuid = {};  // object - represents the set of all deleted game entity GUIDs seen in a render pass

  this.seenPortalsGuid = {};
  this.seenLinksGuid = {};
  this.seenFieldsGuid = {};
}

window.Render.prototype.clearPortalsBelowLevel = function(level) {
  var count = 0;
  for (var guid in window.portals) {
    var p = portals[guid];
    if (parseInt(p.options.level) < level && guid !== selectedPortal) {
      this.deletePortalEntity(guid);
      count++;
    }
  }
  console.log('Render: deleted '+count+' portals by level');
}

window.Render.prototype.clearEntitiesOutsideBounds = function(bounds) {
  var pcount=0, lcount=0, fcount=0;

  for (var guid in window.portals) {
    var p = portals[guid];
    if (!bounds.contains (p.getLatLng()) && guid !== selectedPortal) {
      this.deletePortalEntity(guid);
      pcount++;
    }
  }

  for (var guid in window.links) {
    var l = links[guid];
    if (!bounds.intersects (l.getBounds())) {
      this.deleteLinkEntity(guid);
      lcount++;
    }
  }

  for (var guid in window.fields) {
    var f = fields[guid];
    if (!bounds.intersects (f.getBounds())) {
      this.deleteFieldEntity(guid);
      fcount++;
    }
  }
  console.log('Render: deleted '+pcount+' portals, '+lcount+' links, '+fcount+' fields by bounds check');
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
  var portalGuids = [];

  for (var i in entities) {
    var ent = entities[i];

    // don't create entities in the 'deleted' list
    if (!(ent[0] in this.deletedGuid)) {
      this.createEntity(ent);
      if ('portalV2' in ent[2]) portalGuids.push(ent[0]);
    }
  }

  // now reconstruct links 'optimised' out of the data from the portal link data
  this.createLinksFromPortalData(portalGuids);
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


  window.runHooks('portalAdded', {portal: marker});

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
    details: ent[2],
    // LEGACY FIELDS: these duplicate data available via .details, as IITC previously stored it in data and vertices
    data: ent[2],
    vertices: ent[2].capturedRegion
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
    details: ent[2],
    // LEGACY FIELDS: these duplicate data available via .details, as IITC previously stored it in data and vertices
    data: ent[2]
  });

  window.links[ent[0]] = poly;

  // TODO? postpone adding to the layer??
  linksLayer.addLayer(poly);
}


window.Render.prototype.createLinksFromPortalData = function(portalGuids) {

  for (var portalGuidIndex in portalGuids) {
    var portalGuid = portalGuids[portalGuidIndex];
    var sourcePortal = portals[portalGuid];

    for (var sourceLinkIndex in sourcePortal.options.details.portalV2.linkedEdges||[]) {
      var sourcePortalLinkInfo = sourcePortal.options.details.portalV2.linkedEdges[sourceLinkIndex];

      // portals often contain details for edges that don't exist. so only consider faking an edge if this
      // is the origin portal, the link doesn't already exist...
      if (sourcePortalLinkInfo.isOrigin && !(sourcePortalLinkInfo.edgeGuid in links)) {

        // ... and the other porta has matching link information. 
        if (portalGuids.indexOf(sourcePortalLinkInfo.otherPortalGuid) != -1 &&
            sourcePortalLinkInfo.otherPortalGuid in portals) {

          var targetPortal = portals[sourcePortalLinkInfo.otherPortalGuid];

          for (var targetLinkIndex in targetPortal.options.details.portalV2.linkedEdges||[]) {
            var targetPortalLinkInfo = targetPortal.options.details.portalV2.linkedEdges[targetLinkIndex];

            if (targetPortalLinkInfo.edgeGuid == sourcePortalLinkInfo.edgeGuid) {
              // yes - edge in both portals. create it

              var fakeEnt = [
                sourcePortalLinkInfo.edgeGuid,
                0,  // mtime for entity data - unknown when faking it, so zero will be the oldest possible
                {
                  controllingTeam: sourcePortal.options.details.controllingTeam,
                  edge: {
                    originPortalGuid: portalGuid,
                    originPortalLocation: sourcePortal.options.details.locationE6,
                    destinationPortalGuid: sourcePortalLinkInfo.otherPortalGuid,
                    destinationPortalLocation: targetPortal.options.details.locationE6
                  }
                }
              ];

              this.createLinkEntity(fakeEnt);


            }

          }

        }
        
      }

    }
  }
}



/*-------------for res desplay-----------------------------*/

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


window.isSameResonator = function(oldRes, newRes) {
  if(!oldRes && !newRes) return true;
  if(!oldRes || !newRes) return false;
  if(typeof oldRes !== typeof newRes) return false;
  if(oldRes.level !== newRes.level) return false;
  if(oldRes.energyTotal !== newRes.energyTotal) return false;
  if(oldRes.distanceToPortal !== newRes.distanceToPortal) return false;
  return true;
}
// append portal guid with -resonator-[slot] to get guid for resonators
window.portalResonatorGuid = function(portalGuid, slot) {
  return portalGuid + '-resonator-' + slot;
}
window.isResonatorsShow = function() {
  return map.getZoom() >= RESONATOR_DISPLAY_ZOOM_LEVEL;
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


var isResShow = false;
window.addHook("iitcLoaded",function(){
  isResShow = isResonatorsShow();
});
window.addHook("portalAdded",function(data){
  var dataOptions = data.portal.options;
  window.renderResonators(dataOptions.guid, dataOptions.details, portalsLayers[dataOptions.level]);
});
window.addHook("zoomend",function(){
  // remove all resonators if zoom out to < RESONATOR_DISPLAY_ZOOM_LEVEL
  if(isResonatorsShow()) {
      
    if(!isResShow){
      for(var guid in window.portals){
        var dataOptions = window.portals[guid].options;
        window.renderResonators(dataOptions.guid, dataOptions.details, portalsLayers[dataOptions.level]);
      }
      isResShow = true;
    }
    return;
  }

  for(var i = 1; i < portalsLayers.length; i++) {
    portalsLayers[i].eachLayer(function(item) {
      var itemGuid = item.options.guid;
      // check if 'item' is a resonator
      if(getTypeByGuid(itemGuid) != TYPE_RESONATOR) return true;
      portalsLayers[i].removeLayer(item);
    });
  }
  isResShow = false;

  console.log('Remove all resonators');
});
