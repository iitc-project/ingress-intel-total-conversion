// ==UserScript==
// @id             max-links@boombuler
// @name           IITC plugin: Max Links
// @version        0.3.0.@@DATETIMEVERSION@@
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Calculates how to link the portals to create the maximum number of fields.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// ==/UserScript==

function wrapper() {

// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function')
  window.plugin = function() {};

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.maxLinks = function() {};

// const values
window.plugin.maxLinks.MAX_DRAWN_LINKS = 400;
window.plugin.maxLinks.MAX_DRAWN_LINKS_INCREASED_LIMIT = 1000;
window.plugin.maxLinks.STROKE_STYLE = {
  color: '#FF0000',
  opacity: 1,
  weight:2,
  clickable: false,
  smoothFactor: 10
};
window.plugin.maxLinks.layer = null;

window.plugin.maxLinks._updating = false;
window.plugin.maxLinks._renderLimitReached = false;

window.plugin.maxLinks.updateLayer = function() {
  if (window.plugin.maxLinks._updating ||
      window.plugin.maxLinks.layer === null ||
      !window.map.hasLayer(window.plugin.maxLinks.layer))
    return;
  window.plugin.maxLinks._updating = true;
  window.plugin.maxLinks.layer.clearLayers();

  var locations = [];
  var minX = 0;
  var minY = 0;

  $.each(window.portals, function(guid, portal) {
    var loc = portal.options.details.locationE6;
    var nloc = { x: loc.lngE6, y: loc.latE6 };
    if (nloc.x < minX)
      minX = nloc.x;
    if (nloc.y < minY)
      minY = nloc.y;
    locations.push(nloc);
  });

  $.each(locations, function(idx, nloc) {
    nloc.x += Math.abs(minX);
    nloc.y += Math.abs(minY);
  });

  var triangles = window.delaunay.triangulate(locations);
  var drawnLinks = 0;
  window.plugin.maxLinks._renderLimitReached = false;
  var renderlimit = window.USE_INCREASED_RENDER_LIMIT ?
    window.plugin.maxLinks.MAX_DRAWN_LINKS_INCREASED_LIMIT :
    window.plugin.maxLinks.MAX_DRAWN_LINKS;
  $.each(triangles, function(idx, triangle) {
    if (drawnLinks <= renderlimit) {
      triangle.draw(window.plugin.maxLinks.layer, minX, minY)
      drawnLinks += 3;
    } else {
      window.plugin.maxLinks._renderLimitReached = true;
    }
  });
  window.plugin.maxLinks._updating = false;
  window.renderUpdateStatus();
}

window.plugin.maxLinks.setup = function() {
  try { console.log('Loading delaunay JS now'); } catch(e) {}
  @@INCLUDERAW:external/delaunay.js@@
  try { console.log('done loading delaunay JS'); } catch(e) {}

  window.delaunay.Triangle.prototype.draw = function(layer, divX, divY) {
    var drawLine = function(src, dest) {
      var poly = L.polyline([[(src.y + divY)/1E6, (src.x + divX)/1E6], [(dest.y + divY)/1E6, (dest.x + divX)/1E6]], window.plugin.maxLinks.STROKE_STYLE);
      poly.addTo(layer);
    };

    drawLine(this.a, this.b);
    drawLine(this.b, this.c);
    drawLine(this.c, this.a);
  }

  window.plugin.maxLinks.layer = L.layerGroup([]);

  window.addHook('checkRenderLimit', function(e) {
    if (window.map.hasLayer(window.plugin.maxLinks.layer) &&
        window.plugin.maxLinks._renderLimitReached)
      e.reached = true;
  });

  window.addHook('portalDataLoaded', function(e) {
    if (window.map.hasLayer(window.plugin.maxLinks.layer))
      window.plugin.maxLinks.updateLayer();
  });

  window.map.on('layeradd', function(e) {
    if (e.layer === window.plugin.maxLinks.layer)
      window.plugin.maxLinks.updateLayer();
  });
  window.map.on('zoomend moveend', window.plugin.maxLinks.updateLayer);
  window.addLayerGroup('Maximum Links', window.plugin.maxLinks.layer);
}
var setup = window.plugin.maxLinks.setup;

// PLUGIN END //////////////////////////////////////////////////////////
if(window.iitcLoaded && typeof setup === 'function') {
  setup();
} else {
  if(window.bootPlugins)
    window.bootPlugins.push(setup);
  else
    window.bootPlugins = [setup];
}

} // wrapper end

// inject code into site context
var script = document.createElement('script');
script.appendChild(document.createTextNode('('+ wrapper +')();'));
(document.body || document.head || document.documentElement).appendChild(script);
