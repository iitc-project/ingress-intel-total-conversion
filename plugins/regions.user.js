// ==UserScript==
// @id             iitc-plugin-regions@jonatkins
// @name           IITC plugin: Show the local score regions
// @category       Layer
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Show the local scoring regions on the map. No actual scores - just the region areas.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.regions = function() {};

window.plugin.regions.setup  = function() {
  @@INCLUDERAW:external/s2geometry.js@@


  window.plugin.regions.regionLayer = L.layerGroup();


  $("<style>")
    .prop("type", "text/css")
    .html(".plugin-regions-name {\
             font-size: 12px;\
             color: #FFFFAA;\
             text-shadow: -1px -1px #000, 1px -1px #000, -1px 1px #000, 1px 1px #000, 0 0 2px #000; \
             pointer-events: none;\
          }")
  .appendTo("head");

  addLayerGroup('Score Regions', window.plugin.regions.regionLayer, true);

  map.on('moveend', window.plugin.regions.update);

  window.plugin.regions.update();
};


window.plugin.regions.regionName = function(cell) {
  var face2name = [ 'AF', 'AS', 'NR', 'PA', 'AM', 'ST' ];
  var codeWord = [
    'ALPHA',
    'BRAVO',
    'CHARLIE',
    'DELTA',
    'ECHO',
    'FOXTROT',
    'GOLF',
    'HOTEL',
    'JULIET',
    'KILO',
    'LIMA',
    'MIKE',
    'NOVEMBER',
    'PAPA',
    'ROMEO',
    'SIERRA'
  ];

  // first component of the name is the face
  var name = face2name[cell.face];

  if (cell.level >= 4) {
    // next two components are from the most signifitant four bits of the cell I/J
    var regionI = cell.ij[0] >> (cell.level-4);
    var regionJ = cell.ij[1] >> (cell.level-4);

    name += zeroPad(regionI+1,2)+'-'+codeWord[regionJ];
  }

  if (cell.level >= 6) {
    // the final component is based on the hibbert curve for the relevant cell
    var facequads = cell.getFaceAndQuads();
    var number = facequads[1][4]*4+facequads[1][5];

    name += '-'+zeroPad(number,2);
  }


  return name;
};

window.plugin.regions.update = function() {

  window.plugin.regions.regionLayer.clearLayers();



  // centre cell
  var centerCell = S2.S2Cell.FromLatLng ( map.getCenter(), 6 );

  window.plugin.regions.drawCell(centerCell);

//HACKS!!!

var box = map.getBounds().pad(-0.3);
window.plugin.regions.drawCell(S2.S2Cell.FromLatLng(box.getNorthEast(),6));
window.plugin.regions.drawCell(S2.S2Cell.FromLatLng(box.getNorthWest(),6));
window.plugin.regions.drawCell(S2.S2Cell.FromLatLng(box.getSouthEast(),6));
window.plugin.regions.drawCell(S2.S2Cell.FromLatLng(box.getSouthWest(),6));

}



window.plugin.regions.drawCell = function(cell) {

//TODO: move to function - then call for all cells on screen

  // corner points
  var corners = cell.getCornerLatLngs();

  // center point
  var center = cell.getLatLng();

  // name
  var name = window.plugin.regions.regionName(cell);

  var region = L.polygon(corners, {fill: false, color: 'gold', opacity: 0.25, clickable: false});
  window.plugin.regions.regionLayer.addLayer(region);

  var marker = L.marker(center, {
    icon: L.divIcon({
      className: 'plugin-regions-name',
      iconAnchor: [50,5],
      iconSize: [100,10],
      html: name,
    })
  });
  window.plugin.regions.regionLayer.addLayer(marker);
};


var setup =  window.plugin.regions.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
