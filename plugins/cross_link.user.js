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

// use own namespace for plugin
window.plugin.crossLinks = function() {};

window.plugin.crossLinks.STYLE_LINECOLLISION = {color: '#f22', weight: 4};
window.plugin.crossLinks.STYLE_INSIDEPOLY = {color: '#ff2', weight: 4};


function relativeCCW(x1,y1,x2,y2, px, py) {
   // code from java.awt
         x2 -= x1;
         y2 -= y1;
         px -= x1;
         py -= y1;

         var ccw = px * y2 - py * x2;

         if (ccw == 0.0) {
             ccw = px * x2 + py * y2;

             if (ccw > 0.0) {
                 px -= x2;
                 py -= y2;
                 ccw = px * x2 + py * y2;

                 if (ccw < 0.0) {
                     ccw = 0.0;
                 }
             }
         }
         return (ccw < 0.0) ? -1 : ((ccw > 0.0) ? 1 : 0);
     }

function linesIntersect(x1,y1,x2,y2,x3,y3,x4,y4) {
   // code from java.awt
   return (    (relativeCCW(x1, y1, x2, y2, x3, y3) * relativeCCW(x1, y1, x2, y2, x4, y4) <= 0)
            && (relativeCCW(x3, y3, x4, y4, x1, y1) * relativeCCW(x3, y3, x4, y4, x2, y2) <= 0));
}

function isCrossing(p1,p2,q1,q2) {
    return linesIntersect( p1.lat,p1.lng,p2.lat,p2.lng,
                           q1.lat,q1.lng,q2.lat,q2.lng);
}

window.plugin.crossLinks.testLine = function (drawline, link) {

    var linkline= L.geodesicConvertLines(link._latlngs,0);

    for (var j=0;j<linkline.length-1;++j) {
      for (var i=0;i<drawline.length-1;++i) {
        if (isCrossing(linkline[j],linkline[j+1], drawline[i],drawline[i+1])) {
            return true;
        }
      }
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

    var link = data.link;

    window.plugin.drawTools.drawnItems.eachLayer( function(layer) {
       if (layer instanceof L.GeodesicPolygon) {
            var drawline  = L.geodesicConvertLines(layer.getLatLngs(),true);
            drawline.push(drawline[0]);
            var polyline= [drawline];
            if (window.plugin.crossLinks.testLine(drawline, link)) {
                link.setStyle (window.plugin.crossLinks.STYLE_LINECOLLISION);
            } else if (window.plugin.crossLinks.testPolygons([drawline], link)) {
                link.setStyle (window.plugin.crossLinks.STYLE_INSIDEPOLY);
            }
        } else if (layer instanceof L.GeodesicPolyline) {
            var drawline  = L.geodesicConvertLines(layer.getLatLngs(),false);
            if (window.plugin.crossLinks.testLine(drawline, link)) {
                link.setStyle (window.plugin.crossLinks.STYLE_LINECOLLISION);
            }
        }
    });
}

window.plugin.crossLinks.checkAllLinks = function() {
  console.debug("Cross-Links: checking links");
  
  // get all lines
  var drawpolygons = [];
  var drawlines = [];
  window.plugin.drawTools.drawnItems.eachLayer( function(layer) {
      if (layer instanceof L.GeodesicPolyline) {
          var newlines  = L.geodesicConvertLines(layer.getLatLngs(),false);
          drawlines = drawlines.concat(newlines);
      } else if (layer instanceof L.GeodesicPolygon) {
          var newlines  = L.geodesicConvertLines(layer.getLatLngs(),true);
          newlines.push(newlines[0]);
          drawlines = drawlines.concat(newlines);
          drawpolygons.push(newlines);
      }
  });

  // check all links
  $.each(window.links, function(guid, link) {
      if (window.plugin.crossLinks.testLine(drawlines, link)) {
	    link.setStyle (window.plugin.crossLinks.STYLE_LINECOLLISION);
      } else if (window.plugin.crossLinks.testPolygons(drawpolygons, link)) {
	    link.setStyle (window.plugin.crossLinks.STYLE_INSIDEPOLY);
      } else {
        link.setStyle ({color: COLORS[link.options.team], weight: 2});
      }
    });
  }


window.plugin.crossLinks.drawTools_save = function() {
  window.plugin.crossLinks.ori_drawTools_save();
  window.plugin.crossLinks.checkAllLinks();
 }

window.plugin.crossLinks.drawTools_load = function() {
  window.plugin.crossLinks.ori_drawTools_load();
  window.plugin.crossLinks.checkAllLinks();
 }


var setup = function() {
  console.debug("Cross-Links: init");
  if (window.plugin.drawTools === undefined) {
      alert("'Cross-Links' requires 'draw-tools'");
      return;
  }

  // hook 'drawTools'
  window.plugin.crossLinks.ori_drawTools_save = window.plugin.drawTools.save;
  window.plugin.drawTools.save = window.plugin.crossLinks.drawTools_save;
  window.plugin.crossLinks.ori_drawTools_load = window.plugin.drawTools.load;
  window.plugin.drawTools.load = window.plugin.crossLinks.drawTools_load;

  window.addHook('linkAdded', window.plugin.crossLinks.onLinkAdded);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
