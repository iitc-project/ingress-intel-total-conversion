// ARTIFACT ///////////////////////////////////////////////////////

// added as part of the ingress #13magnus in november 2013, artifacts
// are additional game elements overlayed on the intel map
// currently there are only jarvis-related entities
// - shards: move between portals (along links) each hour. more than one can be at a portal
// - targets: specific portals - one per team
// the artifact data includes details for the specific portals, so can be useful


window.artifact = function() {}

window.artifact.setup = function() {
  artifact.REFRESH_SUCCESS = 15*60;  // 15 minutes on success
  artifact.REFRESH_FAILURE = 2*60;  // 2 minute retry on failure

  artifact.idle = false;
  artifact.clearData();

  addResumeFunction(artifact.idleResume);

  artifact.requestData();

  artifact._layer = new L.LayerGroup();
  addLayerGroup ('Artifacts (Jarvis shards)', artifact._layer, true);
}

window.artifact.requestData = function() {
  if (isIdle()) {
    artifact.idle = true;
  } else {
    window.postAjax('getArtifactInfo', {}, artifact.handleSuccess, artifact.handleError);
  }
}

window.artifact.idleResume = function() {
  if (artifact.idle) {
    artifact.idle = false;
    artifact.requestData();
  }
}

window.artifact.handleSuccess = function(data) {
  artifact.processData (data);

  setTimeout (artifact.requestData, artifact.REFRESH_SUCCESS*1000);
}

window.artifact.handleFailure = function(data) {
  // no useful data on failure - do nothing

  setTimeout (artifact.requestData, artifact.REFRESH_FAILURE*1000);
}


window.artifact.processData = function(data) {

  if (!data.artifacts) {
    console.warn('Failed to find artifacts in artifact response');
    return;
  }

  artifact.clearData();

  $.each (data.artifacts, function(i,artData) {
    if (artData.artifactId != 'jarvis') {
      // jarvis artifacts - fragmentInfos and targetInfos
      // (future types? completely unknown at this time!)
      console.warn('Note: unknown artifactId '+artData.artifactId+' - guessing how to handle it');
    }

    if (artData.fragmentInfos) {
      artifact.processFragmentInfos (artData.artifactId, artData.fragmentInfos);
    }

    if (artData.targetInfos) {
      artifact.processTargetInfos (artData.artifactId, artData.targetInfos);
    }

    // other data in future? completely unknown!
  });


  // redraw the artifact layer
  artifact.updateLayer();

}


window.artifact.clearData = function() {

  artifact.portalInfo = {};
}

window.artifact.processFragmentInfos = function (id, fragments) {
  $.each(fragments, function(i, fragment) {
    if (!artifact.portalInfo[fragment.portalGuid]) {
      artifact.portalInfo[fragment.portalGuid] = { _entityData: fragment.portalInfo };
    }

    if (!artifact.portalInfo[fragment.portalGuid][id]) artifact.portalInfo[fragment.portalGuid][id] = {};

    if (!artifact.portalInfo[fragment.portalGuid][id].fragments) artifact.portalInfo[fragment.portalGuid][id].fragments = [];

    $.each(fragment.fragments, function(i,f) {
      artifact.portalInfo[fragment.portalGuid][id].fragments.push(f);
    });

  });
}

window.artifact.processTargetInfos = function (id, targets) {
  $.each(targets, function(i, target) {
    if (!artifact.portalInfo[target.portalGuid]) {
      artifact.portalInfo[target.portalGuid] = { _entityData: target.portalInfo };
    }

    if (!artifact.portalInfo[target.portalGuid][id]) artifact.portalInfo[target.portalGuid][id] = {};

    artifact.portalInfo[target.portalGuid][id].target = target.team === 'RESISTANCE' ? TEAM_RES : TEAM_ENL;
  });
}


// used to render portals that would otherwise be below the visible level
window.artifact.getArtifactEntities = function() {
  var entities = [];

  // create fake entities from the artifact data
  $.each (artifact.portalInfo, function(guid,data) {
    var timestamp = 0; // we don't have a valid timestamp - so let's use 0
    var ent = [ guid, timestamp, data._entityData ];
    entities.push(ent);
  });

  return entities;
}


window.artifact.updateLayer = function() {
  artifact._layer.clearLayers();

// TODO: icons
//   //commondatastorage.googleapis.com/ingress.com/img/map_icons/marker_images/jarvis_shard.png
//   //commondatastorage.googleapis.com/ingress.com/img/map_icons/marker_images/jarvis_shard_target_0.png
// (replace '0' with count of shards at the target portal)


  $.each(artifact.portalInfo, function(guid,data) {
    var latlng = L.latLng ([data._entityData.locationE6.latE6/1E6, data._entityData.locationE6.lngE6/1E6]);

    // jarvis shard icon
    var iconUrl = undefined;
    var iconSize = 0;

    if (data.jarvis.fragments) {
      iconUrl = '//commondatastorage.googleapis.com/ingress.com/img/map_icons/marker_images/jarvis_shard.png';
      iconSize = 60/2; // 60 pixels - half that size works better
    }
    if (data.jarvis.target) {
      // target portal - show the target marker. use the count of fragments at the target to pick the right icon - it has segments that fill up

      var count = data.jarvis.fragments ? data.jarvis.fragments.length : 0;

      iconUrl = '//commondatastorage.googleapis.com/ingress.com/img/map_icons/marker_images/jarvis_shard_target_'+count+'.png';
      iconSize = 100/2; // 100 pixels - half that size works better
    }

    if (iconUrl) {
      var icon = L.icon({
        iconUrl: iconUrl,
        iconSize: [iconSize,iconSize],
        iconAnchor: [iconSize/2,iconSize/2],
        className: 'no-pointer-events'  // the clickable: false below still blocks events going through to the svg underneath
      });

      var marker = L.marker (latlng, {icon: icon, clickable: false, keyboard: false});

      artifact._layer.addLayer(marker);
    } else {
      console.warn('Oops! no URL for artifact portal icon?!');
    }
  });

}
