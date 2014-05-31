// ARTIFACT ///////////////////////////////////////////////////////

// added as part of the ingress #13magnus in november 2013, artifacts
// are additional game elements overlayed on the intel map
// currently there are only jarvis-related entities
// - shards: move between portals (along links) each hour. more than one can be at a portal
// - targets: specific portals - one per team
// the artifact data includes details for the specific portals, so can be useful
// 2014-02-06: intel site updates hint at new 'amar artifacts', likely following the same system as above


window.artifact = function() {}

window.artifact.setup = function() {
  artifact.REFRESH_JITTER = 2*60;  // 2 minute random period so not all users refresh at once
  artifact.REFRESH_SUCCESS = 60*60;  // 60 minutes on success
  artifact.REFRESH_FAILURE = 2*60;  // 2 minute retry on failure

  artifact.idle = false;
  artifact.clearData();

  addResumeFunction(artifact.idleResume);

  // move the initial data request onto a very short timer. prevents thrown exceptions causing IITC boot failures
  setTimeout (artifact.requestData, 1);

  artifact._layer = new L.LayerGroup();
  addLayerGroup ('Artifacts', artifact._layer, true);

  $('#toolbox').append(' <a onclick="window.artifact.showArtifactList()" title="Show artifact portal list">Artifacts</a>');

}

