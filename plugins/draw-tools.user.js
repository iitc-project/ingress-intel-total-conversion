// ==UserScript==
// @id             iitc-plugin-draw-tools@breunigs
// @name           IITC plugin: draw tools
// @version        0.2.3.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    Allows you to draw things into the current map so you may plan your next move
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// ==/UserScript==

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////

var DRAW_TOOLS_SHAPE_OPTIONS = {
  color: '#BB56FF',
  fill: false,
  opacity: 1,
  weight: 4,
  clickable: false
};

// use own namespace for plugin
window.plugin.drawTools = function() {};

window.plugin.drawTools.loadExternals = function() {
  var base = 'http://iitc.jonatkins.com/dist';
  //~ var base = 'http://0.0.0.0:8000/dist';
  load(base+'/leaflet.draw.0.1.6.js').thenRun(window.plugin.drawTools.boot);

  // FIXME: this is currently manually included from
  // external/leaflet.draw.0.1.6.css. It should either be loaded remotely
  // automatically or the buildscript should include it here, similar to
  // how it works for the main script.
  $('head').append('<style>.leaflet-container .leaflet-control-draw {margin-left: 13px;margin-top: 12px;}.leaflet-control-draw a {background-position: 50% 50%;background-repeat: no-repeat;display: block;width: 22px;height: 22px;}.leaflet-control-draw a:hover {background-color: #fff;}.leaflet-touch .leaflet-control-draw a {width: 27px;height: 27px;}.leaflet-control-draw-polyline {background-image: url(http://iitc.jonatkins.com/dist/images/draw-polyline.png);}.leaflet-control-draw-polygon {background-image: url(http://iitc.jonatkins.com/dist/images/draw-polygon.png);}.leaflet-control-draw-rectangle {background-image: url(http://iitc.jonatkins.com/dist/images/draw-rectangle.png);}.leaflet-control-draw-circle {background-image: url(http://iitc.jonatkins.com/dist/images/draw-circle.png);}.leaflet-control-draw-marker {background-image: url(http://iitc.jonatkins.com/dist/images/draw-marker-icon.png);}.leaflet-mouse-marker {background-color: #fff;cursor: crosshair;}.leaflet-draw-label {background-color: #fff;border: 1px solid #ccc;color: #222;font: 12px/18px "Helvetica Neue", Arial, Helvetica, sans-serif;margin-left: 20px;margin-top: -21px;padding: 2px 4px;position: absolute;white-space: nowrap;z-index: 6;}.leaflet-error-draw-label {background-color: #F2DEDE;border-color: #E6B6BD;color: #B94A48;}.leaflet-draw-label-single {margin-top: -12px}.leaflet-draw-label-subtext {color: #999;}.leaflet-draw-guide-dash {font-size: 1%;opacity: 0.6;position: absolute;width: 5px;height: 5px;}.leaflet-flash-anim {-webkit-animation-duration: 0.66s; -moz-animation-duration: 0.66s; -o-animation-duration: 0.66s; animation-duration: 0.66s;-webkit-animation-fill-mode: both; -moz-animation-fill-mode: both; -o-animation-fill-mode: both; animation-fill-mode: both;-webkit-animation-name: leaflet-flash; -moz-animation-name: leaflet-flash; -o-animation-name: leaflet-flash; animation-name: leaflet-flash;}@-webkit-keyframes leaflet-flash {0%, 50%, 100% { opacity: 1; }25%, 75% { opacity: 0.3; }}@-moz-keyframes leaflet-flash {0%, 50%, 100% { opacity: 1; }25%, 75% { opacity: 0.3; }}@-o-keyframes leaflet-flash {0%, 50%, 100% { opacity: 1; }25%, 75% { opacity: 0.3; }}@keyframes leaflet-flash {0%, 50%, 100% { opacity: 1; }25%, 75% { opacity: 0; }}</style>');
}


window.plugin.drawTools.addStyles = function() {
  $('head').append('<style>.leaflet-control-draw a { color: #222; text-decoration: none; text-align: center; font-size: 17px; line-height: 22px; }</style>');
}

// renders buttons which are not originally part of Leaflet.draw, such
// as the clear-drawings button.
window.plugin.drawTools.addCustomButtons = function() {
  $('.leaflet-control-draw .leaflet-bar-part-bottom').removeClass('leaflet-bar-part-bottom');

  var undo = $('<a class="leaflet-bar-part" title="remove last drawn line/circle/marker" href="#">⎌</a>')
    .click(function() {
      var last = null;
      window.plugin.drawTools.drawnItems.eachLayer(function(l) {
        last = l;
      });
      if(last) window.plugin.drawTools.drawnItems.removeLayer(last);
    }
  );

  var clear = $('<a class="leaflet-bar-part leaflet-bar-part-bottom" title="clear ALL drawings" href="#">✗</a>')
    .click(function() {
      window.plugin.drawTools.drawnItems.clearLayers();
    }
  );

  $('.leaflet-control-draw').append(undo).append(clear);
}

