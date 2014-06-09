/*
OMS doesn't cancel the original click event, so the topmost marker will get a click event while spiderfying.
Also, OMS only supports a global callback for all managed markers. Therefore, we will use a custom event that gets fired
for each marker.
*/

window.setupOMS = function() {
  window.oms = new OverlappingMarkerSpiderfier(map, {
    keepSpiderfied: true,
    legWeight: 3.5,
    legColors: {
      usual: '#FFFF00',
      highlighted: '#FF0000'
    }
  });

  window.oms.addListener('click', function(marker) {
    map.closePopup();
    marker.fireEvent('spiderfiedclick', {target: marker});
  });
  window.oms.addListener('spiderfy', function(markers) {
    map.closePopup();
  });
}

