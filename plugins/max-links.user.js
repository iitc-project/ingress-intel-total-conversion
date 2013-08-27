// ==UserScript==
// @id             max-links@boombuler
// @name           IITC plugin: Max Links
// @category       Layer
// @version        0.4.0.@@DATETIMEVERSION@@
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Calculates how to link the portals to create a reasonably neat set of links/fields. Enable from the layer chooser. (Max Links is a poor name, but remains for historical reasons.)
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.maxLinks = function() {};

// const values
window.plugin.maxLinks.MAX_DRAWN_LINKS = 400;
window.plugin.maxLinks.STROKE_STYLE = {
  color: '#FF0000',
  opacity: 1,
  weight: 2,
  clickable: false,
  dashArray: [8,6],
  smoothFactor: 10,
};
window.plugin.maxLinks.layer = null;

window.plugin.maxLinks._updating = false;

window.plugin.maxLinks.Point = function(x,y) {
  this.x=x;
  this.y=y;
}
window.plugin.maxLinks.Point.prototype.toString = function() {
  return this.x+","+this.y;
}

window.plugin.maxLinks.updateLayer = function() {
  if (window.plugin.maxLinks._updating ||
      window.plugin.maxLinks.layer === null ||
      !window.map.hasLayer(window.plugin.maxLinks.layer))
    return;
  window.plugin.maxLinks._updating = true;
  window.plugin.maxLinks.layer.clearLayers();

  var locations = [];

  $.each(window.portals, function(guid, portal) {
    var loc = portal.options.details.locationE6;
    var nloc = new window.plugin.maxLinks.Point(loc.latE6/1E6, loc.lngE6/1E6);
    locations.push(nloc);
  });

  var triangles = window.delaunay.triangulate(locations);

  var drawnLinkCount = 0;
  window.plugin.maxLinks._renderLimitReached = false;

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

      var poly = L.polyline([[a.x,a.y],[b.x,b.y]], window.plugin.maxLinks.STROKE_STYLE);
      poly.addTo(window.plugin.maxLinks.layer);
      drawnLinkCount++;
    }
  }

  $.each(triangles, function(idx, triangle) {
    drawLink(triangle.a,triangle.b);
    drawLink(triangle.b,triangle.c);
    drawLink(triangle.c,triangle.a);

    // we only check the render limit after drawing all three edges of a triangle, for efficency
    if (drawnLinkCount > window.pligin.maxLinks.MAX_DRAWN_LINKS ) {
      window.plugin.maxLinks._renderLimitReached = true;
      return false;  //$.each break
    }
  });
  window.plugin.maxLinks._updating = false;
  window.renderUpdateStatus();
}

window.plugin.maxLinks.setup = function() {
  try { console.log('Loading delaunay JS now'); } catch(e) {}
  @@INCLUDERAW:external/delaunay.js@@
  try { console.log('done loading delaunay JS'); } catch(e) {}

  window.plugin.maxLinks.layer = L.layerGroup([]);

  window.addHook('mapDataRefreshEnd', function(e) {
    window.plugin.maxLinks.updateLayer();
  });

  window.map.on('layeradd', function(e) {
    if (e.layer === window.plugin.maxLinks.layer)
      window.plugin.maxLinks.updateLayer();
  });
  window.map.on('zoomend moveend', window.plugin.maxLinks.updateLayer);
  window.addLayerGroup('Maximum Links', window.plugin.maxLinks.layer, false);
}
var setup = window.plugin.maxLinks.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
