// ==UserScript==
// @id             iitc-plugin-pan-control@fragger
// @name           IITC plugin: pan control
// @category       Controls
// @version        0.1.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Show a panning control on the map.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.panControl = function() {};

window.plugin.panControl.up = [0, 0];
window.plugin.panControl.down = [0, 0];
window.plugin.panControl.left = [0, 0];
window.plugin.panControl.right = [0, 0];

window.plugin.panControl.setButtons = function() {
  var opts = window.map.panControl.options;
  window.plugin.panControl.up[1] = -opts.panVerticalOffset;
  window.plugin.panControl.down[1] = opts.panVerticalOffset;
  window.plugin.panControl.left[0] = -opts.panHorizontalOffset;
  window.plugin.panControl.right[0] = opts.panHorizontalOffset;
}

window.plugin.panControl.setup  = function() {
  try { console.log('Loading Leaflet.Pancontrol JS now'); } catch(e) {}
  @@INCLUDERAW:external/L.Control.Pan.js@@
  try { console.log('done loading Leaflet.Pancontrol JS'); } catch(e) {}

  // prevent Pancontrol from being activated by default (e.g. in minimap)
  L.Map.mergeOptions({
    panControl: false
  });

  L.Control.Pan2 = L.Control.Pan.extend({
    options: {
      position: 'topleft',
      panVerticalOffset: 500,
      panHorizontalOffset: 500
    },

    onAdd: function (map) {
      var className = 'leaflet-control-pan',
        container = L.DomUtil.create('div', className);

      window.plugin.panControl.setButtons();

      this._panButton('Up'   , className + '-up'
              , container, map, window.plugin.panControl.up);
      this._panButton('Left' , className + '-left'
              , container, map, window.plugin.panControl.left);
      this._panButton('Right', className + '-right'
              , container, map, window.plugin.panControl.right);
      this._panButton('Down' , className + '-down'
              , container, map, window.plugin.panControl.down);

      return container;
    },

  });

  L.control.pan2 = function(options) {
    return new L.Control.Pan2(options);
  }

  window.map.panControl = L.control.pan2({panVerticalOffset: 350});
  window.map.addControl(window.map.panControl);

  if(map.zoomControl._map) {  // Move above the zoom control
    window.map.removeControl(map.zoomControl);
    window.map.zoomControl = L.control.zoom();
    window.map.addControl(window.map.zoomControl);
  }

  $('head').append('<style>@@INCLUDESTRING:external/L.Control.Pan.css@@</style>');
};

var setup =  window.plugin.panControl.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
