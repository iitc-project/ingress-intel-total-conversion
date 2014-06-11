// ==UserScript==
// @id             iitc-plugin-cross-links@mcben
// @name           IITC plugin: cross links
// @category       Layer
// @version        1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [McBen] requires drawtool! coloring of link collision
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

window.plugin.crossLinks = function() {};

// Great Circle Arc Intersection
// http://geospatialmethods.org/spheres/GCAIntersect.html
function intersect(a, b) {
    var PI = Math.PI,
        radians = PI / 180,
        ε = 1e-6;

  var λ0 = a[0][0],
      λ1 = a[1][0],
      λ2 = b[0][0],
      λ3 = b[1][0],
      δλ0 = λ1 - λ0,
      δλ1 = λ3 - λ2,
      aδλ0 = Math.abs(δλ0),
      aδλ1 = Math.abs(δλ1),
      sλ0 = aδλ0 > 180,
      sλ1 = aδλ1 > 180,
      φ0 = a[0][1] * radians,
      φ1 = a[1][1] * radians,
      φ2 = b[0][1] * radians,
      φ3 = b[1][1] * radians,
      t;

  // Ensure λ0 ≤ λ1 and λ2 ≤ λ3.
  if (δλ0 < 0) t = λ0, λ0 = λ1, λ1 = t, t = φ0, φ0 = φ1, φ1 = t;
  if (δλ1 < 0) t = λ2, λ2 = λ3, λ3 = t, t = φ2, φ2 = φ3, φ3 = t;

  // Check if longitude ranges overlap.
  // TODO handle antimeridian crossings.
  if (!sλ0 && !sλ1 && (λ0 > λ3 || λ2 > λ1)) return;

  // Check for polar endpoints.
  if (Math.abs(Math.abs(φ0) - PI / 2) < ε) λ0 = λ1, aδλ0 = δλ0 = 0, sλ0 = false;
  if (Math.abs(Math.abs(φ1) - PI / 2) < ε) λ1 = λ0, aδλ0 = δλ0 = 0, sλ0 = false;
  if (Math.abs(Math.abs(φ2) - PI / 2) < ε) λ2 = λ3, aδλ1 = δλ1 = 0, sλ1 = false;
  if (Math.abs(Math.abs(φ3) - PI / 2) < ε) λ3 = λ2, aδλ1 = δλ1 = 0, sλ1 = false;

  // Check for arcs along meridians.
  var m0 = aδλ0 < ε || Math.abs(aδλ0 - 180) < ε,
      m1 = aδλ1 < ε || Math.abs(aδλ1 - 180) < ε;

  λ0 *= radians, λ1 *= radians, λ2 *= radians, λ3 *= radians;

  // Intersect two great circles and check the two intersection points against
  // the longitude ranges.  The intersection points are simply the cross
  // product of the great-circle normals ±n1⨯n2.

  // First plane.
  var cosφ,
      x0 = (cosφ = Math.cos(φ0)) * Math.cos(λ0),
      y0 = cosφ * Math.sin(λ0),
      z0 = Math.sin(φ0),
      x1 = (cosφ = Math.cos(φ1)) * Math.cos(λ1),
      y1 = cosφ * Math.sin(λ1),
      z1 = Math.sin(φ1),
      n0x = y0 * z1 - z0 * y1,
      n0y = z0 * x1 - x0 * z1,
      n0z = x0 * y1 - y0 * x1,
      m = length(n0x, n0y, n0z);

  n0x /= m, n0y /= m, n0z /= m;

  // Second plane.
  var x2 = (cosφ = Math.cos(φ2)) * Math.cos(λ2),
      y2 = cosφ * Math.sin(λ2),
      z2 = Math.sin(φ2),
      x3 = (cosφ = Math.cos(φ3)) * Math.cos(λ3),
      y3 = cosφ * Math.sin(λ3),
      z3 = Math.sin(φ3),
      n1x = y2 * z3 - z2 * y3,
      n1y = z2 * x3 - x2 * z3,
      n1z = x2 * y3 - y2 * x3,
      m = length(n1x, n1y, n1z);

  n1x /= m, n1y /= m, n1z /= m;

  var Nx = n0y * n1z - n0z * n1y,
      Ny = n0z * n1x - n0x * n1z,
      Nz = n0x * n1y - n0y * n1x;

  if (length(Nx, Ny, Nz) < ε) return;

  var λ = Math.atan2(Ny, Nx);
  if ((sλ0 ^ (λ0 <= λ && λ <= λ1) || m0 && Math.abs(λ - λ0) < ε) && (sλ1 ^ (λ2 <= λ && λ <= λ3) || m1 && Math.abs(λ - λ2) < ε) || (Nz = -Nz,
      (sλ0 ^ (λ0 <= (λ = (λ + 2 * PI) % (2 * PI) - PI) && λ <= λ1) || m0 && Math.abs(λ - λ0) < ε) && (sλ1 ^ (λ2 <= λ && λ <= λ3) || m1 && Math.abs(λ - λ2) < ε))) {
    var φ = Math.asin(Nz / length(Nx, Ny, Nz));
    if (m0 || m1) {
      if (m1) φ0 = φ2, φ1 = φ3, λ0 = λ2, λ1 = λ3, aδλ0 = aδλ1;
      if (aδλ0 > ε) return φ0 + φ1 > 0 ^ φ < (Math.abs(λ - λ0) < ε ? φ0 : φ1) ? [λ / radians, φ / radians] : null;
      // Ensure φ0 ≤ φ1.
      if (φ1 < φ0) t = φ0, φ0 = φ1, φ1 = t;
      return Math.abs(λ - (m0 ? λ0 : λ2)) < ε && φ0 <= φ && φ <= φ1 ? [λ / radians, φ / radians] : null;
    }
    return [λ / radians, φ / radians];
  }
}

