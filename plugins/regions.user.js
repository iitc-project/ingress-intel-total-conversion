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
             font-size: 14px;\
             font-weight: bold;\
             color: gold;\
             opacity: 0.7;\
             text-align: center;\
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


  // ingress does some odd things with the naming. for some faces, the i and j coords are flipped when converting
  // (and not only the names - but the full quad coords too!). easiest fix is to create a temporary cell with the coords
  // swapped
  if (cell.face == 1 || cell.face == 3 || cell.face == 5) {
    cell = S2.S2Cell.FromFaceIJ ( cell.face, [cell.ij[1], cell.ij[0]], cell.level );
  }

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

  var bounds = map.getBounds();

  var seenCells = {};

  var drawCellAndNeighbors = function(cell) {

    var cellStr = cell.toString();

    if (!seenCells[cellStr]) {
      // cell not visited - flag it as visited now
      seenCells[cellStr] = true;

      // is it on the screen?
      var corners = cell.getCornerLatLngs();
      var cellBounds = L.latLngBounds([corners[0],corners[1]]).extend(corners[2]).extend(corners[3]);

      if (cellBounds.intersects(bounds)) {
        // on screen - draw it
        window.plugin.regions.drawCell(cell);

        // and recurse to our neighbors
        var neighbors = cell.getNeighbors();
        for (var i=0; i<neighbors.length; i++) {
          drawCellAndNeighbors(neighbors[i]);
        }
      }
    }

  };

  // centre cell
  var zoom = map.getZoom();
  if (zoom >= 5) {
    var cellSize = zoom>=7 ? 6 : 4;
    var cell = S2.S2Cell.FromLatLng ( map.getCenter(), cellSize );

    drawCellAndNeighbors(cell);
  }


  // the six cube side boundaries. we cheat by hard-coding the coords as it's simple enough
  var latLngs = [ [45,-180], [35.264389682754654,-135], [35.264389682754654,-45], [35.264389682754654,45], [35.264389682754654,135], [45,180]];

  var globalCellOptions = {color: 'red', weight: 7, opacity: 0.5};

  for (var i=0; i<latLngs.length-1; i++) {
    // the geodesic line code can't handle a line/polyline spanning more than (or close to?) 180 degrees, so we draw
    // each segment as a separate line
    var poly1 = L.geodesicPolyline ( [latLngs[i], latLngs[i+1]], globalCellOptions );
    window.plugin.regions.regionLayer.addLayer(poly1);

    //southern mirror of the above
    var poly2 = L.geodesicPolyline ( [[-latLngs[i][0],latLngs[i][1]], [-latLngs[i+1][0], latLngs[i+1][1]]], globalCellOptions );
    window.plugin.regions.regionLayer.addLayer(poly2);
  }

  // and the north-south lines. no need for geodesic here
  for (var i=-135; i<=135; i+=90) {
    var poly = L.polyline ( [[35.264389682754654,i], [-35.264389682754654,i]], globalCellOptions );
    window.plugin.regions.regionLayer.addLayer(poly);
  }

}



window.plugin.regions.drawCell = function(cell) {

//TODO: move to function - then call for all cells on screen

  // corner points
  var corners = cell.getCornerLatLngs();

  // center point
  var center = cell.getLatLng();

  // name
  var name = window.plugin.regions.regionName(cell);


  var color = cell.level == 6 ? 'gold' : 'orange';

  // the level 6 cells have noticible errors with non-geodesic lines - and the larger level 4 cells are worse
  // NOTE: we only draw two of the edges. as we draw all cells on screen, the other two edges will either be drawn
  // from the other cell, or be off screen so we don't care
  var region = L.geodesicPolyline([corners[0],corners[1],corners[2]], {fill: false, color: color, opacity: 0.5, weight: 5, clickable: false});

  window.plugin.regions.regionLayer.addLayer(region);

// move the label if we're at a high enough zoom level and it's off screen
  if (map.getZoom() >= 9) {
    var namebounds = map.getBounds().pad(-0.1); // pad 10% inside the screen bounds
    if (!namebounds.contains(center)) {
      // name is off-screen. pull it in so it's inside the bounds
      var newlat = Math.max(Math.min(center.lat, namebounds.getNorth()), namebounds.getSouth());
      var newlng = Math.max(Math.min(center.lng, namebounds.getEast()), namebounds.getWest());

      var newpos = L.latLng(newlat,newlng);

      // ensure the new centre point is within the corners
      var cornerbounds = L.latLngBounds([corners[0],corners[1]]).extend(corners[2]).extend(corners[3]);

      if (cornerbounds.contains(newpos)) center=newpos;
      // else we leave the name where it was - offscreen
    }
  }

  var marker = L.marker(center, {
    icon: L.divIcon({
      className: 'plugin-regions-name',
      iconAnchor: [100,5],
      iconSize: [200,10],
      html: name,
    })
  });
  window.plugin.regions.regionLayer.addLayer(marker);
};


var setup =  window.plugin.regions.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
