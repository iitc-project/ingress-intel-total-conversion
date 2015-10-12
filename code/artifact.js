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
    window.postAjax('getArtifactPortals', {}, artifact.handleSuccess, artifact.handleError);
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

  if (data.error || !data.result) {
    console.warn('Failed to find result in getArtifactPortals response');
    return;
  }

  artifact.clearData();

  artifact.processResult(data.result);

  // redraw the artifact layer
  artifact.updateLayer();

}


window.artifact.clearData = function() {
  artifact.portalInfo = {};
  artifact.artifactTypes = {};

  artifact.entities = [];
}


window.artifact.processResult = function (portals) {
  // portals is an object, keyed from the portal GUID, containing the portal entity array

  for (var guid in portals) {
    var ent = portals[guid];
    var data = decodeArray.portalSummary(ent);

    // we no longer know the faction for the target portals, and we don't know which fragment numbers are at the portals
    // all we know, from the portal summary data, for each type of artifact, is that each artifact portal is
    // - a target portal or not - no idea for which faction
    // - has one (or more) fragments, or not

    if (!artifact.portalInfo[guid]) artifact.portalInfo[guid] = {};

    // store the decoded data - needed for lat/lng for layer markers
    artifact.portalInfo[guid]._data = data;

    for(var type in data.artifactBrief.target) {
      if (!artifact.artifactTypes[type]) artifact.artifactTypes[type] = {};

      if (!artifact.portalInfo[guid][type]) artifact.portalInfo[guid][type] = {};

      artifact.portalInfo[guid][type].target = TEAM_NONE;  // as we no longer know the team...
    }

    for(var type in data.artifactBrief.fragment) {
      if (!artifact.artifactTypes[type]) artifact.artifactTypes[type] = {};

      if (!artifact.portalInfo[guid][type]) artifact.portalInfo[guid][type] = {};

      artifact.portalInfo[guid][type].fragments = true; //as we no longer have a list of the fragments there
    }


    // let's pre-generate the entities needed to render the map - array of [guid, timestamp, ent_array]
    artifact.entities.push ( [guid, data.timestamp, ent] );

  }

}

window.artifact.getArtifactTypes = function() {
  return Object.keys(artifact.artifactTypes);
}

window.artifact.isArtifact = function(type) {
  return type in artifact.artifactTypes;
}

// used to render portals that would otherwise be below the visible level
window.artifact.getArtifactEntities = function() {
  return artifact.entities;
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
    var latlng = L.latLng ([data._data.latE6/1E6, data._data.lngE6/1E6]);

    $.each(data, function(type,detail) {

      // we'll construct the URL form the type - stock seems to do that now

      var iconUrl;
      if (data[type].target !== undefined) {
        // target portal
        var iconUrl = '//commondatastorage.googleapis.com/ingress.com/img/map_icons/marker_images/'+type+'_shard_target.png'
        var iconSize = 100/2;
        var opacity = 1.0;

        var icon = L.icon({
          iconUrl: iconUrl,
          iconSize: [iconSize,iconSize],
          iconAnchor: [iconSize/2,iconSize/2],
          className: 'no-pointer-events'  // the clickable: false below still blocks events going through to the svg underneath
        });

        var marker = L.marker (latlng, {icon: icon, clickable: false, keyboard: false, opacity: opacity });

        artifact._layer.addLayer(marker);

      } else if (data[type].fragments) {
        // fragment(s) at portal

        var iconUrl = '//commondatastorage.googleapis.com/ingress.com/img/map_icons/marker_images/'+type+'_shard.png'
        var iconSize = 60/2;
        var opacity = 0.6;

        var icon = L.icon({
          iconUrl: iconUrl,
          iconSize: [iconSize,iconSize],
          iconAnchor: [iconSize/2,iconSize/2],
          className: 'no-pointer-events'  // the clickable: false below still blocks events going through to the svg underneath
        });

        var marker = L.marker (latlng, {icon: icon, clickable: false, keyboard: false, opacity: opacity });

        artifact._layer.addLayer(marker);

      }

    });  //end $.each(data, function(type,detail)

  }); //end $.each(artifact.portalInfo, function(guid,data)

}


window.artifact.showArtifactList = function() {
  var html = '';

  if (Object.keys(artifact.artifactTypes).length == 0) {
    html += '<i>No artifacts at this time</i>';
  }

  var first = true;
  $.each(artifact.artifactTypes, function(type,type2) {
    // no nice way to convert the Niantic internal name into the correct display name
    // (we do get the description string once a portal with that shard type is selected - could cache that somewhere?)
    var name = type.capitalize() + ' shards';

    if (!first) html += '<hr>';
    first = false;
    html += '<div><b>'+name+'</b></div>';

    html += '<table class="artifact artifact-'+type+'">';
    html += '<tr><th>Portal</th><th>Details</th></tr>';

    var tableRows = [];

    $.each(artifact.portalInfo, function(guid, data) {
      if (type in data) {
        // this portal has data for this artifact type - add it to the table

        var onclick = 'zoomToAndShowPortal(\''+guid+'\',['+data._data.latE6/1E6+','+data._data.lngE6/1E6+'])';
        var row = '<tr><td class="portal"><a onclick="'+onclick+'">'+escapeHtmlSpecialChars(data._data.title)+'</a></td>';

        row += '<td class="info">';

        if (data[type].target !== undefined) {
          if (data[type].target == TEAM_NONE) {
            row += '<span class="target">Target Portal</span> ';
          } else {
            row += '<span class="target '+TEAM_TO_CSS[data[type].target]+'">'+(data[type].target==TEAM_RES?'Resistance':'Enlightened')+' target</span> ';
          }
        }

        if (data[type].fragments) {
          if (data[type].target !== undefined) {
            row += '<br>';
          }
          var fragmentName = 'shard';
//          row += '<span class="fragments'+(data[type].target?' '+TEAM_TO_CSS[data[type].target]:'')+'">'+fragmentName+': #'+data[type].fragments.join(', #')+'</span> ';
          row += '<span class="fragments'+(data[type].target?' '+TEAM_TO_CSS[data[type].target]:'')+'">'+fragmentName+': yes</span> ';
        }

        row += '</td></tr>';

        // sort by target portals first, then by portal GUID
        var sortVal = (data[type].target !== undefined ? 'A' : 'Z') + guid;

        tableRows.push ( [sortVal, row] );
      }
    });

    // check for no rows, and add a note to the table instead
    if (tableRows.length == 0) {
      html += '<tr><td colspan="2"><i>No portals at this time</i></td></tr>';
    }

    // sort the rows
    tableRows.sort(function(a,b) {
      if (a[0] == b[0]) return 0;
      else if (a[0] < b[0]) return -1;
      else return 1;
    });

    // and add them to the table
    html += tableRows.map(function(a){return a[1];}).join('');


    html += '</table>';
  });


  html += "<hr />"
        + "<p>In Summer 2015, Niantic changed the data format for artifact portals. We no longer know:</p>"
        + "<ul><li>Which team each target portal is for - only that it is a target</li>"
        + "<li>Which shards are at each portal, just that it has one or more shards</li></ul>"
        + "<p>You can select a portal and the detailed data contains the list of shard numbers, but there's still no"
        + " more information on targets.</p>";

  dialog({
    title: 'Artifacts',
    html: html,
    width: 400,
    position: {my: 'right center', at: 'center-60 center', of: window, collision: 'fit'}
  });

}