function length(x, y, z) {
  return Math.sqrt(x * x + y * y + z * z);
}

window.plugin.crossLinks.testPolyLine = function (polyline, link) {
    var a= [[link[0].lat,link[0].lng],[link[1].lat,link[1].lng]];
    for (var i=0;i<polyline.length-1;++i) {

        var b= [[polyline[i].lat,polyline[i].lng],[polyline[i+1].lat,polyline[i+1].lng]];
        if (intersect(a,b)) return true;
    }

    return false;
}

function isPointInPolygon(poly, point)  {
    // src: http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
    var c = false;
    var p2 = poly[0];
    for (var i = 1; i < poly.length; ++i) {
        var p1 = poly[i];
        if ( ((p1.lng > point.lng) != (p2.lng>point.lng)) &&
             (point.lat < (p2.lat - p1.lat)*(point.lng-p1.lng) / (p2.lng-p1.lng) + p1.lat))
                c = !c;

        p2 = p1;
  }
  return c;
}

window.plugin.crossLinks.testPolygons = function (polygons, link) {

    var linkline= L.geodesicConvertLines(link._latlngs,0);

    for (var pidx=0;pidx<polygons.length;++pidx) {
        if (isPointInPolygon(polygons[pidx],linkline[0])) return true;
    }

    return false;
  }

window.plugin.crossLinks.onLinkAdded = function (data) {
  	if (window.plugin.crossLinks.disabled) return;

    var link = data.link;

    window.plugin.drawTools.drawnItems.eachLayer( function(layer) {
       if (layer instanceof L.GeodesicPolygon) {
           latlngs = layer.getLatLngs();
           latlngs.push(latlngs[0]);
           if (window.plugin.crossLinks.testPolyLine(latlngs, link.getLatLngs())) {
               plugin.crossLinks.showLink(link.getLatLngs());
           }
          // TODO: rework inside-polygons
/*
            var polyline= [drawline];
            } else if (window.plugin.crossLinks.testPolygons([drawline], link)) {
                link.setStyle (window.plugin.crossLinks.STYLE_INSIDEPOLY);
            }
*/
        } else if (layer instanceof L.GeodesicPolyline) {

            if (window.plugin.crossLinks.testPolyLine(layer.getLatLngs(), link.getLatLngs())) {
                plugin.crossLinks.showLink(link.getLatLngs());
            }
        }
    });
}

