// ==UserScript==
// @id             max-links@boombuler
// @name           IITC plugin: Max Links
// @category       Layer
// @version        0.4.3.20181101.60209
// @updateURL      none
// @downloadURL    none
// @description    [mobile-2018-11-01-060209] Calculate how to link the portals to create a reasonably tidy set of links/fields. Enable from the layer chooser. (Max Links is a poor name, but remains for historical reasons.)
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
plugin_info.pluginId = 'max-links';
//END PLUGIN AUTHORS NOTE



// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.maxLinks = function() {};

// const values
window.plugin.maxLinks.MAX_PORTALS_TO_LINK = 200;
// zoom level used for projecting points between latLng and pixel coordinates. may affect precision of triangulation
window.plugin.maxLinks.PROJECT_ZOOM = 16;

window.plugin.maxLinks.STROKE_STYLE = {
  color: '#FF0000',
  opacity: 1,
  weight: 1.5,
  clickable: false,
  dashArray: [6,4],
  smoothFactor: 10,
};
window.plugin.maxLinks.layer = null;
window.plugin.maxLinks.errorMarker = null;



window.plugin.maxLinks.addErrorMarker = function() {
  if (window.plugin.maxLinks.errorMarker == null) {
    window.plugin.maxLinks.errorMarker = L.marker (window.map.getCenter(), {
      icon: L.divIcon({
        className: 'max-links-error',
        iconSize: [300,30],
        html: 'Tidy Links: too many portals!'
      }),
      clickable: false
    });

    window.map.addLayer(window.plugin.maxLinks.errorMarker);
  }

}

window.plugin.maxLinks.clearErrorMarker = function() {
  if (window.plugin.maxLinks.errorMarker != null) {
    window.map.removeLayer(window.plugin.maxLinks.errorMarker);
    window.plugin.maxLinks.errorMarker = null;
  }
}


window.plugin.maxLinks.updateLayer = function() {
  if (!window.map.hasLayer(window.plugin.maxLinks.layer))
    return;

  window.plugin.maxLinks.layer.clearLayers();

  var locations = [];

  var bounds = map.getBounds();
  $.each(window.portals, function(guid, portal) {
    var ll = portal.getLatLng();
    if (bounds.contains(ll)) {
      var p = map.project (portal.getLatLng(), window.plugin.maxLinks.PROJECT_ZOOM);
      locations.push(p);
      if (locations.length > window.plugin.maxLinks.MAX_PORTALS_TO_LINK) return false; //$.each break
    }
  });

  if (locations.length > window.plugin.maxLinks.MAX_PORTALS_TO_LINK) {
    window.plugin.maxLinks.addErrorMarker();
    return;
  }

  var triangles = window.delaunay.triangulate(locations);

  var drawnLinkCount = 0;

  var orderedPoints = function(a,b) {
    if(a.x<b.x) return [a,b];
    if(a.x==b.x && a.y<b.y) return [a,b];
    return [b,a];
  }
  var drawnLinks = {};

  //draw a link, but only if it hasn't already been drawn
  var drawLink = function(a,b) {
    //order the points, so a pair of coordinates in any order is handled in one direction only
    var points = orderedPoints(a,b);
    a=points[0];
    b=points[1];

    //do we have a line already drawn from a to b?
    if(!(a in drawnLinks)) {
      //no lines from a to anywhere yet - create an empty target array
      drawnLinks[a] = {};
    }

    if (!(b in drawnLinks[a])) {
      //no line from a to b yet

      //using drawnLinks[a] as a set - so the stored value is of no importance
      drawnLinks[a][b] = null;

      // convert back from x/y coordinates to lat/lng for drawing
      var alatlng = map.unproject (a, window.plugin.maxLinks.PROJECT_ZOOM);
      var blatlng = map.unproject (b, window.plugin.maxLinks.PROJECT_ZOOM);

      var poly = L.polyline([alatlng, blatlng], window.plugin.maxLinks.STROKE_STYLE);
      poly.addTo(window.plugin.maxLinks.layer);
      drawnLinkCount++;
    }
  }

  $.each(triangles, function(idx, triangle) {
    drawLink(triangle.a,triangle.b);
    drawLink(triangle.b,triangle.c);
    drawLink(triangle.c,triangle.a);
  });
}