// renders the draw control buttons in the top left corner
window.plugin.drawTools.addDrawControl = function() {
  var drawControl = new L.Control.Draw({
    rectangle: false,
    polygon: false,

    polyline: {
      shapeOptions: DRAW_TOOLS_SHAPE_OPTIONS,
      title: 'Add a (poly) line.\n\n'
        + 'Click on the button, then click on the map to\n'
        + 'define the start of the line. Continue click-\n'
        + 'ing to draw the line you want. Click the last\n'
        + 'point of the line (a small white rectangle) to\n'
        + 'finish. Double clicking also works.'
    },

    circle: {
      shapeOptions: DRAW_TOOLS_SHAPE_OPTIONS,
      title: 'Add a circle.\n\n'
        + 'Click on the button, then click-AND-HOLD on the\n'
        + 'map where the circle’s center should be. Move\n'
        + 'the mouse to control the radius. Release the mouse\n'
        + 'to finish.'
    },

    marker: {
      title: 'Add a marker.\n\n'
        + 'Click on the button, then click on the map where\n'
        + 'you want the marker to appear. You can drag the\n'
        + 'marker around after it has been placed.'
    }
  });
  map.addControl(drawControl);
  plugin.drawTools.addCustomButtons();
}

// hacks into circle to render the radius of the circle while drawing
// and to allow the center of the circle to snap to a nearby portal.
window.plugin.drawTools.enhanceCircle = function() {
  // replace _onMouseMove function to also display the radius of the
  // circle
  L.Circle.Draw.prototype._onMouseMove = function (e) {
    var layerPoint = e.layerPoint,
        latlng = e.latlng;

    this._updateLabelPosition(layerPoint);
    if (this._isDrawing) {
      var dist = this._startLatLng.distanceTo(latlng);
      dist = dist  > 1000
              ? (dist  / 1000).toFixed(2) + ' km'
              : Math.ceil(dist) + ' m';
      this._updateLabelText({
        text: 'Release mouse to finish drawing. ',
        subtext: 'radius: ' +dist }
      );
      this._drawShape(latlng);
    }
  }

  // replace _onMouseDown to implement snapping
  L.Circle.Draw.prototype._onMouseDown = function (e) {
    this._isDrawing = true;

    var snapTo = window.plugin.drawTools.getSnapLatLng(e.containerPoint);
    this._startLatLng = snapTo || e.latlng;

    L.DomEvent
      .on(document, 'mouseup', this._onMouseUp, this)
      .preventDefault(e.originalEvent);
  }
}

// hacks into PolyLine to implement snapping and to remove the polyline
// markers when they are not required anymore for finishing the line.
// Otherwise they get in the way and make it harder to create a closed
// polyline.
window.plugin.drawTools.enhancePolyLine = function() {
  // hack in snapping
  L.Polyline.Draw.prototype._onClickOld = L.Polyline.Draw.prototype._onClick;
  L.Polyline.Draw.prototype._onClick = function(e) {
    var cp = map.latLngToContainerPoint(e.target.getLatLng());
    var snapTo = window.plugin.drawTools.getSnapLatLng(cp);
    if(snapTo) e.target._latlng = snapTo;
    return this._onClickOld(e);
  }

  // remove polyline markers because they get in the way
  L.Polyline.Draw.prototype._updateMarkerHandlerOld = L.Polyline.Draw.prototype._updateMarkerHandler;
  L.Polyline.Draw.prototype._updateMarkerHandler = function() {
    this._updateMarkerHandlerOld();
    if (this._markers.length > 1)
      this._markerGroup.removeLayer(this._markers[this._markers.length - 2]);
  }
}

// given a container point it tries to find the most suitable portal to
// snap to. It takes the CircleMarker’s radius and weight into account.
// Will return null if nothing to snap to or a LatLng instance.
window.plugin.drawTools.getSnapLatLng = function(containerPoint) {
  var candidates = [];
  $.each(window.portals, function(guid, portal) {
    var ll = portal.getLatLng();
    var pp = map.latLngToContainerPoint(ll);
    var size = portal.options.weight + portal.options.radius;
    var dist = pp.distanceTo(containerPoint);
    if(dist > size) return true;
    candidates.push([dist, ll]);
  });

  if(candidates.length === 0) return;
  candidates = candidates.sort(function(a, b) { return a[0]-b[0]; });
  return candidates[0][1];
}

window.plugin.drawTools.boot = function() {
  plugin.drawTools.enhanceCircle();
  plugin.drawTools.enhancePolyLine();
  plugin.drawTools.addStyles();
  plugin.drawTools.addDrawControl();

  window.plugin.drawTools.drawnItems = new L.LayerGroup();
  var drawnItems = window.plugin.drawTools.drawnItems;
  map.on('draw:poly-created', function (e) {
    drawnItems.addLayer(e.poly);
  });


  map.on('draw:circle-created', function (e) {
    drawnItems.addLayer(e.circ);
  });

  map.on('draw:marker-created', function (e) {
    drawnItems.addLayer(e.marker);
    e.marker.dragging.enable();
  });

  window.layerChooser.addOverlay(drawnItems, 'Drawn Items');
  map.addLayer(drawnItems);
}


var setup =  window.plugin.drawTools.loadExternals;

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
