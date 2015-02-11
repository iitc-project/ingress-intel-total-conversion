
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
  $('#geosearch').keyup(function(){$(this).removeClass('search_not_found')});

  window.searchResultLayer = L.layerGroup();
  map.addLayer(window.searchResultLayer);
}

window.search = function(search) {
  window.searchResultLayer.clearLayers();

  var searchMarkerOptions = {color:'red', weight:3, opacity: 0.5, fill:false, dashArray:"5,5", clickable:false};


  if (!runHooks('geoSearch', search)) {
    return true;
  }

  if(search.split(",").length == 2) {
    var ll = search.split(",");
    if(!isNaN(ll[0]) && !isNaN(ll[1])) {
      ll = [parseFloat(ll[0]), parseFloat(ll[1])];
      if(ll[0] >= -90 && ll[0] <= 90 && ll[1] >= -180 && ll[1] <= 180) {
        var ll = L.latLng(ll);
        window.map.setView(ll, 17);

        window.searchResultLayer.clearLayers();
        window.searchResultLayer.addLayer(L.circleMarker(ll,searchMarkerOptions));

        if(window.isSmartphone()) window.show('map');
        return true;
      }
    }
  }

  $.getJSON(NOMINATIM + encodeURIComponent(search), function(data) {
    if(!data || !data[0]) {
      $('#geosearch').addClass('search_not_found');
      return true;
    }
    var b = data[0].boundingbox;
    if(!b) return true;
    var southWest = new L.LatLng(b[0], b[2]),
        northEast = new L.LatLng(b[1], b[3]),
        bounds = new L.LatLngBounds(southWest, northEast);

    window.searchResultLayer.clearLayers();
    if (southWest.equals(northEast)) {
        window.searchResultLayer.addLayer(L.circleMarker(southWest,searchMarkerOptions));
    } else {
      window.searchResultLayer.addLayer(L.rectangle(bounds,searchMarkerOptions));
    }

    window.map.fitBounds(bounds, {maxZoom: 17});
    if(window.isSmartphone()) window.show('map');
  });
}
