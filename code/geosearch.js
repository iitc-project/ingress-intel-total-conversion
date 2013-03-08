
// GEOSEARCH /////////////////////////////////////////////////////////

window.setupGeosearch = function() {
  $('#geosearch').keypress(function(e) {
    if((e.keyCode ? e.keyCode : e.which) != 13) return;
    $.getJSON(NOMINATIM + encodeURIComponent($(this).val()), function(data) {
      if(!data || !data[0]) return;
      var b = data[0].boundingbox;
      if(!b) return;
      var southWest = new L.LatLng(b[0], b[2]),
          northEast = new L.LatLng(b[1], b[3]),
          bounds = new L.LatLngBounds(southWest, northEast);
      window.map.fitBounds(bounds);
      if(window.isSmartphone()) window.smartphone.mapButton.click();
    });
    e.preventDefault();
  });
}
