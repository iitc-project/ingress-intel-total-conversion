// ==UserScript==
// @id             iitc-plugin-regions@jonatkins
// @name           IITC plugin: Show the local score regions
// @category       Layer
// @version        0.1.2.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Show the local scoring regions on the map. No actual scores - just the region areas.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @include        https://www.ingress.com/mission/*
// @include        http://www.ingress.com/mission/*
// @match          https://www.ingress.com/mission/*
// @match          http://www.ingress.com/mission/*
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

  addHook('search', window.plugin.regions.search);

  window.plugin.regions.update();
};

window.plugin.regions.FACE_NAMES = [ 'AF', 'AS', 'NR', 'PA', 'AM', 'ST' ];
window.plugin.regions.CODE_WORDS = [
  'ALPHA',    'BRAVO',   'CHARLIE', 'DELTA',
  'ECHO',     'FOXTROT', 'GOLF',    'HOTEL',
  'JULIET',   'KILO',    'LIMA',    'MIKE',
  'NOVEMBER', 'PAPA',    'ROMEO',   'SIERRA',
];

// This regexp is quite forgiving. Dashes are allowed between all components, each dash and leading zero is optional.
// All whitespace is removed in onSearch(). If the first or both the first and second component are omitted, they are
// replaced with the current cell's coordinates (=the cell which contains the center point of the map). If the last
// component is ommited, the 4x4 cell group is used.
window.plugin.regions.REGEXP = new RegExp('^(?:(?:(' + plugin.regions.FACE_NAMES.join('|') + ')-?)?((?:1[0-6])|(?:0?[1-9]))-?)?(' +
  plugin.regions.CODE_WORDS.join('|') + ')(?:-?((?:1[0-5])|(?:0?\\d)))?$', 'i');

window.plugin.regions.regionName = function(cell) {
  // ingress does some odd things with the naming. for some faces, the i and j coords are flipped when converting
  // (and not only the names - but the full quad coords too!). easiest fix is to create a temporary cell with the coords
  // swapped
  if (cell.face == 1 || cell.face == 3 || cell.face == 5) {
    cell = S2.S2Cell.FromFaceIJ ( cell.face, [cell.ij[1], cell.ij[0]], cell.level );
  }

  // first component of the name is the face
  var name = window.plugin.regions.FACE_NAMES[cell.face];

  if (cell.level >= 4) {
    // next two components are from the most signifitant four bits of the cell I/J
    var regionI = cell.ij[0] >> (cell.level-4);
    var regionJ = cell.ij[1] >> (cell.level-4);

    name += zeroPad(regionI+1,2)+'-'+window.plugin.regions.CODE_WORDS[regionJ];
  }

  if (cell.level >= 6) {
    // the final component is based on the hibbert curve for the relevant cell
    var facequads = cell.getFaceAndQuads();
    var number = facequads[1][4]*4+facequads[1][5];

    name += '-'+zeroPad(number,2);
  }


  return name;
};

window.plugin.regions.search = function(query) {
  var terms = query.term.replace(/\s+/g, '').split(/[,;]/);
  var matches = terms.map(function(string) {
    return string.match(window.plugin.regions.REGEXP);
  });
  if(!matches.every(function(match) { return match !== null; })) return;
  
  var currentCell = window.plugin.regions.regionName(S2.S2Cell.FromLatLng(map.getCenter(), 6));
  
  matches.forEach(function(match) {
    if(!match[1])
      match[1] = currentCell.substr(0, 2);
    else
      match[1] = match[1].toUpperCase();
    
    if(!match[2])
      match[2] = currentCell.substr(2,2);
    
    match[3] = match[3].toUpperCase();
    
    var result = window.plugin.regions.getSearchResult(match);
    if(result) query.addResult(result);
  });
}

// rot and d2xy from Wikipedia
window.plugin.regions.rot = function(n, x, y, rx, ry) {
  if(ry == 0) {
    if(rx == 1) {
      x = n-1 - x;
      y = n-1 - y;
    }

    return [y, x];
  }
  return [x, y];
}
window.plugin.regions.d2xy = function(n, d) {
  var rx, ry, s, t = d, xy = [0, 0];
  for(s=1; s<n; s*=2) {
    rx = 1 & (t/2);
    ry = 1 & (t ^ rx);
    xy = window.plugin.regions.rot(s, xy[0], xy[1], rx, ry);
    xy[0] += s * rx;
    xy[1] += s * ry;
    t /= 4;
  }
  return xy;
}

window.plugin.regions.getSearchResult = function(match) {
  var faceId = window.plugin.regions.FACE_NAMES.indexOf(match[1]);
  var id1 = parseInt(match[2]);
  var codeWordId = window.plugin.regions.CODE_WORDS.indexOf(match[3]);
  var id2 = match[4] === undefined ? undefined : parseInt(match[4]);

  if(faceId === -1 || id1 < 1 && id1 > 16 || codeWordId === -1 || id2 < 0 || id2 > 15) return;

  // looks good. now we need the face/i/j values for this cell

  // face is used as-is

  // id1 is the region 'i' value (first 4 bits), codeword is the 'j' value (first 4 bits)
  var regionI = id1-1;
  var regionJ = codeWordId;

  var result = {}, level;

  if(id2 === undefined) {
    result.description = 'Regional score cells (cluster of 16 cells)';
    result.icon = 'data:image/svg+xml;base64,'+btoa('@@INCLUDESTRING:images/icon-cell.svg@@'.replace(/orange/, 'gold'));
    level = 4;
  } else {
    result.description = 'Regional score cell';
    result.icon = 'data:image/svg+xml;base64,'+btoa('@@INCLUDESTRING:images/icon-cell.svg@@');
    level = 6;

    var xy = window.plugin.regions.d2xy(4, id2);
    regionI = (regionI << 2) + xy[0];
    regionJ = (regionJ << 2) + xy[1];
  }

  // as in the name-construction above, for odd numbered faces, the I and J need swapping
  var cell = (faceId % 2 == 1)
    ? S2.S2Cell.FromFaceIJ(faceId, [regionJ,regionI], level)
    : S2.S2Cell.FromFaceIJ(faceId, [regionI,regionJ], level);

  var corners = cell.getCornerLatLngs();

  result.title = window.plugin.regions.regionName(cell);
  result.layer = L.geodesicPolygon(corners, { fill: false, color: 'red', clickable: false });
  result.bounds = L.latLngBounds(corners);

  return result;
}

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

  var globalCellOptions = {color: 'red', weight: 7, opacity: 0.5, clickable: false };

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
  var region = L.geodesicPolyline([corners[0],corners[1],corners[2]], {fill: false, color: color, opacity: 0.5, weight: 5, clickable: false });

  window.plugin.regions.regionLayer.addLayer(region);

// move the label if we're at a high enough zoom level and it's off screen
  if (map.getZoom() >= 9) {
    var namebounds = map.getBounds().pad(-0.1); // pad 10% inside the screen bounds
    if (!namebounds.contains(center)) {
      // name is off-screen. pull it in so it's inside the bounds
      var newlat = Math.max(Math.min(center.lat, namebounds.getNorth()), namebounds.getSouth());
      var newlng = Math.max(Math.min(center.lng, namebounds.getEast()), namebounds.getWest());

      var newpos = L.latLng(newlat,newlng);

      // ensure the new position is still within the same cell
      var newposcell = S2.S2Cell.FromLatLng ( newpos, 6 );
      if ( newposcell.toString() == cell.toString() ) {
        center=newpos;
      }
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
