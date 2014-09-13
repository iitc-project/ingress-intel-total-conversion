// ==UserScript==
// @id             finish-fields@finish
// @name           IITC plugin: Finish Fields
// @category       Layer
// @version        0.2.1.20140815.141737
// @updateURL      https://secure.jonatkins.com/iitc/release/plugins/complete-fields.meta.js
// @downloadURL    https://secure.jonatkins.com/iitc/release/plugins/complete-fields.user.js
// @description    [jonatkins-2014-08-15-141737] Find links that would finish fields with only two out of three links
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==


function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

//PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
//(leaving them in place might break the 'About IITC' page or break update checks)
plugin_info.buildName = 'jonatkins';
plugin_info.dateTimeVersion = '20140815.141737';
plugin_info.pluginId = 'finish-fields';
//END PLUGIN AUTHORS NOTE



// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.finishFields = function() {};

// const values
window.plugin.finishFields.MAX_PORTALS_TO_OBSERVE = 1000;
window.plugin.finishFields.MAX_PORTALS_TO_LINK = 100;
// zoom level used for projecting points between latLng and pixel coordinates. may affect precision of triangulation
window.plugin.finishFields.PROJECT_ZOOM = 16;


window.plugin.finishFields.layerGroup = null;

window.plugin.finishFields.updateLayer = function() {
  if (window.map.hasLayer(window.plugin.finishFields.layerGroup))
    return;

  window.plugin.finishFields.layerGroup.clearLayers();
  var ctrl = [$('.leaflet-control-layers-selector + span:contains("Finish fields")').parent()];
  if (Object.keys(window.portals).length > window.plugin.finishFields.MAX_PORTALS_TO_OBSERVE) {
    $.each(ctrl, function(guid, ctl) {ctl.addClass('disabled').attr('title', 'Too many portals: ' + Object.keys(window.portals).length);});
    return;
  }
alert(Object.keys(window.portals).length);
return;
  
  var locations = [];

  var bounds = map.getBounds();
  $.each(window.portals, function(guid, portal) {
    var ll = portal.getLatLng();
    if (bounds.contains(ll)) {
      var p = map.project(portal.getLatLng(), window.plugin.finishFields.PROJECT_ZOOM);
      locations.push(p);
    }
  });

  var distance = function(a, b) {
    return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
  };

  var drawLink = function(a, b, style) {
    var alatlng = map.unproject(a, window.plugin.finishFields.PROJECT_ZOOM);
    var blatlng = map.unproject(b, window.plugin.finishFields.PROJECT_ZOOM);

    var poly = L.polyline([alatlng, blatlng], style);
    poly.addTo(window.plugin.finishFields.layerGroup);
  }
  
  if (locations.length > window.plugin.finishFields.MAX_PORTALS_TO_LINK) {
    $.each(ctrl, function(guid, ctl) {ctl.addClass('disabled').attr('title', 'Too many portals (linked/observed): ' + locations.length + '/' + Object.keys(window.portals).length);});
    return;
  }
  $.each(ctrl, function(guid, ctl) {ctl.removeClass('disabled').attr('title', 'portals (linked/observed): ' + locations.length + '/' + Object.keys(window.portals).length);});
  
  var EPS = 1e-9;
  var det = function(a, b, c) {
    return a.x * b.y - a.y * b.x + b.x * c.y - b.y * c.x + c.x * a.y - c.y * a.x;
  }
  
  var convexHull = function(points) {
    if (points.length < 3)
      return [];
    var result = [];
    var func = function _func(ai, bi, index) {
      var maxd = 0;
      var maxdi = -1;
      var a = points[ai];
      var b = points[bi];
      var _index = [];
      for (var i = 0; i < index.length; ++i) {
        var c = points[index[i]];
        var d = -det(a, b, c);
        if (d > EPS) {
            _index.push(index[i]);
        }
        if (maxd < d - EPS) {
          maxd = d;
          maxdi = index[i];
        }
      }
      if (maxdi != -1) {
        _func(ai, maxdi, _index);
        _func(maxdi, bi, _index);
      } else {
        result.push(ai);
      }
    }
    var minxi = 0;
    var maxxi = 0;
    var index = [];
    for (var i = 0; i < points.length; ++i) {
      index.push(i);
      if (points[minxi].x > points[i].x)
        minxi = i;
      if (points[maxxi].x < points[i].x)
        maxxi = i;
    }
    func(minxi, maxxi, index);
    func(maxxi, minxi, index);
    return result;
  }
  
  var index = convexHull(locations);
  
  var triangulate = function(index, locations) {
    if (index.length == 0)
      return {edges: [], triangles: []};
    var data = [];
    var subtriangulate = function _subtriangulate(ai, bi, ci, index) {
      var _i = [ai, bi, ci].sort(function(a,b){return a-b;});
      if (data[_i[0]] === undefined)
        data[_i[0]] = [];
      if (data[_i[0]][_i[1]-_i[0]] === undefined)
        data[_i[0]][_i[1]-_i[0]] = [];
      if (data[_i[0]][_i[1]-_i[0]][_i[2]-_i[1]] === undefined) {
        var _index = [];
        for (var i = 0; i < index.length; ++i) {
          var detc = det(locations[ai], locations[bi], locations[index[i]]);
          var deta = det(locations[bi], locations[ci], locations[index[i]]);
          var detb = det(locations[ci], locations[ai], locations[index[i]]);
          if (deta > EPS && detb > EPS && detc > EPS) {
            _index.push(index[i]);
          }
        }
        var besth = 0;
        var besthi = -1;
        if (_index.length == 0) {
          var a = locations[ai];
          var b = locations[bi];
          var c = locations[ci];
          var s = Math.abs(det(a, b, c));
          var ch = s / distance(a, b);
          var ah = s / distance(b, c);
          var bh = s / distance(c, a);
          besth = Math.min(ah, bh, ch);
          besthi = -1;
        } else {
          var besths = 0;
          for (var i = 0; i < _index.length; ++i) {
            var ch = _subtriangulate(ai, bi, _index[i], _index);
            var ah = _subtriangulate(bi, ci, _index[i], _index);
            var bh = _subtriangulate(ci, ai, _index[i], _index);
            var _besth = Math.min(ah, bh, ch);
            var _besths = ah + bh + ch;
            if (besth < _besth || Math.abs(besth - _besth) <= EPS && besths < _besths) {
              besth = _besth;
              besths = _besths;
              besthi = _index[i];
            }
          }
        }
        data[_i[0]][_i[1]-_i[0]][_i[2]-_i[1]] = {height: besth, index: besthi};
      }
      return data[_i[0]][_i[1]-_i[0]][_i[2]-_i[1]].height;
    }
    var subindex = [];
    for (var i = 0; i < locations.length; ++i) {
      subindex.push(i);
    }
    var best = [];
    for (var len = 1; len <= index.length - 1; ++len) {
      best[len] = [];
      for (var k = 0; k < index.length - len; ++k) {
        var t = 0;
        var tlen = -1;
        for (var _len = 1; _len <= len - 1; ++_len) {
          var _t = 0;
          $.each([best[_len][k].height, best[len-_len][k+_len].height, subtriangulate(index[k], index[k+_len], index[k+len], subindex)], function(guid, __t) {
            if (__t == 0)
              return;
            if (_t == 0 || _t > __t)
              _t = __t;
          });
          if (t == 0 || t < _t) {
            t = _t;
            tlen = _len;
          }
        }
        best[len][k] = {height: t, length: tlen};
      }
    }
    
    var edges = [];
    var triangles = [];
    var makesubtriangulation = function _makesubtriangulation(ai, bi, ci, depth) {
      var _i = [ai, bi, ci].sort(function(a,b){return a-b;});
      if (data[_i[0]][_i[1]-_i[0]][_i[2]-_i[1]].index == -1) {
        triangles.push(new window.plugin.finishFields.Triangle(locations[ai], locations[bi], locations[ci], depth));
      } else {
        _makesubtriangulation(ai, bi, data[_i[0]][_i[1]-_i[0]][_i[2]-_i[1]].index, depth+1);
        _makesubtriangulation(bi, ci, data[_i[0]][_i[1]-_i[0]][_i[2]-_i[1]].index, depth+1);
        _makesubtriangulation(ci, ai, data[_i[0]][_i[1]-_i[0]][_i[2]-_i[1]].index, depth+1);
        edges.push(new window.plugin.finishFields.Edge(locations[ai], locations[data[_i[0]][_i[1]-_i[0]][_i[2]-_i[1]].index], depth));
        edges.push(new window.plugin.finishFields.Edge(locations[bi], locations[data[_i[0]][_i[1]-_i[0]][_i[2]-_i[1]].index], depth));
        edges.push(new window.plugin.finishFields.Edge(locations[ci], locations[data[_i[0]][_i[1]-_i[0]][_i[2]-_i[1]].index], depth));
      }
    }
    var maketriangulation = function _maketriangulation(len, a) {
      edges.push(new window.plugin.finishFields.Edge(locations[index[a]], locations[index[a+len]], 0));
      if (best[len][a].length == -1)
        return;
      makesubtriangulation(index[a], index[a+best[len][a].length], index[a+len], 1);
      _maketriangulation(best[len][a].length, a);
      _maketriangulation(len - best[len][a].length, a + best[len][a].length);
    }
    maketriangulation(index.length - 1, 0);
    return {edges: edges, triangles: triangles};
  }
  
  var triangulation = triangulate(index, locations);
  var edges = triangulation.edges;
  var triangles = triangulation.triangles;

  $.each(edges, function(idx, edge) {
    drawLink(edge.a, edge.b, {
      color: '#FF0000',
      opacity: 1,
      weight: 1.5,
      clickable: false,
      smoothFactor: 10,
      dashArray: [6, 4],
    });
  });
}

window.plugin.finishFields.Edge = function(a, b, depth) {
  this.a = a;
  this.b = b;
  this.depth = depth;
}

window.plugin.finishFields.Triangle = function(a, b, c, depth) {
  this.a = a;
  this.b = b;
  this.c = c;
  this.depth = depth;
}

window.plugin.finishFields.setup = function() {
  window.plugin.finishFields.layerGroup = new L.LayerGroup();
  
  window.addHook('mapDataRefreshEnd', function(e) {
    window.plugin.finishFields.updateLayer();
  });

  window.map.on('moveend', function() {
    window.plugin.finishFields.updateLayer();
  });

  window.addLayerGroup('Finish fields', window.plugin.finishFields.layerGroup, false);
}
var setup = window.plugin.finishFields.setup;

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