window.plugin.maxLinks.setup = function() {
  try { console.log('Loading delaunay JS now'); } catch(e) {}
   // Source from https://github.com/ironwallaby/delaunay
 
 window.delaunay = function() {};
 
 window.delaunay.Triangle = function (a, b, c) {
        this.a = a
        this.b = b
        this.c = c

        var A = b.x - a.x,
            B = b.y - a.y,
            C = c.x - a.x,
            D = c.y - a.y,
            E = A * (a.x + b.x) + B * (a.y + b.y),
            F = C * (a.x + c.x) + D * (a.y + c.y),
            G = 2 * (A * (c.y - b.y) - B * (c.x - b.x)),
            minx, miny, dx, dy
  
        /* If the points of the triangle are collinear, then just find the
         * extremes and use the midpoint as the center of the circumcircle. */
        if(Math.abs(G) < 1e-12) {
          minx = Math.min(a.x, b.x, c.x)
          miny = Math.min(a.y, b.y, c.y)
          dx   = (Math.max(a.x, b.x, c.x) - minx) * 0.5
          dy   = (Math.max(a.y, b.y, c.y) - miny) * 0.5

          this.x = minx + dx
          this.y = miny + dy
          this.r = dx * dx + dy * dy
        }

        else {
          this.x = (D*E - B*F) / G
          this.y = (A*F - C*E) / G
          dx = this.x - a.x
          dy = this.y - a.y
          this.r = dx * dx + dy * dy
        }
      }

      function byX(a, b) {
        return b.x - a.x
      }

      function dedup(edges) {
        var j = edges.length,
            a, b, i, m, n

        outer: while(j) {
          b = edges[--j]
          a = edges[--j]
          i = j
          while(i) {
            n = edges[--i]
            m = edges[--i]
            if((a === m && b === n) || (a === n && b === m)) {
              edges.splice(j, 2)
              edges.splice(i, 2)
              j -= 2
              continue outer
            }
          }
        }
      }

  window.delaunay.triangulate = function (vertices) {
        /* Bail if there aren't enough vertices to form any triangles. */
        if(vertices.length < 3)
          return []

        /* Ensure the vertex array is in order of descending X coordinate
         * (which is needed to ensure a subquadratic runtime), and then find
         * the bounding box around the points. */
        vertices.sort(byX)

        var i    = vertices.length - 1,
            xmin = vertices[i].x,
            xmax = vertices[0].x,
            ymin = vertices[i].y,
            ymax = ymin

        while(i--) {
          if(vertices[i].y < ymin) ymin = vertices[i].y
          if(vertices[i].y > ymax) ymax = vertices[i].y
        }

        /* Find a supertriangle, which is a triangle that surrounds all the
         * vertices. This is used like something of a sentinel value to remove
         * cases in the main algorithm, and is removed before we return any
         * results.
         * 
         * Once found, put it in the "open" list. (The "open" list is for
         * triangles who may still need to be considered; the "closed" list is
         * for triangles which do not.) */
        var dx     = xmax - xmin,
            dy     = ymax - ymin,
            dmax   = (dx > dy) ? dx : dy,
            xmid   = (xmax + xmin) * 0.5,
            ymid   = (ymax + ymin) * 0.5,
            open   = [
              new window.delaunay.Triangle(
                {x: xmid - 20 * dmax, y: ymid -      dmax, __sentinel: true},
                {x: xmid            , y: ymid + 20 * dmax, __sentinel: true},
                {x: xmid + 20 * dmax, y: ymid -      dmax, __sentinel: true}
              )
            ],
            closed = [],
            edges = [],
            j, a, b

        /* Incrementally add each vertex to the mesh. */
        i = vertices.length
        while(i--) {
          /* For each open triangle, check to see if the current point is
           * inside it's circumcircle. If it is, remove the triangle and add
           * it's edges to an edge list. */
          edges.length = 0
          j = open.length
          while(j--) {
            /* If this point is to the right of this triangle's circumcircle,
             * then this triangle should never get checked again. Remove it
             * from the open list, add it to the closed list, and skip. */
            dx = vertices[i].x - open[j].x
            if(dx > 0 && dx * dx > open[j].r) {
              closed.push(open[j])
              open.splice(j, 1)
              continue
            }

            /* If not, skip this triangle. */
            dy = vertices[i].y - open[j].y
            if(dx * dx + dy * dy > open[j].r)
              continue

            /* Remove the triangle and add it's edges to the edge list. */
            edges.push(
              open[j].a, open[j].b,
              open[j].b, open[j].c,
              open[j].c, open[j].a
            )
            open.splice(j, 1)
          }

          /* Remove any doubled edges. */
          dedup(edges)

          /* Add a new triangle for each edge. */
          j = edges.length
          while(j) {
            b = edges[--j]
            a = edges[--j]
            open.push(new window.delaunay.Triangle(a, b, vertices[i]))
          }
        }

        /* Copy any remaining open triangles to the closed list, and then
         * remove any triangles that share a vertex with the supertriangle. */
        Array.prototype.push.apply(closed, open)

        i = closed.length
        while(i--)
          if(closed[i].a.__sentinel ||
             closed[i].b.__sentinel ||
             closed[i].c.__sentinel)
            closed.splice(i, 1)

        /* Yay, we're done! */
        return closed
      }

  try { console.log('done loading delaunay JS'); } catch(e) {}

  window.plugin.maxLinks.layer = L.layerGroup([]);

  window.addHook('mapDataRefreshEnd', function(e) {
    window.plugin.maxLinks.updateLayer();
  });

  window.addHook('mapDataRefreshStart', function(e) {
    window.plugin.maxLinks.clearErrorMarker();
  });

  window.map.on('layeradd', function(e) {
    if (e.layer === window.plugin.maxLinks.layer)
      window.plugin.maxLinks.updateLayer();
  });
  window.map.on('layerremove', function(e) {
    if (e.layer === window.plugin.maxLinks.layer)
      window.plugin.maxLinks.clearErrorMarker();
  });

  window.addLayerGroup('Tidy Links (was Max Links)', window.plugin.maxLinks.layer, false);

  $('head').append('<style>'+
    '.max-links-error { color: #F88; font-size: 20px; font-weight: bold; text-align: center; text-shadow: -1px -1px #000, 1px -1px #000, -1px 1px #000, 1px 1px #000; background-color: rgba(0,0,0,0.6); border-radius: 5px; }'+
    '</style>');


}
var setup = window.plugin.maxLinks.setup;

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


