// PORTAL MARKER //////////////////////////////////////////////
// code to create and update a portal marker

// sequence of calls:
// 1. var marker = createMarker();
// 2. // IITC (elsewhere) sets up options.details, options.guid, etc
// 3. // IITC (elsewhere) calls marker.setLatLng()
// 3. setMarkerStyle(selected);


// create a blank marker. no data specified at this point
window.createMarker = function() {
  return new L.CircleMarker();
}


window.setMarkerStyle = function(selected) {

  var options = {
  };

  // call highlighter



}
