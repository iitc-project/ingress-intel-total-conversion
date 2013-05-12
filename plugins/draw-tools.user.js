// ==UserScript==
// @id             iitc-plugin-draw-tools@breunigs
// @name           IITC plugin: draw tools
// @version        0.3.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Allows you to draw things into the current map so you may plan your next move
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// ==/UserScript==

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.drawTools = function() {};

window.plugin.drawTools.loadExternals = function() {
  try { console.log('Loading leaflet.draw JS now'); } catch(e) {}
  @@INCLUDERAW:external/leaflet.draw.js@@
  try { console.log('done loading leaflet.draw JS'); } catch(e) {}

  window.plugin.drawTools.boot();

  $('head').append('<style>@@INCLUDESTRING:external/leaflet.draw.css@@</style>');
}



// renders the draw control buttons in the top left corner
window.plugin.drawTools.addDrawControl = function() {
  var drawControl = new L.Control.Draw({
    draw: {
      rectangle: false,
      polygon: {
        title: 'Add a polygon\n\n'
          + 'Click on the button, then click on the map to\n'
          + 'define the start of the polygon. Continue clicking\n'
          + 'to draw the line you want. Click the first or last\n'
          + 'point of the line (a small white rectangle) to\n'
          + 'finish. Double clicking also works.'
      },

      polyline: {
        title: 'Add a (poly) line.\n\n'
          + 'Click on the button, then click on the map to\n'
          + 'define the start of the line. Continue clicking\n'
          + 'to draw the line you want. Click the <b>last</b>\n'
          + 'point of the line (a small white rectangle) to\n'
          + 'finish. Double clicking also works.'
      },

      circle: {
        title: 'Add a circle.\n\n'
          + 'Click on the button, then click-AND-HOLD on the\n'
          + 'map where the circle’s center should be. Move\n'
          + 'the mouse to control the radius. Release the mouse\n'
          + 'to finish.'
      },

      marker: {
        title: 'Add a marker.\n\n'
          + 'Click on the button, then click on the map where\n'
          + 'you want the marker to appear.'
      },

    },

    edit: {
      featureGroup: window.plugin.drawTools.drawnItems,

      edit: {
        title: 'Edit drawn items'
      },

      remove: {
        title: 'Delete drawn items'
      },

    },

  });

  map.addControl(drawControl);
//  plugin.drawTools.addCustomButtons();
}


// given a container point it tries to find the most suitable portal to
// snap to. It takes the CircleMarker’s radius and weight into account.
// Will return null if nothing to snap to or a LatLng instance.
window.plugin.drawTools.getSnapLatLng = function(containerPoint) {
// TODO: use this function again, if possible
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
  //create a leaflet FeatureGroup to hold drawn items

  window.plugin.drawTools.drawnItems = new L.FeatureGroup();
  var drawnItems = window.plugin.drawTools.drawnItems;

  window.layerChooser.addOverlay(drawnItems, 'Drawn Items');
  map.addLayer(drawnItems);

  //add the draw control - this references the above FeatureGroup for editing purposes
  plugin.drawTools.addDrawControl();

  map.on('draw:created', function(e) {
    var type=e.layerType;
    var layer=e.layer;
    window.plugin.drawTools.drawnItems.addLayer(layer);
  });

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