window.plugin.crossLinks.checkAllLinks = function() {
  	console.debug("Cross-Links: checking links");
    if (window.plugin.crossLinks.disabled) return;

	plugin.crossLinks.linkLayer.clearLayers();

	// check all links
  	$.each(window.links, function(guid, link) {

      window.plugin.drawTools.drawnItems.eachLayer( function(layer) {
         if (layer instanceof L.GeodesicPolyline) {
            if (window.plugin.crossLinks.testPolyLine(layer.getLatLngs(), link.getLatLngs())) {
    	       plugin.crossLinks.showLink(link.getLatLngs());
               return false;
            }
         } else if (layer instanceof L.GeodesicPolygon) {
           latlngs = layer.getLatLngs();
           latlngs.push(latlngs[0]);
           if (window.plugin.crossLinks.testPolyLine(latlngs, link.getLatLngs())) {
               plugin.crossLinks.showLink(link.getLatLngs());
           }
          // TODO: rework inside-polygons
         }
      });
    });
}

window.plugin.crossLinks.showLink = function(latlngs) {

  var poly = L.geodesicPolyline(latlngs, {
    color: '#f11',
    opacity: 0.7,
    weight: 4,
    clickable: false,
  });

  poly.addTo(plugin.crossLinks.linkLayer);
};

window.plugin.crossLinks.onMapDataRefreshEnd = function () {
    if (window.plugin.crossLinks.reorderLinkLayer) {
        window.plugin.crossLinks.linkLayer.bringToFront();
        delete window.plugin.crossLinks.reorderLinkLayer;
    }
}

window.plugin.crossLinks.drawTools_save = function() {
  window.plugin.crossLinks.ori_drawTools_save();
  window.plugin.crossLinks.checkAllLinks();
 }

window.plugin.crossLinks.drawTools_load = function() {
  window.plugin.crossLinks.ori_drawTools_load();
  window.plugin.crossLinks.checkAllLinks();
 }


window.plugin.crossLinks.createLayer = function() {
    window.plugin.crossLinks.linkLayer = new L.FeatureGroup();
  	window.addLayerGroup('Cross Links', window.plugin.crossLinks.linkLayer, true);
	window.plugin.crossLinks.reorderLinkLayer = true;

  	map.on('layeradd', function(obj) {
	    if(obj.layer === window.plugin.crossLinks.linkLayer) {
    	    window.plugin.crossLinks.disabled = undefined;
        	window.plugin.crossLinks.checkAllLinks();
    	}
  	});
  	map.on('layerremove', function(obj) {
    	if(obj.layer === window.plugin.crossLinks.linkLayer) {
        	window.plugin.crossLinks.disabled = true;
    	}
  	});
}

var setup = function() {
  console.debug("Cross-Links: init");
  if (window.plugin.drawTools === undefined) {
      alert("'Cross-Links' requires 'draw-tools'");
      return;
  }

  window.plugin.crossLinks.createLayer();

  // hook 'drawTools'
  window.plugin.crossLinks.ori_drawTools_save = window.plugin.drawTools.save;
  window.plugin.drawTools.save = window.plugin.crossLinks.drawTools_save;
  window.plugin.crossLinks.ori_drawTools_load = window.plugin.drawTools.load;
  window.plugin.drawTools.load = window.plugin.crossLinks.drawTools_load;

  window.addHook('linkAdded', window.plugin.crossLinks.onLinkAdded);
  window.addHook('mapDataRefreshEnd', window.plugin.crossLinks.onMapDataRefreshEnd);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
