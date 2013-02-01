
// LOCATION HANDLING /////////////////////////////////////////////////
// i.e. setting initial position and storing new position after moving

// retrieves current position from map and stores it cookies
window.storeMapPosition = function() {
  var m = window.map.getCenter();
  writeCookie('ingress.intelmap.lat', m['lat']);
  writeCookie('ingress.intelmap.lng', m['lng']);
  writeCookie('ingress.intelmap.zoom', window.map.getZoom());
}

// either retrieves the last shown position from a cookie, from the
// URL or if neither is present, via Geolocation. If that fails, it
// returns a map that shows the whole world.
window.getPosition = function() {
  if(getURLParam('latE6') && getURLParam('lngE6')) {
    console.log("mappos: reading URL params");
    var lat = parseInt(getURLParam('latE6'))/1E6 || 0.0;
    var lng = parseInt(getURLParam('lngE6'))/1E6 || 0.0;
    // google seems to zoom in far more than leaflet
    var z = parseInt(getURLParam('z'))+1 || 17;
    return {center: new L.LatLng(lat, lng), zoom: z > 18 ? 18 : z};
  }

  if(readCookie('ingress.intelmap.lat') && readCookie('ingress.intelmap.lng')) {
    console.log("mappos: reading cookies");
    var lat = parseFloat(readCookie('ingress.intelmap.lat')) || 0.0;
    var lng = parseFloat(readCookie('ingress.intelmap.lng')) || 0.0;
    var z = parseInt(readCookie('ingress.intelmap.zoom')) || 17;
    return {center: new L.LatLng(lat, lng), zoom: z > 18 ? 18 : z};
  }

  setTimeout("window.map.locate({setView : true, maxZoom: 13});", 50);

  return {center: new L.LatLng(0.0, 0.0), zoom: 1};
}
