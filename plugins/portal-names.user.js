// ==UserScript==
// @id             iitc-plugin-portal-names@zaso
// @name           IITC plugin: Portal Names
// @category       Layer
// @version        0.1.3.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Show portal names on the map
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalNames = function() {};

window.plugin.portalNames.NAME_WIDTH = 80;
window.plugin.portalNames.NAME_HEIGHT = 23;

window.plugin.portalNames.labelLayers = {};
window.plugin.portalNames.labelLayerGroup = null;

window.plugin.portalNames.setupCSS = function() {
  $("<style>").prop("type", "text/css").html(''
  +'.plugin-portal-names{'
    +'color:#FFFFBB;'
    +'font-size:11px;line-height:12px;'
    +'text-align:center;padding: 2px;'  // padding needed so shadow doesn't clip
    +'overflow:hidden;'
// could try this if one-line names are used
//    +'white-space: nowrap;text-overflow:ellipsis;'
    +'text-shadow:1px 1px #000,1px -1px #000,-1px 1px #000,-1px -1px #000, 0 0 5px #000;'
    +'pointer-events:none;'
  +'}'
  ).appendTo("head");
}

window.plugin.portalNames.portalAdded = function(data) {
  data.portal.on('add', function() {
    window.plugin.portalNames.addLabel(this.options.guid, this.getLatLng());
  });
  data.portal.on('remove', function() {
    window.plugin.portalNames.removeLabel(this.options.guid);
  });
}

window.plugin.portalNames.removeLabel = function(guid) {
  var previousLayer = window.plugin.portalNames.labelLayers[guid];
  if(previousLayer) {
    window.plugin.portalNames.labelLayerGroup.removeLayer(previousLayer);
    delete plugin.portalNames.labelLayers[guid];
  }
}

window.plugin.portalNames.addLabel = function(guid, latLng) {
  var previousLayer = window.plugin.portalNames.labelLayers[guid];
  if (!previousLayer) {

    var d = window.portals[guid].options.data;
    var portalName = d.title;

    var label = L.marker(latLng, {
      icon: L.divIcon({
        className: 'plugin-portal-names',
        iconAnchor: [window.plugin.portalNames.NAME_WIDTH/2,0],
        iconSize: [window.plugin.portalNames.NAME_WIDTH,window.plugin.portalNames.NAME_HEIGHT],
        html: portalName
      }),
      guid: guid,
    });
    window.plugin.portalNames.labelLayers[guid] = label;
    label.addTo(window.plugin.portalNames.labelLayerGroup);
  }
}

window.plugin.portalNames.updatePortalLabels = function() {

  var portalPoints = {};

  for (var guid in window.portals) {
    var p = window.portals[guid];
    if (p._map) {  // only consider portals added to the map
      var point = map.project(p.getLatLng());
      portalPoints[guid] = point;
    }
  }

  // for efficient testing of intersection, group portals into buckets based on the label size
  var buckets = {};
  for (var guid in portalPoints) {
    var point = portalPoints[guid];

    var bucketId = L.point([Math.floor(point.x/(window.plugin.portalNames.NAME_WIDTH*2)),Math.floor(point.y/window.plugin.portalNames.NAME_HEIGHT)]);
    // the guid is added to four buckets. this way, when testing for overlap we don't need to test
    // all 8 buckets surrounding the one around the particular portal, only the bucket it is in itself
    var bucketIds = [bucketId, bucketId.add([1,0]), bucketId.add([0,1]), bucketId.add([1,1])];
    for (var i in bucketIds) {
      var b = bucketIds[i].toString();
      if (!buckets[b]) buckets[b] = {};
      buckets[b][guid] = true;
    }
  }  

  var coveredPortals = {};

  for (var bucket in buckets) {
    var bucketGuids = buckets[bucket];
    for (var guid in bucketGuids) {
      var point = portalPoints[guid];
      // the bounds used for testing are twice as wide as the portal name marker. this is so that there's no left/right
      // overlap between two different portals text
      var largeBounds = L.bounds (
                point.subtract([window.plugin.portalNames.NAME_WIDTH,0]),
                point.add([window.plugin.portalNames.NAME_WIDTH,window.plugin.portalNames.NAME_HEIGHT])
      );
  
      for (var otherGuid in bucketGuids) {
        if (guid != otherGuid) {
          var otherPoint = portalPoints[otherGuid];
  
          if (largeBounds.contains(otherPoint)) {
            // another portal is within the rectangle for this one's name - so no name for this one
            coveredPortals[guid] = true;
            break;
          }
        }
      }
    }
  }

  for (var guid in coveredPortals) {
    delete portalPoints[guid];
  }

  // remove any not wanted
  for (var guid in window.plugin.portalNames.labelLayers) {
    if (!(guid in portalPoints)) {
      window.plugin.portalNames.removeLabel(guid);
    }
  }

  // and add those we do
  for (var guid in portalPoints) {
    window.plugin.portalNames.addLabel(guid, portals[guid].getLatLng());
  }
}



var setup = function() {
  window.plugin.portalNames.setupCSS();

  window.plugin.portalNames.labelLayerGroup = new L.LayerGroup();
  window.addLayerGroup('Portal Names', window.plugin.portalNames.labelLayerGroup, true);

  window.addHook('requestFinished', window.plugin.portalNames.updatePortalLabels);
  window.addHook('mapDataRefreshEnd', window.plugin.portalNames.updatePortalLabels);
  window.map.on('overlayadd overlayremove', window.plugin.portalNames.updatePortalLabels);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
