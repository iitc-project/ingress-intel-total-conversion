// PORTAL MARKER //////////////////////////////////////////////
// code to create and update a portal marker




// create a new marker. 'data' contain the IITC-specific entity data to be stored in the object options
window.createMarker = function(latlng, data) {

  // we assume non-selected - a selected portal will have an additional call to setMarkerStyle.
  // inefficient - but it's only for a single portal
  var styleOptions = window.getMarkerStyleOptions(data, false);

  var options = L.extend({}, data, styleOptions, { clickable: true });

  var marker = L.circleMarker(latlng, options);

  highlightPortal(marker);

  return marker;
}


window.setMarkerStyle = function(marker, selected) {

  var styleOptions = window.getMarkerStyleOptions(marker.options, selected);

  marker.setStyle(styleOptions);

  // FIXME? it's inefficient to set the marker style (above), then do it again inside the highlighter
  // the highlighter API would need to be changed for this to be improved though. will it be too slow?
  highlightPortal(marker);
}


window.getMarkerStyleOptions = function(details, selected) {
  var lvlWeight = Math.max(2, Math.floor(details.level) / 1.5);
  var lvlRadius = details.team === window.TEAM_NONE ? 7 : Math.floor(details.level) + 4;

  var options = {
    radius: lvlRadius + (L.Browser.mobile ? PORTAL_RADIUS_ENLARGE_MOBILE : 0),
    stroke: true,
    color: selected ? COLOR_SELECTED_PORTAL : COLORS[details.team],
    weight: lvlWeight,
    opacity: 1,
    fill: true,
    fillColor: COLORS[details.team],
    fillOpacity: 0.5,
    dashArray: null
  };

  return options;
}
