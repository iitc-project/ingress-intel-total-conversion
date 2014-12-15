// ==UserScript==
// @id             iitc-plugin-pan-control@fragger
// @name           IITC plugin: pan control
// @category       Controls
// @version        0.2.0.@@DATETIMEVERSION@@
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
window.plugin.panControl.horizontalKey = 'plugin-pan-control-horizontal';
window.plugin.panControl.verticalKey = 'plugin-pan-control-vertical';

window.plugin.panControl.saveState = function(key, state) {
  localStorage[key] = JSON.stringify(state);
}

window.plugin.panControl.loadState = function(key) {
  state = {
    mode: 'absolute',
    absolute: 350,
    relative: 50,
    };

  var saved = localStorage[key];
  if (saved) {
    state = JSON.parse(saved);
  } else {
    window.plugin.panControl.saveState(key, state);
  }
  return state;
}

window.plugin.panControl.getOffset = function(key, pixel_count) {
  var state = window.plugin.panControl.loadState(key);
  var offset = state.absolute;
  if (state.mode === 'relative') {
    offset = pixel_count * state.relative / 100;
  }
  return offset;
}

window.plugin.panControl.setButtons = function() {
  var mapSize = window.map.getSize();
  var hOffset = window.plugin.panControl.getOffset(
    window.plugin.panControl.horizontalKey,
    mapSize.x);
  var vOffset = window.plugin.panControl.getOffset(
    window.plugin.panControl.verticalKey,
    mapSize.y);

  window.plugin.panControl.up[1] = -vOffset;
  window.plugin.panControl.down[1] = vOffset;
  window.plugin.panControl.left[0] = -hOffset;
  window.plugin.panControl.right[0] = hOffset;
}

window.plugin.panControl.configure = function() {
  var html = '<div id="pan-control-horizontal"></div>'
           + '<div id="pan-control-vertical"></div>';
  dialog({
    html: html,
    id: 'pan-control-dialog',
    dialogClass: 'ui-dialog',
    title: 'Panning Control Options'
  });
  $('#pan-control-horizontal').pan_control({
    name: 'Horizontal',
    key: window.plugin.panControl.horizontalKey
  });
  $('#pan-control-vertical').pan_control({
    name: 'Vertical',
    key: window.plugin.panControl.verticalKey
  });
}

window.plugin.panControl.registerWidget = function() {
  // No idea why I have to explicitly override select in the css
  var css = '\
.pan-control-widget select {\
  font-size: 12px;\
  background-color: #0e3c46;\
  color: #ffce00;\
}\
.pan-control-widget input {\
  width: 4em;\
}\
';

  $('head').append('<style>' + css + '</style>');
  $.widget('iitc.pan_control', {
    options: {
      name: null,
      key: null,
    },
    max: {
      absolute: null,
      relative: 100,
    },
    spinner_change: function(e, ui) {
      var self = e.data;
      var mode = self.state.mode;
      self.state[mode] = self.spinner.val();
      self.update();
    },
    select_change: function(e) {
      var self = e.data;
      self.state.mode = self.select.val();
      self.update();
    },
    _create: function() {
      if (!this.options.name) {
        alert('programming error, name not passed');
        return;
      }
      if (!this.options.key) {
        alert('programming error, key not passed');
        return;
      }
      this.state = window.plugin.panControl.loadState(this.options.key);
      var id = this.uuid;
      var select_id = 'iitc-pan-select-' + id;
      var spinner_id = 'iitc-pan-spinner-' + id;
      var selectHtml = '<form class="pan-control-widget">'
                     + this.options.name
                     + '  <select id="' + select_id + '">'
                     + '    <option value="absolute">Absolute (pixels)</option>'
                     + '    <option value="relative">Relative (percent)</option>'
                     + '  </select>'
                     + '  <input name=value id="' + spinner_id + '">'
                     + '</form>'
                     ;
      $(selectHtml).appendTo(this.element);
      this.select = $('#' + select_id)
                    .on('change', null, this, this.select_change);
      this.spinner = $('#' + spinner_id)
                     .spinner({min: 1})
                     .on('spinstop', null, this, this.spinner_change);
      this.update();
    },
    update: function() {
      var mode = this.state.mode;
      this.select.val(mode);
      this.spinner.spinner('option', 'max', this.max[mode]);
      this.spinner.spinner('value', this.state[mode]);
      window.plugin.panControl.saveState(this.options.key, this.state);
      window.plugin.panControl.setButtons();
    },
  });
}

window.plugin.panControl.setup  = function() {
  try { console.log('Loading Leaflet.Pancontrol JS now'); } catch(e) {}
  @@INCLUDERAW:external/L.Control.Pan.js@@
  try { console.log('done loading Leaflet.Pancontrol JS'); } catch(e) {}

  window.plugin.panControl.registerWidget();

  // prevent Pancontrol from being activated by default (e.g. in minimap)
  L.Map.mergeOptions({
    panControl: false
  });

  L.Control.Pan2 = L.Control.Pan.extend({
    options: {
      position: 'topleft',
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

  window.map.panControl = L.control.pan2();
  window.map.addControl(window.map.panControl);

  if(map.zoomControl._map) {  // Move above the zoom control
    window.map.removeControl(map.zoomControl);
    window.map.zoomControl = L.control.zoom();
    window.map.addControl(window.map.zoomControl);
  }

  window.map.on('resize', function(e) {
    window.plugin.panControl.setButtons();
  });

  $('head').append('<style>@@INCLUDESTRING:external/L.Control.Pan.css@@</style>');
  $('#toolbox').append('<a onclick="window.plugin.panControl.configure();return false;" title="Panning Control Options">Pan Control Opt</a>');
}

var setup =  window.plugin.panControl.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
