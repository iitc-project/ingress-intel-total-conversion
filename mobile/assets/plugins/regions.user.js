// ==UserScript==
// @id             iitc-plugin-regions@jonatkins
// @name           IITC plugin: Show the local score regions
// @category       Layer
// @version        0.1.2.20181101.60209
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      none
// @downloadURL    none
// @description    [mobile-2018-11-01-060209] Show the local scoring regions on the map. No actual scores - just the region areas.
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @include        https://*.ingress.com/mission/*
// @include        http://*.ingress.com/mission/*
// @match          https://*.ingress.com/mission/*
// @match          http://*.ingress.com/mission/*
// @grant          none
// ==/UserScript==


function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

//PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
//(leaving them in place might break the 'About IITC' page or break update checks)
plugin_info.buildName = 'mobile';
plugin_info.dateTimeVersion = '20181101.60209';
plugin_info.pluginId = 'regions';
//END PLUGIN AUTHORS NOTE



// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.regions = function() {};

window.plugin.regions.setup  = function() {
  /// S2 Geometry functions
// the regional scoreboard is based on a level 6 S2 Cell
// - https://docs.google.com/presentation/d/1Hl4KapfAENAOf4gv-pSngKwvS_jwNVHRPZTTDzXXn6Q/view?pli=1#slide=id.i22
// at the time of writing there's no actual API for the intel map to retrieve scoreboard data,
// but it's still useful to plot the score cells on the intel map


// the S2 geometry is based on projecting the earth sphere onto a cube, with some scaling of face coordinates to
// keep things close to approximate equal area for adjacent cells
// to convert a lat,lng into a cell id:
// - convert lat,lng to x,y,z
// - convert x,y,z into face,u,v
// - u,v scaled to s,t with quadratic formula
// - s,t converted to integer i,j offsets
// - i,j converted to a position along a Hubbert space-filling curve
// - combine face,position to get the cell id

//NOTE: compared to the google S2 geometry library, we vary from their code in the following ways
// - cell IDs: they combine face and the hilbert curve position into a single 64 bit number. this gives efficient space
//             and speed. javascript doesn't have appropriate data types, and speed is not cricical, so we use
//             as [face,[bitpair,bitpair,...]] instead
// - i,j: they always use 30 bits, adjusting as needed. we use 0 to (1<<level)-1 instead
//        (so GetSizeIJ for a cell is always 1)

(function() {

window.S2 = {};


var LatLngToXYZ = function(latLng) {
  var d2r = Math.PI/180.0;

  var phi = latLng.lat*d2r;
  var theta = latLng.lng*d2r;

  var cosphi = Math.cos(phi);

  return [Math.cos(theta)*cosphi, Math.sin(theta)*cosphi, Math.sin(phi)];
};

var XYZToLatLng = function(xyz) {
  var r2d = 180.0/Math.PI;

  var lat = Math.atan2(xyz[2], Math.sqrt(xyz[0]*xyz[0]+xyz[1]*xyz[1]));
  var lng = Math.atan2(xyz[1], xyz[0]);

  return L.latLng(lat*r2d, lng*r2d);
};

var largestAbsComponent = function(xyz) {
  var temp = [Math.abs(xyz[0]), Math.abs(xyz[1]), Math.abs(xyz[2])];

  if (temp[0] > temp[1]) {
    if (temp[0] > temp[2]) {
      return 0;
    } else {
      return 2;
    }
  } else {
    if (temp[1] > temp[2]) {
      return 1;
    } else {
      return 2;
    }
  }

};

var faceXYZToUV = function(face,xyz) {
  var u,v;

  switch (face) {
    case 0: u =  xyz[1]/xyz[0]; v =  xyz[2]/xyz[0]; break;
    case 1: u = -xyz[0]/xyz[1]; v =  xyz[2]/xyz[1]; break;
    case 2: u = -xyz[0]/xyz[2]; v = -xyz[1]/xyz[2]; break;
    case 3: u =  xyz[2]/xyz[0]; v =  xyz[1]/xyz[0]; break;
    case 4: u =  xyz[2]/xyz[1]; v = -xyz[0]/xyz[1]; break;
    case 5: u = -xyz[1]/xyz[2]; v = -xyz[0]/xyz[2]; break;
    default: throw {error: 'Invalid face'}; break;
  }

  return [u,v];
}




var XYZToFaceUV = function(xyz) {
  var face = largestAbsComponent(xyz);

  if (xyz[face] < 0) {
    face += 3;
  }

  uv = faceXYZToUV (face,xyz);

  return [face, uv];
};

var FaceUVToXYZ = function(face,uv) {
  var u = uv[0];
  var v = uv[1];

  switch (face) {
    case 0: return [ 1, u, v];
    case 1: return [-u, 1, v];
    case 2: return [-u,-v, 1];
    case 3: return [-1,-v,-u];
    case 4: return [ v,-1,-u];
    case 5: return [ v, u,-1];
    default: throw {error: 'Invalid face'};
  }
};


var STToUV = function(st) {
  var singleSTtoUV = function(st) {
    if (st >= 0.5) {
      return (1/3.0) * (4*st*st - 1);
    } else {
      return (1/3.0) * (1 - (4*(1-st)*(1-st)));
    }
  }

  return [singleSTtoUV(st[0]), singleSTtoUV(st[1])];
};



var UVToST = function(uv) {
  var singleUVtoST = function(uv) {
    if (uv >= 0) {
      return 0.5 * Math.sqrt (1 + 3*uv);
    } else {
      return 1 - 0.5 * Math.sqrt (1 - 3*uv);
    }
  }

  return [singleUVtoST(uv[0]), singleUVtoST(uv[1])];
};


var STToIJ = function(st,order) {
  var maxSize = (1<<order);

  var singleSTtoIJ = function(st) {
    var ij = Math.floor(st * maxSize);
    return Math.max(0, Math.min(maxSize-1, ij));
  };

  return [singleSTtoIJ(st[0]), singleSTtoIJ(st[1])];
};


var IJToST = function(ij,order,offsets) {
  var maxSize = (1<<order);

  return [
    (ij[0]+offsets[0])/maxSize,
    (ij[1]+offsets[1])/maxSize
  ];
}

// hilbert space-filling curve
// based on http://blog.notdot.net/2009/11/Damn-Cool-Algorithms-Spatial-indexing-with-Quadtrees-and-Hilbert-Curves
// note: rather then calculating the final integer hilbert position, we just return the list of quads
// this ensures no precision issues whth large orders (S3 cell IDs use up to 30), and is more
// convenient for pulling out the individual bits as needed later
var pointToHilbertQuadList = function(x,y,order) {
  var hilbertMap = {
    'a': [ [0,'d'], [1,'a'], [3,'b'], [2,'a'] ],
    'b': [ [2,'b'], [1,'b'], [3,'a'], [0,'c'] ],
    'c': [ [2,'c'], [3,'d'], [1,'c'], [0,'b'] ],
    'd': [ [0,'a'], [3,'c'], [1,'d'], [2,'d'] ]  
  };

  var currentSquare='a';
  var positions = [];

  for (var i=order-1; i>=0; i--) {

    var mask = 1<<i;

    var quad_x = x&mask ? 1 : 0;
    var quad_y = y&mask ? 1 : 0;

    var t = hilbertMap[currentSquare][quad_x*2+quad_y];

    positions.push(t[0]);

    currentSquare = t[1];
  }

  return positions;
};




// S2Cell class

S2.S2Cell = function(){};

//static method to construct
S2.S2Cell.FromLatLng = function(latLng,level) {

  var xyz = LatLngToXYZ(latLng);

  var faceuv = XYZToFaceUV(xyz);
  var st = UVToST(faceuv[1]);

  var ij = STToIJ(st,level);

  return S2.S2Cell.FromFaceIJ (faceuv[0], ij, level);
};

S2.S2Cell.FromFaceIJ = function(face,ij,level) {
  var cell = new S2.S2Cell();
  cell.face = face;
  cell.ij = ij;
  cell.level = level;

  return cell;
};


S2.S2Cell.prototype.toString = function() {
  return 'F'+this.face+'ij['+this.ij[0]+','+this.ij[1]+']@'+this.level;
};

S2.S2Cell.prototype.getLatLng = function() {
  var st = IJToST(this.ij,this.level, [0.5,0.5]);
  var uv = STToUV(st);
  var xyz = FaceUVToXYZ(this.face, uv);

  return XYZToLatLng(xyz);  
};

S2.S2Cell.prototype.getCornerLatLngs = function() {
  var result = [];
  var offsets = [
    [ 0.0, 0.0 ],
    [ 0.0, 1.0 ],
    [ 1.0, 1.0 ],
    [ 1.0, 0.0 ]
  ];

  for (var i=0; i<4; i++) {
    var st = IJToST(this.ij, this.level, offsets[i]);
    var uv = STToUV(st);
    var xyz = FaceUVToXYZ(this.face, uv);

    result.push ( XYZToLatLng(xyz) );
  }
  return result;
};


S2.S2Cell.prototype.getFaceAndQuads = function() {
  var quads = pointToHilbertQuadList(this.ij[0], this.ij[1], this.level);

  return [this.face,quads];
};

S2.S2Cell.prototype.getNeighbors = function() {

  var fromFaceIJWrap = function(face,ij,level) {
    var maxSize = (1<<level);
    if (ij[0]>=0 && ij[1]>=0 && ij[0]<maxSize && ij[1]<maxSize) {
      // no wrapping out of bounds
      return S2.S2Cell.FromFaceIJ(face,ij,level);
    } else {
      // the new i,j are out of range.
      // with the assumption that they're only a little past the borders we can just take the points as
      // just beyond the cube face, project to XYZ, then re-create FaceUV from the XYZ vector

      var st = IJToST(ij,level,[0.5,0.5]);
      var uv = STToUV(st);
      var xyz = FaceUVToXYZ(face,uv);
      var faceuv = XYZToFaceUV(xyz);
      face = faceuv[0];
      uv = faceuv[1];
      st = UVToST(uv);
      ij = STToIJ(st,level);
      return S2.S2Cell.FromFaceIJ (face, ij, level);
    }
  };

  var face = this.face;
  var i = this.ij[0];
  var j = this.ij[1];
  var level = this.level;


  return [
    fromFaceIJWrap(face, [i-1,j], level),
    fromFaceIJWrap(face, [i,j-1], level),
    fromFaceIJWrap(face, [i+1,j], level),
    fromFaceIJWrap(face, [i,j+1], level)
  ];

};


})();


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
    result.icon = 'data:image/svg+xml;base64,'+btoa('<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" version="1.1">\n	<path style="fill:orange;stroke:none" d="M 1,3.5 9,0 11,8.5 3,12 z"/>\n</svg>\n'.replace(/orange/, 'gold'));
    level = 4;
  } else {
    result.description = 'Regional score cell';
    result.icon = 'data:image/svg+xml;base64,'+btoa('<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" version="1.1">\n	<path style="fill:orange;stroke:none" d="M 1,3.5 9,0 11,8.5 3,12 z"/>\n</svg>\n');
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


setup.info = plugin_info; //add the script info data to the function as a property
if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);


