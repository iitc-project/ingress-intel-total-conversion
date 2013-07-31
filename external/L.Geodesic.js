/*
Geodesic extension to Leaflet library, by Fragger
https://github.com/Fragger/Leaflet.Geodesic
Version from master branch, dated Apr 26, 2013
Modified by qnstie 2013-07-17 to maintain compatibility with Leaflet.draw
*/
(function () {
  function geodesicPoly(Klass, fill) {
    return Klass.extend({
      initialize: function (latlngs, options) {
        Klass.prototype.initialize.call(this, L.geodesicConvertLines(latlngs, fill), options);
        this._latlngsinit = this._convertLatLngs(latlngs);
      },
      getLatLngs: function () {
        return this._latlngsinit;
      },
      setLatLngs: function (latlngs) {
        this._latlngsinit = this._convertLatLngs(latlngs);
        return this.redraw();
      },
      addLatLng: function (latlng) {
        this._latlngsinit.push(L.latLng(latlng));
        return this.redraw();
      },
      spliceLatLngs: function () { // (Number index, Number howMany)
        var removed = [].splice.apply(this._latlngsinit, arguments);
        this._convertLatLngs(this._latlngsinit);
        this.redraw();
        return removed;
      },
      redraw: function() {
        this._latlngs = this._convertLatLngs(L.geodesicConvertLines(this._latlngsinit, fill));
        return Klass.prototype.redraw.call(this);
      }
    });
  }
  
  function geodesicConvertLine(startLatlng, endLatlng, convertedPoints) {
    var i,
      R = 6378137, // earth radius in meters (doesn't have to be exact)
      maxlength = 5000, // meters before splitting
      d2r = L.LatLng.DEG_TO_RAD,
      r2d = L.LatLng.RAD_TO_DEG,
      lat1, lat2, lng1, lng2, dLng, d, segments,
      f, A, B, x, y, z, fLat, fLng;
  
    dLng = Math.abs(endLatlng.lng - startLatlng.lng) * d2r;
    lat1 = startLatlng.lat * d2r;
    lat2 = endLatlng.lat * d2r;
    lng1 = startLatlng.lng * d2r;
    lng2 = endLatlng.lng * d2r;

    // http://en.wikipedia.org/wiki/Great-circle_distance
    d = Math.atan2(Math.sqrt( Math.pow(Math.cos(lat2) * Math.sin(dLng), 2) + Math.pow(Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng), 2) ), Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(dLng));

    segments = Math.ceil(d * R / maxlength);
    for (i = 1; i <= segments; i++) {
      // http://williams.best.vwh.net/avform.htm#Intermediate
      f = i / segments;
      A = Math.sin((1-f)*d) / Math.sin(d);
      B = Math.sin(f*d) / Math.sin(d);
      x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
      y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
      z = A * Math.sin(lat1)                  + B * Math.sin(lat2);
      fLat = r2d * Math.atan2(z, Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));
      fLng = r2d * Math.atan2(y, x);

      convertedPoints.push(L.latLng([fLat, fLng]));
    }
  }

  L.geodesicConvertLines = function (latlngs, fill) {
    var i, j, len, geodesiclatlngs = [];
    for (i = 0, len = latlngs.length; i < len; i++) {
      if (L.Util.isArray(latlngs[i]) && typeof latlngs[i][0] !== 'number') {
        return;
      }
      latlngs[i] = L.latLng(latlngs[i]);
    }
    
    if(!fill) {
      geodesiclatlngs.push(latlngs[0]);
    }
    for (i = 0, len = latlngs.length - 1; i < len; i++) {
      geodesicConvertLine(latlngs[i], latlngs[i+1], geodesiclatlngs);
    }
    if(fill) {
      geodesicConvertLine(latlngs[len], latlngs[0], geodesiclatlngs);
    }
    return geodesiclatlngs;
  }
  
  L.GeodesicPolyline = geodesicPoly(L.Polyline, 0);
  L.GeodesicPolygon = geodesicPoly(L.Polygon, 1);

  //L.GeodesicMultiPolyline = createMulti(L.GeodesicPolyline);
  //L.GeodesicMultiPolygon = createMulti(L.GeodesicPolygon);

  /*L.GeodesicMultiPolyline = L.MultiPolyline.extend({
    initialize: function (latlngs, options) {
      L.MultiPolyline.prototype.initialize.call(this, L.geodesicConvertLines(latlngs), options);
    }
  });*/

  /*L.GeodesicMultiPolygon = L.MultiPolygon.extend({
    initialize: function (latlngs, options) {
      L.MultiPolygon.prototype.initialize.call(this, L.geodesicConvertLines(latlngs), options);
    }
  });*/

//TODO: finish this...
  L.GeodesicCircle = L.Path.extend({
    initialise: function (latlng, radius, options) {
      L.Path.prototype.initialise.call(this, options);
    }
  });


  L.geodesicPolyline = function (latlngs, options) {
    return new L.GeodesicPolyline(latlngs, options);
  };

  L.geodesicPolygon = function (latlngs, options) {
    return new L.GeodesicPolygon(latlngs, options);
  };
  
  /*
  L.geodesicMultiPolyline = function (latlngs, options) {
    return new L.GeodesicMultiPolyline(latlngs, options);
  };

  L.geodesicMultiPolygon = function (latlngs, options) {
    return new L.GeodesicMultiPolygon(latlngs, options);
  };

  */
}());
