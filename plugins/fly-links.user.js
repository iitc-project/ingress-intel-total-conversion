// ==UserScript==
// @id             fly-links@fly
// @name           IITC plugin: Fly Links
// @category       Layer
// @version        0.1.0.@@DATETIMEVERSION@@
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Calculate how to link the portals to create the largest tidy set of nested fields. Enable from the layer chooser.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.flyLinks = function() {};

// const values
window.plugin.flyLinks.MAX_PORTALS_TO_OBSERVE = 1000;
window.plugin.flyLinks.MAX_PORTALS_TO_LINK = 100;
// zoom level used for projecting points between latLng and pixel coordinates. may affect precision of triangulation
window.plugin.flyLinks.PROJECT_ZOOM = 16;

window.plugin.flyLinks.STROKE_STYLE = {
  color: '#FF0000',
  opacity: 1,
  weight: 1.5,
  clickable: false,
  dashArray: [6,4],
  smoothFactor: 10,
};

window.plugin.flyLinks.levelLayerGroup = null;

window.plugin.flyLinks.updateLayer = function() {
  window.plugin.flyLinks.levelLayerGroup.clearLayers();
  var ctrl = $('.leaflet-control-layers-selector + span:contains("Fly links")').parent();
  if (Object.keys(window.portals).length > window.plugin.flyLinks.MAX_PORTALS_TO_OBSERVE) {
    ctrl.addClass('disabled').attr('title', 'Too many portals: ' + Object.keys(window.portals).length);
    return;
  }
  
  var locations = [];

  var bounds = map.getBounds();
  $.each(window.portals, function(guid, portal) {
    var ll = portal.getLatLng();
    if (bounds.contains(ll)) {
      var p = map.project(portal.getLatLng(), window.plugin.flyLinks.PROJECT_ZOOM);
      locations.push(p);
    }
  });

  var distance = function(a, b) {
    return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
  };
  
  var drawLink = function(a, b, style) {
    var alatlng = map.unproject (a, window.plugin.flyLinks.PROJECT_ZOOM);
    var blatlng = map.unproject (b, window.plugin.flyLinks.PROJECT_ZOOM);

    var poly = L.polyline([alatlng, blatlng], style);
    poly.addTo(window.plugin.flyLinks.levelLayerGroup);
  }
  
  var filterLocations = function(locations) {
    var bounds = map.getBounds();
    var minp = map.project(bounds.getNorthWest(), window.plugin.flyLinks.PROJECT_ZOOM);
    var maxp = map.project(bounds.getSouthEast(), window.plugin.flyLinks.PROJECT_ZOOM);
    var center = map.project(map.getCenter(), window.plugin.flyLinks.PROJECT_ZOOM);

    var minx = minp.x;
    var miny = minp.y;
    var maxx = maxp.x;
    var maxy = maxp.y;
    
    var r = Math.min((maxx - minx) / 6, (maxy - miny) / 6);

    var rindex = [];
    
    for (var i = 0; i < locations.length; ++i) {
      if (distance(locations[i], center) <= r) {
        rindex.push(i);
      }
    }
    
    if (rindex.length == 0)
      return [];

    var dist = [];
    var isSelected = [];
    for (var i = 0; i < locations.length; ++i) {
      dist[i] = -1;
      isSelected[i] = false;
    }
    
    dist[rindex[0]] = 0;
    
    var maxdist = 0;
    while (true) {
      var mini = -1;
      for (var i = 0; i < rindex.length; ++i) {
        if (!isSelected[rindex[i]] && dist[rindex[i]] != -1)
          if (mini == -1 || dist[mini] > dist[rindex[i]])
            mini = rindex[i];
      }
      if (mini == -1)
        break;
      isSelected[mini] = true;
      if (maxdist < dist[mini])
        maxdist = dist[mini];
      for (var i = 0; i < locations.length; ++i) {
        if (isSelected[i])
          continue;
        var dst = distance(locations[mini], locations[i]);
        if (dist[i] == -1 || dist[i] > dst) {
          dist[i] = dst;
        }
      }
    }

    while (true) {
      var mini = -1;
      for (var i = 0; i < locations.length; ++i) {
        if (!isSelected[i] && dist[i] != -1 && dist[i] <= maxdist)
          if (mini == -1 || dist[mini] > dist[i])
            mini = i;
      }
      if (mini == -1)
        break;
      isSelected[mini] = true;
      rindex.push(mini);
      for (var i = 0; i < locations.length; ++i) {
        if (isSelected[i])
          continue;
        var dst = distance(locations[mini], locations[i]);
        if (dist[i] == -1 || dist[i] > dst) {
          dist[i] = dst;
        }
      }
    }
    
    var result = [];
    for (var i = 0; i < rindex.length; ++i)
      result.push(locations[rindex[i]]);
    
    return result;
  }
  
  var locations = filterLocations(locations);
  
  if (locations.length > window.plugin.flyLinks.MAX_PORTALS_TO_LINK) {
    ctrl.addClass('disabled').attr('title', 'Too many portals (linked/observed): ' + locations.length + '/' + Object.keys(window.portals).length);
    return;
  }
  ctrl.removeClass('disabled').attr('title', 'portals (linked/observed): ' + locations.length + '/' + Object.keys(window.portals).length);
  
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
      return [];
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
        data[_i[0]][_i[1]-_i[0]][_i[2]-_i[1]] = [besth, besthi];
      }
      return data[_i[0]][_i[1]-_i[0]][_i[2]-_i[1]][0];
    }
    var subindex = [];
    for (var i = 0; i < locations.length; ++i) {
      subindex.push(i);
    }
    var bestt = [];
    for (var len = 1; len <= index.length - 1; ++len) {
      bestt[len] = [];
      for (var k = 0; k < index.length - len; ++k) {
        var t = 0;
        var tlen = -1;
        for (var _len = 1; _len <= len - 1; ++_len) {
          var _t = 0;
          $.each([bestt[_len][k][0], bestt[len-_len][k+_len][0], subtriangulate(index[k], index[k+_len], index[k+len], subindex)], function(guid, __t) {
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
        bestt[len][k] = [t, tlen];
      }
    }
    
    var edges = [];
    var makesubtriangulation = function _makesubtriangulation(ai, bi, ci) {
      var _i = [ai, bi, ci].sort(function(a,b){return a-b;});
      if (data[_i[0]][_i[1]-_i[0]][_i[2]-_i[1]][1] != -1) {
        _makesubtriangulation(ai, bi, data[_i[0]][_i[1]-_i[0]][_i[2]-_i[1]][1]);
        _makesubtriangulation(bi, ci, data[_i[0]][_i[1]-_i[0]][_i[2]-_i[1]][1]);
        _makesubtriangulation(ci, ai, data[_i[0]][_i[1]-_i[0]][_i[2]-_i[1]][1]);
        edges.push(new window.plugin.flyLinks.Edge(locations[ai], locations[data[_i[0]][_i[1]-_i[0]][_i[2]-_i[1]][1]]));
        edges.push(new window.plugin.flyLinks.Edge(locations[bi], locations[data[_i[0]][_i[1]-_i[0]][_i[2]-_i[1]][1]]));
        edges.push(new window.plugin.flyLinks.Edge(locations[ci], locations[data[_i[0]][_i[1]-_i[0]][_i[2]-_i[1]][1]]));
      }
    }
    var maketriangulation = function _maketriangulation(len, a) {
      edges.push(new window.plugin.flyLinks.Edge(locations[index[a]], locations[index[a+len]]));
      if (bestt[len][a][1] == -1)
        return;
      makesubtriangulation(index[a], index[a+bestt[len][a][1]], index[a+len]);
      _maketriangulation(bestt[len][a][1], a);
      _maketriangulation(len - bestt[len][a][1], a + bestt[len][a][1]);
    }
    maketriangulation(index.length - 1, 0);
    return edges;
  }
  
  var edges = triangulate(index, locations);

  $.each(edges, function(idx, edge) {
    drawLink(edge.a, edge.b, window.plugin.flyLinks.STROKE_STYLE);
  });
}

window.plugin.flyLinks.Edge = function(a, b) {
  this.a = a;
  this.b = b;
}

window.plugin.flyLinks.setup = function() {
  window.plugin.flyLinks.levelLayerGroup = new L.LayerGroup();
  
  window.addHook('mapDataRefreshEnd', function(e) {
    window.plugin.flyLinks.updateLayer();
  });

  window.map.on('moveend', function() {
    window.plugin.flyLinks.updateLayer();
  });

  window.addLayerGroup('Fly links', window.plugin.flyLinks.levelLayerGroup, true);
}

var setup = window.plugin.flyLinks.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
