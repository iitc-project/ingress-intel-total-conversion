// PORTAL MARKER //////////////////////////////////////////////
// code to create and update a portal marker




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
  var lvlWeight = Math.max(2, Math.floor(details.level) / 1.5);
  var lvlRadius = details.team === window.TEAM_NONE ? 7 : Math.floor(details.level) + 4;

  var options = {
    radius: lvlRadius + (L.Browser.mobile ? PORTAL_RADIUS_ENLARGE_MOBILE : 0),
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
