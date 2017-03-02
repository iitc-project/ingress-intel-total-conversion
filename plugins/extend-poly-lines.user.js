// ==UserScript==
// @id             extend-poly-lines@dsnedecor
// @name           IITC plugin: Extend Poly Lines
// @category       Layer
// @version        1.1.0.@@DATETIMEVERSION@@
// @namespace      raw.githubusercontent.com
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Extends the lines of polygons and polylines out past their vertices. This may be useful for determining which portals can be used for a layered field. Requires draw-tools plugin.
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

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.extendPolyLines = function() {};

window.plugin.extendPolyLines.polygonLinesLayerGroup = null;
window.plugin.extendPolyLines.polylineLinesLayerGroup = null

window.plugin.extendPolyLines.updateLayer = function() {
  var drawPolygonLines = window.map.hasLayer(window.plugin.extendPolyLines.polygonLinesLayerGroup);
  var drawPolylineLines = window.map.hasLayer(window.plugin.extendPolyLines.polylineLinesLayerGroup);
  if (!(drawPolygonLines || drawPolylineLines))
    return;

  //var vincenty_ellipsoid = { a: 6378137, b: 6356752.3142, f: 1/298.257223563 }; // WGS-84
  var vincenty_ellipsoid = { a: 6367000, b: 6367000, f: 0 }; // Sphere

  // From Leaflet.Geodesic (https://github.com/henrythasler/Leaflet.Geodesic/)
  var vincenty_inverse =  function (p1, p2) {
    var φ1 = p1.lat.toRadians(), λ1 = p1.lng.toRadians();
    var φ2 = p2.lat.toRadians(), λ2 = p2.lng.toRadians();

    var a = vincenty_ellipsoid.a, b = vincenty_ellipsoid.b, f = vincenty_ellipsoid.f;

    var L = λ2 - λ1;
    var tanU1 = (1-f) * Math.tan(φ1), cosU1 = 1 / Math.sqrt((1 + tanU1*tanU1)), sinU1 = tanU1 * cosU1;
    var tanU2 = (1-f) * Math.tan(φ2), cosU2 = 1 / Math.sqrt((1 + tanU2*tanU2)), sinU2 = tanU2 * cosU2;

    var λ = L, λʹ, iterations = 0;
    do {
      var sinλ = Math.sin(λ), cosλ = Math.cos(λ);
      var sinSqσ = (cosU2*sinλ) * (cosU2*sinλ) + (cosU1*sinU2-sinU1*cosU2*cosλ) * (cosU1*sinU2-sinU1*cosU2*cosλ);
      var sinσ = Math.sqrt(sinSqσ);
      if (sinσ==0) return 0;  // co-incident points
      var cosσ = sinU1*sinU2 + cosU1*cosU2*cosλ;
      var σ = Math.atan2(sinσ, cosσ);
      var sinα = cosU1 * cosU2 * sinλ / sinσ;
      var cosSqα = 1 - sinα*sinα;
      var cos2σM = cosσ - 2*sinU1*sinU2/cosSqα;
      if (isNaN(cos2σM)) cos2σM = 0;  // equatorial line: cosSqα=0 (§6)
      var C = f/16*cosSqα*(4+f*(4-3*cosSqα));
      λʹ = λ;
      λ = L + (1-C) * f * sinα * (σ + C*sinσ*(cos2σM+C*cosσ*(-1+2*cos2σM*cos2σM)));
    } while (Math.abs(λ-λʹ) > 1e-12 && ++iterations<100);
    if (iterations>=100) {
      console.log('Formula failed to converge. Altering target position.')
      return this._vincenty_inverse(p1, {lat: p2.lat, lng:p2.lng-0.01})
      //  throw new Error('Formula failed to converge');
    }

    var uSq = cosSqα * (a*a - b*b) / (b*b);
    var A = 1 + uSq/16384*(4096+uSq*(-768+uSq*(320-175*uSq)));
    var B = uSq/1024 * (256+uSq*(-128+uSq*(74-47*uSq)));
    var Δσ = B*sinσ*(cos2σM+B/4*(cosσ*(-1+2*cos2σM*cos2σM)-
      B/6*cos2σM*(-3+4*sinσ*sinσ)*(-3+4*cos2σM*cos2σM)));

    var s = b*A*(σ-Δσ);

    var fwdAz = Math.atan2(cosU2*sinλ,  cosU1*sinU2-sinU1*cosU2*cosλ);
    var revAz = Math.atan2(cosU1*sinλ, -sinU1*cosU2+cosU1*sinU2*cosλ);

    s = Number(s.toFixed(3)); // round to 1mm precision
    return { distance: s, initialBearing: fwdAz.toDegrees(), finalBearing: revAz.toDegrees() };
  };

  //From Leaflet.Geodesic (https://github.com/henrythasler/Leaflet.Geodesic/)
  var vincenty_direct = function (p1, initialBearing, distance, wrap) {
    var φ1 = p1.lat.toRadians(), λ1 = p1.lng.toRadians();
    var α1 = initialBearing.toRadians();
    var s = distance;

    var a = vincenty_ellipsoid.a, b = vincenty_ellipsoid.b, f = vincenty_ellipsoid.f;

    var sinα1 = Math.sin(α1);
    var cosα1 = Math.cos(α1);

    var tanU1 = (1-f) * Math.tan(φ1), cosU1 = 1 / Math.sqrt((1 + tanU1*tanU1)), sinU1 = tanU1 * cosU1;
    var σ1 = Math.atan2(tanU1, cosα1);
    var sinα = cosU1 * sinα1;
    var cosSqα = 1 - sinα*sinα;
    var uSq = cosSqα * (a*a - b*b) / (b*b);
    var A = 1 + uSq/16384*(4096+uSq*(-768+uSq*(320-175*uSq)));
    var B = uSq/1024 * (256+uSq*(-128+uSq*(74-47*uSq)));

    var σ = s / (b*A), σʹ, iterations = 0;
    do {
      var cos2σM = Math.cos(2*σ1 + σ);
      var sinσ = Math.sin(σ);
      var cosσ = Math.cos(σ);
      var Δσ = B*sinσ*(cos2σM+B/4*(cosσ*(-1+2*cos2σM*cos2σM)-
          B/6*cos2σM*(-3+4*sinσ*sinσ)*(-3+4*cos2σM*cos2σM)));
      σʹ = σ;
      σ = s / (b*A) + Δσ;
    } while (Math.abs(σ-σʹ) > 1e-12 && ++iterations);

    var x = sinU1*sinσ - cosU1*cosσ*cosα1;
    var φ2 = Math.atan2(sinU1*cosσ + cosU1*sinσ*cosα1, (1-f)*Math.sqrt(sinα*sinα + x*x));
    var λ = Math.atan2(sinσ*sinα1, cosU1*cosσ - sinU1*sinσ*cosα1);
    var C = f/16*cosSqα*(4+f*(4-3*cosSqα));
    var L = λ - (1-C) * f * sinα *
      (σ + C*sinσ*(cos2σM+C*cosσ*(-1+2*cos2σM*cos2σM)));

    if(wrap)
      var λ2 = (λ1+L+3*Math.PI)%(2*Math.PI) - Math.PI; // normalise to -180...+180
    else
      var λ2 = (λ1+L); // do not normalize

    var revAz = Math.atan2(sinα, -x);

    return {lat: φ2.toDegrees(),
      lng: λ2.toDegrees(),
      finalBearing: revAz.toDegrees()
    };
  };

  var drawLink = function(a, b, style, layerGroup) {
    var poly = L.geodesicPolyline([a, b], style);
    poly.addTo(layerGroup);
  };

  var extendEdge = function(a,b,layerGroup) {
    if(!a || !b) return;
    if(a.equals(b)) return;
    var inverse = vincenty_inverse(a,b);
    var maxLinkDistance = 6881280;
    var maxLinkToAnchor = maxLinkDistance - inverse.distance;
    if(maxLinkToAnchor < 0) return;
    var direct = vincenty_direct(b, inverse.finalBearing, maxLinkToAnchor, true);
    var c = new L.LatLng(direct.lat, direct.lng);
    drawLink(b, c, {
      color: '#FF0000',
      opacity: 1,
      weight: 1.5,
      clickable: false,
      smoothFactor: 1,
      dashArray: [6, 4],
    }, layerGroup);
  };

  var processPolygon = function(layer) {
    var vertices = layer.getLatLngs();

    $.each(vertices, function(idx, vertex) {
      var previousVertex = (idx === 0) ? vertices[vertices.length - 1] : vertices[idx - 1];
      var nextVertex = (idx === (vertices.length - 1)) ? vertices[0] : vertices[idx + 1];
      extendEdge(previousVertex, vertex, window.plugin.extendPolyLines.polygonLinesLayerGroup);
      extendEdge(nextVertex, vertex, window.plugin.extendPolyLines.polygonLinesLayerGroup);
    });
  };

  var processPolyline = function(layer) {
    var vertices = layer.getLatLngs();

    $.each(vertices, function(idx, vertex) {
      var previousVertex = idx === 0 ? null : vertices[idx - 1];
      var nextVertex = idx === (vertices.length - 1) ? null : vertices[idx + 1];
      extendEdge(previousVertex, vertex, window.plugin.extendPolyLines.polylineLinesLayerGroup);
      extendEdge(nextVertex, vertex, window.plugin.extendPolyLines.polylineLinesLayerGroup);
    });
  };

  window.plugin.extendPolyLines.polygonLinesLayerGroup.clearLayers();
  window.plugin.extendPolyLines.polylineLinesLayerGroup.clearLayers();

  window.plugin.drawTools.drawnItems.eachLayer(function(layer) {
    if (layer instanceof L.GeodesicPolygon)
      processPolygon(layer);
    else if (layer instanceof L.GeodesicPolyline)
      processPolyline(layer);
  });
}