window.artifact.requestData = function() {
  if (isIdle()) {
    artifact.idle = true;
  } else {
    window.postAjax('artifacts', {}, artifact.handleSuccess, artifact.handleError);
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

  // start the next refresh at a multiple of REFRESH_SUCCESS seconds, plus a random REFRESH_JITTER amount to prevent excessive server hits at one time
  var now = Date.now();
  var nextTime = Math.ceil(now/(artifact.REFRESH_SUCCESS*1000))*(artifact.REFRESH_SUCCESS*1000) + Math.floor(Math.random()*artifact.REFRESH_JITTER*1000);

  setTimeout (artifact.requestData, nextTime - now);
}

window.artifact.handleFailure = function(data) {
  // no useful data on failure - do nothing

  setTimeout (artifact.requestData, artifact.REFRESH_FAILURE*1000);
}


window.artifact.processData = function(data) {

  if (data.error || !data.artifacts) {
    console.warn('Failed to find artifacts in artifact response');
  }

  artifact.clearData();

  $.each (data.artifacts, function(i,artData) {
    // if we have no descriptions for a type, we don't know about it
    if (!artifact.getArtifactDescriptions(artData.artifactId)) {
      // jarvis and amar artifacts - fragmentInfos and targetInfos
      // (future types? completely unknown at this time!)
      console.warn('Note: unknown artifactId '+artData.artifactId+' - guessing how to handle it');
    }

    artifact.artifactTypes[artData.artifactId] = artData.artifactId;

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
  artifact.artifactTypes = {};
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

window.artifact.getArtifactTypes = function() {
  return Object.keys(artifact.artifactTypes);
}

window.artifact.isArtifact = function(type) {
  return type in artifact.artifactTypes;
}

window.artifact.getArtifactDescriptions = function(type) {
  var descriptions = {
    'jarvis': { 'title': "Jarvis Shards", 'fragmentName': "shards" },
    'amar': { 'title': "Amar Artifacts", 'fragmentName': "artifacts" }
  };

  return descriptions[type];
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

window.artifact.getInterestingPortals = function() {
  return Object.keys(artifact.portalInfo);
}

// quick test for portal being relevant to artifacts - of any type
window.artifact.isInterestingPortal = function(guid) {
  return guid in artifact.portalInfo;
}

// get the artifact data for a specified artifact id (e.g. 'jarvis'), if it exists - otherwise returns something 'false'y
window.artifact.getPortalData = function(guid,artifactId) {
  return artifact.portalInfo[guid] && artifact.portalInfo[guid][artifactId];
}

window.artifact.updateLayer = function() {
  artifact._layer.clearLayers();

  $.each(artifact.portalInfo, function(guid,data) {
    var latlng = L.latLng ([data._entityData.latE6/1E6, data._entityData.lngE6/1E6]);

    // jarvis shard icon
    var iconUrl = undefined;
    var iconSize = 0;
    var opacity = 1.0;

    // redundant as of 2014-02-05 - jarvis shards removed
    if (data.jarvis) {
      if (data.jarvis.target) {
        // target portal - show the target marker. use the count of fragments at the target to pick the right icon - it has segments that fill up

        var count = data.jarvis.fragments ? data.jarvis.fragments.length : 0;

        iconUrl = '//commondatastorage.googleapis.com/ingress.com/img/map_icons/marker_images/jarvis_shard_target_'+count+'.png';
        iconSize = 100/2; // 100 pixels - half that size works better
      } else if (data.jarvis.fragments) {
        iconUrl = '//commondatastorage.googleapis.com/ingress.com/img/map_icons/marker_images/jarvis_shard.png';
        iconSize = 60/2; // 60 pixels - half that size works better
        opacity = 0.6; // these often hide portals - let's make them semi transparent
      }

    }
    // 2014-02-06: a guess at whats needed for the new artifacts
    if (data.amar) {
      if (data.amar.target) {
        // target portal - show the target marker. use the count of fragments at the target to pick the right icon - it has segments that fill up

        var count = data.amar.fragments ? data.amar.fragments.length : 0;

        iconUrl = '//commondatastorage.googleapis.com/ingress.com/img/map_icons/marker_images/amar_shard_target_'+count+'.png';
        iconSize = 100/2; // 100 pixels - half that size works better
      } else if (data.amar.fragments) {
        iconUrl = '//commondatastorage.googleapis.com/ingress.com/img/map_icons/marker_images/amar_shard.png';
        iconSize = 60/2; // 60 pixels - half that size works better
        opacity = 0.6; // these often hide portals - let's make them semi transparent
      }

    }

    if (iconUrl) {
      var icon = L.icon({
        iconUrl: iconUrl,
        iconSize: [iconSize,iconSize],
        iconAnchor: [iconSize/2,iconSize/2],
        className: 'no-pointer-events'  // the clickable: false below still blocks events going through to the svg underneath
      });

      var marker = L.marker (latlng, {icon: icon, clickable: false, keyboard: false, opacity: opacity });

      artifact._layer.addLayer(marker);
    } else {
      console.warn('Oops! no URL for artifact portal icon?!');
    }
  });

}


window.artifact.showArtifactList = function() {


  var html = '';

  var typeNames = { 'jarvis': 'Jarvis Shards', 'amar': 'Amar Artifacts' };

  if (Object.keys(artifact.artifactTypes).length == 0) {
    html += '<i>No artifacts at this time</i>';
  }

  $.each(artifact.artifactTypes, function(type,type2) {
    var description = artifact.getArtifactDescriptions(type);

    var name = description ? description.title : ('unknown artifact type: '+type);

    html += '<hr><div><b>'+name+'</b></div>';

    html += '<table class="artifact artifact-'+type+'">';
    html += '<tr><th>Portal</th><th>Details</th></tr>';

    var tableRows = [];

    $.each(artifact.portalInfo, function(guid, data) {
      if (type in data) {
        // this portal has data for this artifact type - add it to the table

        var sortVal = 0;

        var onclick = 'zoomToAndShowPortal(\''+guid+'\',['+data._entityData.latE6/1E6+','+data._entityData.lngE6/1E6+'])';
        var row = '<tr><td class="portal"><a onclick="'+onclick+'">'+escapeHtmlSpecialChars(data._entityData.title)+'</a></td>';

        row += '<td class="info">';

        if (data[type].target) {
          row += '<span class="target '+TEAM_TO_CSS[data[type].target]+'">'+(data[type].target==TEAM_RES?'Resistance':'Enlightened')+' target</span> ';
          sortVal = 100000+data[type].target;
        }

        if (data[type].fragments) {
          if (data[type].target) {
            row += '<br>';
          }
          var fragmentName = description ? description.fragmentName : 'fragment';
          row += '<span class="fragments'+(data[type].target?' '+TEAM_TO_CSS[data[type].target]:'')+'">'+fragmentName+': #'+data[type].fragments.join(', #')+'</span> ';
          sortVal = Math.min.apply(null, data[type].fragments); // use min shard number at portal as sort key
        }

        row += '</td></tr>';

        tableRows.push ( [sortVal, row] );
      }
    });

    // check for no rows, and add a note to the table instead
    if (tableRows.length == 0) {
      html += '<tr><td colspan="2"><i>No portals at this time</i></td></tr>';
    }

    // sort the rows
    tableRows.sort(function(a,b) {
      return a[0]-b[0];
    });

    // and add them to the table
    html += tableRows.map(function(a){return a[1];}).join('');


    html += '</table>';
  });


  dialog({
    title: 'Artifacts',
    html: html,
    width: 400,
    position: {my: 'right center', at: 'center-60 center', of: window, collision: 'fit'}
  });

}
