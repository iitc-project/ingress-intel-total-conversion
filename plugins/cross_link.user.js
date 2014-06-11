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

/* Great Circle Arc Intersection
    Conecpt in short:
       - build a plane of each arc (p1,p2,center)
       - find intersection line and intersection points on sphere
       - check if a point are on both arcs
    see: http://geospatialmethods.org/spheres/GCAIntersect.html
*/
var PI = Math.PI;
var radians = PI / 180;
var near_0 = 1e-6;

function greatCircleArcIntersect(a0,a1,b0,b1) {

    // Order points
    if (a1.lat < a0.lat) { var t=a1;a1=a0;a0=t;}
    if (b1.lat < b0.lat) { var t=b1;b1=b0;b0=t;}

    var λ0 = a0.lat,
        λ1 = a1.lat,
        λ2 = b0.lat,
        λ3 = b1.lat,
        δλ0 = λ1 - λ0,
        δλ1 = λ3 - λ2,
        sλ0 = δλ0 > 180,
        sλ1 = δλ1 > 180,
        φ0 = a0.lng * radians,
        φ1 = a1.lng * radians,
        φ2 = b0.lng * radians,
        φ3 = b1.lng * radians,
        t;

    // Check if longitude ranges overlap.
    // TODO handle antimeridian crossings.
    if (!sλ0 && !sλ1 && (λ0 > λ3 || λ2 > λ1)) return;

    // Check for polar endpoints.
    if (Math.abs(Math.abs(φ0) - PI / 2) < near_0) λ0 = λ1, δλ0 = 0, sλ0 = false;
    if (Math.abs(Math.abs(φ1) - PI / 2) < near_0) λ1 = λ0, δλ0 = 0, sλ0 = false;
    if (Math.abs(Math.abs(φ2) - PI / 2) < near_0) λ2 = λ3, δλ1 = 0, sλ1 = false;
    if (Math.abs(Math.abs(φ3) - PI / 2) < near_0) λ3 = λ2, δλ1 = 0, sλ1 = false;

    // Check for arcs along meridians.
    var m0 = δλ0 < near_0 || Math.abs(δλ0 - 180) < near_0,
        m1 = δλ1 < near_0 || Math.abs(δλ1 - 180) < near_0;

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

    if (length(Nx, Ny, Nz) < near_0) return;

    var λ = Math.atan2(Ny, Nx);
    if ( (sλ0 ^ (λ0 <= λ && λ <= λ1) || m0 && Math.abs(λ - λ0) < near_0) && (sλ1 ^ (λ2 <= λ && λ <= λ3) || m1 && Math.abs(λ - λ2) < near_0) || (Nz = -Nz,
         (sλ0 ^ (λ0 <= (λ = (λ + 2 * PI) % (2 * PI) - PI) && λ <= λ1) || m0 && Math.abs(λ - λ0) < near_0) && (sλ1 ^ (λ2 <= λ && λ <= λ3) || m1 && Math.abs(λ - λ2) < near_0))) {

        var φ = Math.asin(Nz / length(Nx, Ny, Nz));

        if (m0 || m1) {
          if (m1) φ0 = φ2, φ1 = φ3, λ0 = λ2, λ1 = λ3, δλ0 = δλ1;

          if (δλ0 > near_0)
            return (φ0 + φ1 > 0 ^ φ < (Math.abs(λ - λ0) < near_0 ? φ0 : φ1)) ? [λ / radians, φ / radians] : null;

          // Ensure φ0 ≤ φ1.
          if (φ1 < φ0) t = φ0, φ0 = φ1, φ1 = t;
          return (Math.abs(λ - (m0 ? λ0 : λ2)) < near_0 && φ0 <= φ && φ <= φ1) ? [λ / radians, φ / radians] : null;
        }

        return [λ / radians, φ / radians];
    }
}

function length(x, y, z) {
  return Math.sqrt(x * x + y * y + z * z);
}

/*
 smallCircleIntersect
 idea:
  - build the plane of the small circle: normalvector (center) and p=center+radian // E:n1*x+n2*y+n3*z=n1*p1+n2*p2+n3*p3
  - calc distance to both points // d=(n1*x+n2*y+n3*z- (n1*p1+n2*p2+n3*p3)) / length(n)
  - both >0 = inside ; one >0 = collision
*/

window.plugin.crossLinks.testPolyLine = function (polyline, link,closed) {

    var a = link.getLatLngs();
    var b = polyline.getLatLngs();

    for (var i=0;i<b.length-1;++i) {
        if (greatCircleArcIntersect(a[0],a[1],b[i],b[i+1])) return true;
    }

    if (closed) {
        if (greatCircleArcIntersect(a[0],a[1],b[b.length],b[0])) return true;
    }

    return false;
}

window.plugin.crossLinks.onLinkAdded = function (data) {
  	if (window.plugin.crossLinks.disabled) return;

    plugin.crossLinks.testLink(data.link);
}

window.plugin.crossLinks.checkAllLinks = function() {
    if (window.plugin.crossLinks.disabled) return;

  	console.debug("Cross-Links: checking all links");
	plugin.crossLinks.linkLayer.clearLayers();

  	$.each(window.links, function(guid, link) {
        plugin.crossLinks.testLink(link);
    });
}

window.plugin.crossLinks.testLink = function (link) {
    window.plugin.drawTools.drawnItems.eachLayer( function(layer) {
       if (layer instanceof L.GeodesicPolygon) {
           if (window.plugin.crossLinks.testPolyLine(layer, link,true)) {
               plugin.crossLinks.showLink(link);
           }
        } else if (layer instanceof L.GeodesicPolyline) {
            if (window.plugin.crossLinks.testPolyLine(layer, link)) {
                plugin.crossLinks.showLink(link);
            }
        }
    });
}


window.plugin.crossLinks.showLink = function(link) {

  var poly = L.geodesicPolyline(link.getLatLngs(), {
    color: '#f11',
    opacity: 0.7,
    weight: 4,
    clickable: false,
  });

  poly.addTo(plugin.crossLinks.linkLayer);
}

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