window.plugin.extendPolyLines.setup = function() {
  window.plugin.extendPolyLines.polygonLinesLayerGroup = new L.LayerGroup();
  window.plugin.extendPolyLines.polylineLinesLayerGroup = new L.LayerGroup();

  window.addHook('iitcLoaded', function(e) {
    window.plugin.extendPolyLines.updateLayer();
  });

  window.map.on('layeradd', function(e) {
    if (e.layer === window.plugin.extendPolyLines.polygonLinesLayerGroup)
      window.plugin.extendPolyLines.updateLayer();
  });

  window.map.on('zoomend', function(e) {
    window.plugin.extendPolyLines.updateLayer();
  });

  window.map.on('layerremove', function(e) {
    if (e.layer === window.plugin.extendPolyLines.polygonLinesLayerGroup)
      window.plugin.extendPolyLines.updateLayer();
  });

  window.addHook('pluginDrawTools', function(e) {
    window.plugin.extendPolyLines.updateLayer();
  });

  window.addLayerGroup('Extend Polygon Lines', window.plugin.extendPolyLines.polygonLinesLayerGroup, false);
  window.addLayerGroup('Extend Polyline Lines', window.plugin.extendPolyLines.polylineLinesLayerGroup, false);
}
var setup = window.plugin.extendPolyLines.setup;


/** Extend Number object with method to convert numeric degrees to radians */
if (typeof Number.prototype.toRadians == 'undefined') {
    Number.prototype.toRadians = function() { return this * Math.PI / 180; }
}

/** Extend Number object with method to convert radians to numeric (signed) degrees */
if (typeof Number.prototype.toDegrees == 'undefined') {
    Number.prototype.toDegrees = function() { return this * 180 / Math.PI; }
}
// PLUGIN END //////////////////////////////////////////////////////////


@@PLUGINEND@@
