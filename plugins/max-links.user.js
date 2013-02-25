// ==UserScript==
// @id             max-links@boombuler
// @name           iitc: Max-Links-Plugin
// @version        0.1
// @updateURL      https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/max-links.user.js
// @downloadURL    https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/max-links.user.js
// @description    Calculates how to link the portals to create the maximum number of fields.
// @include        http://www.ingress.com/intel*
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
  var delaunayScriptLocation = 'https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/dist/delaunay.js';

  window.plugin.maxLinks.layer = null;

  var updating = false;
  var renderLimitReached = false;

  window.plugin.maxLinks.updateLayer = function() {
    if (updating || window.plugin.maxLinks.layer === null || !window.map.hasLayer(window.plugin.maxLinks.layer))
      return;
    updating = true;
    window.plugin.maxLinks.layer.clearLayers();
    
    var locations = [];
    var minX = 0;
    var minY = 0;
       
    $.each(window.portals, function(guid, portal) {
      var loc = portal.options.details.locationE6;
      var nloc = { x: loc.lngE6, y: loc.latE6 };
      if (nloc.x < minX) 
        minX = nloc.x;
      if (nloc.y < minX) 
        minX = nloc.y;
      locations.push(nloc);
    });
        
    $.each(locations, function(idx, nloc) {
      nloc.x += Math.abs(minX);
      nloc.y += Math.abs(minY);
    });

    var triangles = window.delaunay.triangulate(locations);
    var drawnLinks = 0;
    renderLimitReached = false;
    var renderlimit = window.USE_INCREASED_RENDER_LIMIT ? window.plugin.maxLinks.MAX_DRAWN_LINKS_INCREASED_LIMIT : window.plugin.maxLinks.MAX_DRAWN_LINKS;
    $.each(triangles, function(idx, triangle) {
      if (drawnLinks <= renderlimit) {
        triangle.draw(window.plugin.maxLinks.layer, minX, minY)
        drawnLinks += 3;
      } else {
        renderLimitReached = true;
      }
    });
    updating = false;
    window.renderUpdateStatus();
  }
  
  var setup =  function() {
    load(delaunayScriptLocation).thenRun(function() {

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
         if (window.map.hasLayer(window.plugin.maxLinks.layer) && renderLimitReached)
           e.reached = true; 
      });
    
      window.map.on('layeradd', function(e) {
        if (e.layer === window.plugin.maxLinks.layer)
          window.plugin.maxLinks.updateLayer();
      });
      window.map.on('zoomend moveend', window.plugin.maxLinks.updateLayer);     
      window.layerChooser.addOverlay(window.plugin.maxLinks.layer, 'Maximum Links');
    });
  }

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