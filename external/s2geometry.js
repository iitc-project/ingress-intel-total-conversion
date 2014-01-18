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
// - u,v scaled to s,t (i,j?) with quadratic formula
// - s,t (i,j?) converted to a position along a Hubbert space-filling curve
// - combine face,position to get the cell id



(function() {

window.S2 = {};


S2.LatLngToXYZ = function(latLng) {
  var d2r = L.LatLng.DEG_TO_RAD;

  var phi = latLng.lat*d2r;
  var theta = latLng.lng*d2r;

  var cosphi = Math.cos(phi);

  return [Math.cos(theta)*cosphi, Math.sin(theta)*cosphi, Math.sin(phi)];
};

var largestAbsComponent = function(xyz) {
  var temp = [Math.abs(xyz[0]), Math.abs(xyz[1]), Math.abs(xyz[2])];

  if (temp[0] > temp[1]) {
    if (temp[0] > temp[2]) {
      return 0;
    } else {
      return 1;
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

var singleSTtoUV = function(st) {

  if (st >= 0.5) {
    return (1/3.0) * (4*st*st - 1);
  } else {
    return (1/3.0) * (1 - (4*(1-st)*(1-st)));
  }
}

var singleUVtoST = function(uv) {
  if (uv >= 0) {
    return 0.5 * Math.sqrt (1 + 3*uv);
  } else {
    return 1 - 0.5 * Math.sqrt (1 - 3*uv);
  }
}


S2.XYZToFaceUV = function(xyz) {
  var face = largestAbsComponent(xyz);

  if (xyz[face] < 0) {
    face += 3;
  }

  uv = faceXYZToUV (face,xyz);

  return [face, uv];
};

S2.UVToST = function(uv) {
  return [singleUVToST(uv[0]), singleUVToST(uv[1])];
};


var singleSTtoIJ = function(st) {
  var ij = Math.floor(st * kMaxSize);
  return Math.max(0, Math.min(kMaxSize-1, ij));
};


})();
