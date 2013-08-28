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
window.plugin.maxLinks.MAX_PORTALS_TO_LINK = 400;

window.plugin.maxLinks.STROKE_STYLE = {
  color: '#FF0000',
  opacity: 1,
  weight: 2,
  clickable: false,
  dashArray: [8,6],
  smoothFactor: 10,
};
window.plugin.maxLinks.layer = null;
window.plugin.maxLinks.errorMarker = null;


window.plugin.maxLinks.Point = function(x,y) {
  this.x=x;
  this.y=y;
}
window.plugin.maxLinks.Point.prototype.toString = function() {
  return this.x+","+this.y;
}


window.plugin.maxLinks.addErrorMarker = function() {
  if (window.plugin.maxLinks.errorMarker == null) {
    window.plugin.maxLinks.errorMarker = L.marker (window.map.getCenter(), {
      icon: L.divIcon({
        className: 'max-links-error',
        iconSize: [300,30],
        html: 'Max Links: too many portals!'
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

  if (Object.keys(window.portals).length > window.plugin.maxLinks.MAX_PORTALS_TO_LINK) {
    window.plugin.maxLinks.addErrorMarker();
    return;
  }

  var locations = [];

  $.each(window.portals, function(guid, portal) {
    var loc = portal.options.details.locationE6;
    var nloc = new window.plugin.maxLinks.Point(loc.latE6/1E6, loc.lngE6/1E6);
    locations.push(nloc);
  });

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

      var poly = L.polyline([[a.x,a.y],[b.x,b.y]], window.plugin.maxLinks.STROKE_STYLE);
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
  @@INCLUDERAW:external/delaunay.js@@
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

  window.addLayerGroup('Maximum Links', window.plugin.maxLinks.layer, false);

  $('head').append('<style>'+
    '.max-links-error { color: #F88; font-size: 20px; font-weight: bold; text-align: center; text-shadow: -1px -1px #000, 1px -1px #000, -1px 1px #000, 1px 1px #000; background-color: rgba(0,0,0,0.6); border-radius: 5px; }'+
    '</style>');


}
var setup = window.plugin.maxLinks.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
