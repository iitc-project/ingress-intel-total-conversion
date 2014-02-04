// PORTAL MARKER //////////////////////////////////////////////
// code to create and update a portal marker


window.portalMarkerScale = function() {
  var zoom = map.getZoom();
  return zoom >= 14 ? 1 : zoom >= 11 ? 0.8 : zoom >= 8 ? 0.65 : 0.5;
}

// create a new marker. 'data' contain the IITC-specific entity data to be stored in the object options
window.createMarker = function(latlng, data) {
  var styleOptions = window.getMarkerStyleOptions(data);

  var options = L.extend({}, data, styleOptions, { clickable: true });

  var marker = L.circleMarker(latlng, options);

  highlightPortal(marker);

  return marker;
}


window.setMarkerStyle = function(marker, selected) {

  var styleOptions = window.getMarkerStyleOptions(marker.options);

  marker.setStyle(styleOptions);

  // FIXME? it's inefficient to set the marker style (above), then do it again inside the highlighter
  // the highlighter API would need to be changed for this to be improved though. will it be too slow?
  highlightPortal(marker);

  if (selected) {
    marker.setStyle ({color: COLOR_SELECTED_PORTAL});
  }
}


window.getMarkerStyleOptions = function(details) {
  var scale = window.portalMarkerScale();

  var lvlWeight = Math.max(2, Math.floor(details.level) / 1.5) * scale;
  var lvlRadius = (details.team === window.TEAM_NONE ? 7 : Math.floor(details.level) + 4) * scale;

  var options = {
    radius: lvlRadius + (L.Browser.mobile ? PORTAL_RADIUS_ENLARGE_MOBILE*scale : 0),
    stroke: true,
    color: COLORS[details.team],
    weight: lvlWeight,
    opacity: 1,
    fill: true,
    fillColor: COLORS[details.team],
    fillOpacity: 0.5,
    dashArray: null
  };

  return options;
}
