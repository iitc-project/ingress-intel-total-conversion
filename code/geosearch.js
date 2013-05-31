
// GEOSEARCH /////////////////////////////////////////////////////////

window.setupGeosearch = function() {
  $('#geosearch').keypress(function(e) {
    if((e.keyCode ? e.keyCode : e.which) != 13) return;
    
    var search = $(this).val();

    if ( window.search(search) ) return;

    e.preventDefault();
  });
  $('#geosearchwrapper img').click(function(){
    map.locate({setView : true, maxZoom: 13});
  });
}

window.search = function(search) {
    if (!runHooks('geoSearch', search)) {
      return true;
    }
    
    $.getJSON(NOMINATIM + encodeURIComponent(search), function(data) {
      if(!data || !data[0]) return true;
      var b = data[0].boundingbox;
      if(!b) return true;
      var southWest = new L.LatLng(b[0], b[2]),
          northEast = new L.LatLng(b[1], b[3]),
          bounds = new L.LatLngBounds(southWest, northEast);
      window.map.fitBounds(bounds);
      if(window.isSmartphone()) window.smartphone.mapButton.click();
    });
}
