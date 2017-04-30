// ==UserScript==
// @id             iitc-plugin-draw-tools@breunigs
// @name           IITC plugin: draw tools
// @category       Layer
// @version        0.7.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Allow drawing things onto the current map so you may plan your next move.
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @include        https://*.ingress.com/mission/*
// @include        http://*.ingress.com/mission/*
// @match          https://*.ingress.com/mission/*
// @match          http://*.ingress.com/mission/*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.drawTools = function() {};

// Sync start

window.plugin.drawTools.SYNC_DELAY = 2000;

// Mapping from plugin field names to localStorage names
window.plugin.drawTools.FIELDS = {
  'drawings'      : 'plugin-drawTools-data',
  'updateQueue'   : 'plugin-drawTools-update-queue',
  'updatingQueue' : 'plugin-drawTools-updating-queue',
};

window.plugin.drawTools.drawings = {};
window.plugin.drawTools.updateQueue = {};
window.plugin.drawTools.updatingQueue = {};

window.plugin.drawTools.enableSync = false;

// Mark the given key from drawings to be synced
plugin.drawTools.sync = function(key) {
  plugin.drawTools.updateQueue[key] = true;
  plugin.drawTools.storeLocal('drawings');
  plugin.drawTools.storeLocal('updateQueue');
  plugin.drawTools.syncQueue();
};

// Start sync, delayed by 2s to allow for more changes to be queued.
window.plugin.drawTools.syncQueue = function() {
  if(!plugin.drawTools.enableSync) return;

  clearTimeout(plugin.drawTools.syncTimer);

  plugin.drawTools.syncTimer = setTimeout(function() {
    plugin.drawTools.syncTimer = null;

    $.extend(plugin.drawTools.updatingQueue, plugin.drawTools.updateQueue);
    plugin.drawTools.updateQueue = {}; // Updates are tracked in updatingQueue, reset updateQueue
    plugin.drawTools.storeLocal('updatingQueue');
    plugin.drawTools.storeLocal('updateQueue');

    plugin.sync.updateMap('drawTools', 'drawings', Object.keys(plugin.drawTools.updatingQueue));
  }, plugin.drawTools.SYNC_DELAY);
};

// Call after IITC boot, register drawings as a map to be synced.
window.plugin.drawTools.registerFieldForSyncing = function() {
  if(!window.plugin.sync) return;
  window.plugin.sync.registerMapForSync('drawTools', 'drawings', window.plugin.drawTools.syncCallback, window.plugin.drawTools.syncInitialized);
};

// This is triggered after any sync update
window.plugin.drawTools.syncCallback = function(pluginName, fieldName, e, fullUpdated) {
  if(fieldName === 'drawings') {
    plugin.drawTools.storeLocal('drawings');
    if(fullUpdated) {
      // Clear layers and redraw all
      window.plugin.drawTools.load();
      return;
    }

    if(!e) return; // If there is no updated object, exit
    if(e.isLocal) {
      // Update pushed successfully, remove it from updatingQueue
      delete plugin.drawTools.updatingQueue[e.property];
      console.log('DrawTools: local update detected, no redraw required.');
    } else {
      // Clear layers and redraw all
      delete plugin.drawTools.updateQueue[e.property];
      if (e.newValue == null) // The drawing starting at e.property has been deleted
        delete window.plugin.drawTools.drawnItems[e.property];

      plugin.drawTools.storeLocal('updateQueue');
      window.plugin.drawTools.load();
    }
  }
};

// Called when sync has been initialized
window.plugin.drawTools.syncInitialized = function(pluginName, fieldName) {
  if(fieldName === 'drawings') {
    plugin.drawTools.enableSync = true;

    // If there are any pending updates, sync the queue
    if(Object.keys(plugin.drawTools.updateQueue).length > 0) {
      plugin.drawTools.syncQueue();
    }
  }
};

window.plugin.drawTools.storeLocal = function(name) {
  var key = window.plugin.drawTools.FIELDS[name];
  if(key === undefined) return;

  var value = plugin.drawTools[name];

  if(typeof value !== 'undefined' && value !== null) {
    localStorage[key] = JSON.stringify(plugin.drawTools[name]);
  } else {
    localStorage.removeItem(key);
  }
};

window.plugin.drawTools.loadLocal = function(name) {
  var key = window.plugin.drawTools.FIELDS[name];
  if(key === undefined) return;

  if(localStorage[key] !== undefined) {
    plugin.drawTools[name] = JSON.parse(localStorage[key]);

  if (name == 'drawings')
    window.plugin.drawTools.load();
  }
};

window.plugin.drawTools.save = function() {
  var oldDrawingsKeys = Object.keys(plugin.drawTools.drawings);
  plugin.drawTools.drawings = {};
  window.plugin.drawTools.drawnItems.eachLayer( function(layer) {
    var item = {};
    var key = null;
    if (layer instanceof L.GeodesicCircle || layer instanceof L.Circle) {
      item.type = 'circle';
      item.latLng = layer.getLatLng();
      item.radius = layer.getRadius();
      item.color = layer.options.color;
      key = item.latLng;
    } else if (layer instanceof L.GeodesicPolygon || layer instanceof L.Polygon) {
      item.type = 'polygon';
      item.latLngs = layer.getLatLngs();
      item.color = layer.options.color;
      key = item.latLngs[0];
    } else if (layer instanceof L.GeodesicPolyline || layer instanceof L.Polyline) {
      item.type = 'polyline';
      item.latLngs = layer.getLatLngs();
      item.color = layer.options.color;
      key = item.latLngs[0];
    } else if (layer instanceof L.Marker) {
      item.type = 'marker';
      item.latLng = layer.getLatLng();
      item.color = layer.options.icon.options.color;
      key = item.latLng;
    } else {
      console.warn('Unknown layer type when saving draw tools layer');
      return;
    }
    // Latitute to 3 points to eliminate vast numbers of keys
    key = key.lat.toFixed(3);
    window.plugin.drawTools.addDrawing(key, item);
  });

  // Get the set of drawing start points that have been removed at this change
  var newDrawingsKeys = Object.keys(plugin.drawTools.drawings);
  var deletedKeys = $(oldDrawingsKeys).not(newDrawingsKeys).get();

  $.each(deletedKeys, function(index, key) {
    window.plugin.drawTools.removeDrawing(key);
  });

  window.plugin.drawTools.storeLocal('drawings');
};

window.plugin.drawTools.addDrawing = function(key, item) {
  if (!plugin.drawTools.drawings[key])
    plugin.drawTools.drawings[key] = [];
  if ($.inArray(item, plugin.drawTools.drawings[key]) == -1)
    plugin.drawTools.drawings[key].push(item);

  window.plugin.drawTools.sync(key);
  console.log('DrawTools: added drawing starting at ' + key);
};

window.plugin.drawTools.removeDrawing = function(key) {
  window.plugin.drawTools.drawings[key] = undefined; // Ensure that sync deletes the key.

  window.plugin.drawTools.sync(key);
  console.log('DrawTools: removed drawing starting at ' + key);
};

window.plugin.drawTools.importMapping = function(data) {
  $.each(Object.keys(data), function(index, key) {
    window.plugin.drawTools.import(data[key]);
  });
};

window.plugin.drawTools.resetDrawings = function () {
  delete localStorage['plugin-drawTools-data'];
  window.plugin.drawTools.drawnItems.clearLayers();
  window.plugin.drawTools.save();
  window.plugin.drawTools.load();
  console.log('DrawTools: removed drawings. Synced.')
};

window.plugin.drawTools.load = function() {
  try {
    var dataStr = localStorage['plugin-drawTools-data'];
    if (dataStr === undefined) return;

    console.log('DrawTools: loaded drawing data, redrawing.');
    window.plugin.drawTools.drawnItems.clearLayers();
    window.plugin.drawTools.importMapping(JSON.parse(dataStr));
  } catch(e) {
    console.warn('DrawTools: failed to load data from localStorage: '+e);
  }
};

// Sync end

window.plugin.drawTools.loadExternals = function() {
  try { console.log('Loading leaflet.draw JS now'); } catch(e) {}
  @@INCLUDERAW:external/leaflet.draw.js@@
  @@INCLUDERAW:external/spectrum/spectrum.js@@
  try { console.log('done loading leaflet.draw JS'); } catch(e) {}

  window.plugin.drawTools.boot();

  $('head').append('<style>@@INCLUDESTRING:external/leaflet.draw.css@@</style>');
  $('head').append('<style>@@INCLUDESTRING:external/spectrum/spectrum.css@@</style>');
}

window.plugin.drawTools.getMarkerIcon = function(color) {
  if (typeof(color) === 'undefined') {
    console.warn('Color is not set or not a valid color. Using default color as fallback.');
    color = '#a24ac3';
  }

  var svgIcon = window.plugin.drawTools.markerTemplate.replace(/%COLOR%/g, color);

  return L.divIcon({
    iconSize: new L.Point(25, 41),
    iconAnchor: new L.Point(12, 41),
    html: svgIcon,
    className: 'leaflet-iitc-custom-icon',
    // L.divIcon does not use the option color, but we store it here to
    // be able to simply retrieve the color for serializing markers
    color: color
  });
}

window.plugin.drawTools.currentColor = '#a24ac3';
window.plugin.drawTools.markerTemplate = '@@INCLUDESTRING:images/marker-icon.svg.template@@';

window.plugin.drawTools.setOptions = function() {

  window.plugin.drawTools.lineOptions = {
    stroke: true,
    color: window.plugin.drawTools.currentColor,
    weight: 4,
    opacity: 0.5,
    fill: false,
    clickable: true
  };

  window.plugin.drawTools.polygonOptions = L.extend({}, window.plugin.drawTools.lineOptions, {
    fill: true,
    fillColor: null, // to use the same as 'color' for fill
    fillOpacity: 0.2
  });

  window.plugin.drawTools.editOptions = L.extend({}, window.plugin.drawTools.polygonOptions, {
    dashArray: [10,10]
  });
  delete window.plugin.drawTools.editOptions.color;

  window.plugin.drawTools.markerOptions = {
    icon: window.plugin.drawTools.currentMarker,
    zIndexOffset: 2000
  };

}

window.plugin.drawTools.setDrawColor = function(color) {
  window.plugin.drawTools.currentColor = color;
  window.plugin.drawTools.currentMarker = window.plugin.drawTools.getMarkerIcon(color);

  window.plugin.drawTools.lineOptions.color = color;
  window.plugin.drawTools.polygonOptions.color = color;
  window.plugin.drawTools.markerOptions.icon = window.plugin.drawTools.currentMarker;

  plugin.drawTools.drawControl.setDrawingOptions({
    polygon:  { shapeOptions: plugin.drawTools.polygonOptions },
    polyline: { shapeOptions: plugin.drawTools.lineOptions },
    circle:   { shapeOptions: plugin.drawTools.polygonOptions },
    marker:   { icon:         plugin.drawTools.markerOptions.icon },
  });
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
          + 'finish. Double clicking also works.',
        shapeOptions: window.plugin.drawTools.polygonOptions,
        snapPoint: window.plugin.drawTools.getSnapLatLng,
      },

      polyline: {
        title: 'Add a (poly) line.\n\n'
          + 'Click on the button, then click on the map to\n'
          + 'define the start of the line. Continue clicking\n'
          + 'to draw the line you want. Click the <b>last</b>\n'
          + 'point of the line (a small white rectangle) to\n'
          + 'finish. Double clicking also works.',
        shapeOptions: window.plugin.drawTools.lineOptions,
        snapPoint: window.plugin.drawTools.getSnapLatLng,
      },

      circle: {
        title: 'Add a circle.\n\n'
          + 'Click on the button, then click-AND-HOLD on the\n'
          + 'map where the circle’s center should be. Move\n'
          + 'the mouse to control the radius. Release the mouse\n'
          + 'to finish.',
        shapeOptions: window.plugin.drawTools.polygonOptions,
        snapPoint: window.plugin.drawTools.getSnapLatLng,
      },

      // Options for marker (icon, zIndexOffset) are not set via shapeOptions,
      // so we have merge them here!
      marker: L.extend({}, window.plugin.drawTools.markerOptions, {
        title: 'Add a marker.\n\n'
          + 'Click on the button, then click on the map where\n'
          + 'you want the marker to appear.',
        snapPoint: window.plugin.drawTools.getSnapLatLng,
        repeatMode: true
      }),

    },

    edit: {
      featureGroup: window.plugin.drawTools.drawnItems,

      edit: {
        title: 'Edit drawn items',
        selectedPathOptions: window.plugin.drawTools.editOptions,
      },

      remove: {
        title: 'Delete drawn items'
      },

    },

  });

  window.plugin.drawTools.drawControl = drawControl;

  map.addControl(drawControl);
  //plugin.drawTools.addCustomButtons();

  window.plugin.drawTools.setAccessKeys();
  for (var toolbarId in drawControl._toolbars) {
    if (drawControl._toolbars[toolbarId] instanceof L.Toolbar) {
      drawControl._toolbars[toolbarId].on('enable', function() {
        setTimeout(window.plugin.drawTools.setAccessKeys, 10);
      });
    }
  }
}

window.plugin.drawTools.setAccessKeys = function() {
  var expr = /\s*\[\w+\]$/;
  // there is no API to add accesskeys, so have to dig in the DOM
  // must be same order as in markup. Note that each toolbar has a container for save/cancel
  var accessKeys = [
    'l', 'p', 'o', 'm', // line, polygon, circle, marker
    'a',                // cancel (_abort)
    'e', 'd',           // edit, delete
    's', 'a',           // save, cancel
  ];
  var buttons = window.plugin.drawTools.drawControl._container.getElementsByTagName('a');
  for(var i=0;i<buttons.length;i++) {
    var button = buttons[i];

    var title = button.title;
    var index = title.search(expr);
    if(index !== -1) title = title.substr(0, index);

    if(!button.offsetParent) { // element hidden, delete accessKey (so other elements can use it)
      button.accessKey = '';
    } else if(accessKeys[i]) {
      button.accessKey = accessKeys[i];
      if(title === "") title = "[" + accessKeys[i] + "]";
      else title += " [" + accessKeys[i] + "]";
    }
    button.title = title;
  }
}


// given a point it tries to find the most suitable portal to
// snap to. It takes the CircleMarker’s radius and weight into account.
// Will return null if nothing to snap to or a LatLng instance.
window.plugin.drawTools.getSnapLatLng = function(unsnappedLatLng) {
  var containerPoint = map.latLngToContainerPoint(unsnappedLatLng);
  var candidates = [];
  $.each(window.portals, function(guid, portal) {
    var ll = portal.getLatLng();
    var pp = map.latLngToContainerPoint(ll);
    var size = portal.options.weight + portal.options.radius;
    var dist = pp.distanceTo(containerPoint);
    if(dist > size) return true;
    candidates.push([dist, ll]);
  });

  if(candidates.length === 0) return unsnappedLatLng;
  candidates = candidates.sort(function(a, b) { return a[0]-b[0]; });
  return new L.LatLng(candidates[0][1].lat, candidates[0][1].lng);  //return a clone of the portal location
}

window.plugin.drawTools.import = function(data) {
  $.each(data, function(index,item) {
    var layer = null;
    var extraOpt = {};
    if (item.color) extraOpt.color = item.color;

    switch(item.type) {
      case 'polyline':
        layer = L.geodesicPolyline(item.latLngs, L.extend({},window.plugin.drawTools.lineOptions,extraOpt));
        break;
      case 'polygon':
        layer = L.geodesicPolygon(item.latLngs, L.extend({},window.plugin.drawTools.polygonOptions,extraOpt));
        break;
      case 'circle':
        layer = L.geodesicCircle(item.latLng, item.radius, L.extend({},window.plugin.drawTools.polygonOptions,extraOpt));
        break;
      case 'marker':
        var extraMarkerOpt = {};
        if (item.color) extraMarkerOpt.icon = window.plugin.drawTools.getMarkerIcon(item.color);
        layer = L.marker(item.latLng, L.extend({},window.plugin.drawTools.markerOptions,extraMarkerOpt));
        window.registerMarkerForOMS(layer);
        break;
      default:
        console.warn('unknown layer type "'+item.type+'" when loading draw tools layer');
        break;
    }
    if (layer) {
      window.plugin.drawTools.drawnItems.addLayer(layer);
    }
  });
  window.plugin.drawTools.save();
  runHooks('pluginDrawTools', {event: 'import'});
}


//Draw Tools Options

// Manual import, export and reset data
window.plugin.drawTools.manualOpt = function() {

  var html = '<div class="drawtoolsStyles">'
           + '<input type="color" name="drawColor" id="drawtools_color"></input>'
//TODO: add line style choosers: thickness, maybe dash styles?
           + '</div>'
           + '<div class="drawtoolsSetbox">'
           + '<a onclick="window.plugin.drawTools.optCopy();" tabindex="0">Copy Drawn Items</a>'
           + '<a onclick="window.plugin.drawTools.optPaste();return false;" tabindex="0">Paste Drawn Items</a>'
           + (window.requestFile != undefined
             ? '<a onclick="window.plugin.drawTools.optImport();return false;" tabindex="0">Import Drawn Items</a>' : '')
           + ((typeof android !== 'undefined' && android && android.saveFile)
             ? '<a onclick="window.plugin.drawTools.optExport();return false;" tabindex="0">Export Drawn Items</a>' : '')
           + '<a onclick="window.plugin.drawTools.optReset();return false;" tabindex="0">Reset Drawn Items</a>'
           + '<a onclick="window.plugin.drawTools.snapToPortals();return false;" tabindex="0">Snap to portals</a>'
           + '</div>';

  dialog({
    html: html,
    id: 'plugin-drawtools-options',
    dialogClass: 'ui-dialog-drawtoolsSet',
    title: 'Draw Tools Options'
  });

  // need to initialise the 'spectrum' colour picker
  $('#drawtools_color').spectrum({
    flat: false,
    showInput: false,
    showButtons: false,
    showPalette: true,
    showPaletteOnly: false,
    showSelectionPalette: false,
    palette: [ ['#a24ac3','#514ac3','#4aa8c3','#51c34a'],
               ['#c1c34a','#c38a4a','#c34a4a','#c34a6f'],
               ['#000000','#666666','#bbbbbb','#ffffff']
    ],
    change: function(color) { window.plugin.drawTools.setDrawColor(color.toHexString()); },
//    move: function(color) { window.plugin.drawTools.setDrawColor(color.toHexString()); },
    color: window.plugin.drawTools.currentColor,
  });
}

window.plugin.drawTools.optAlert = function(message) {
    $('.ui-dialog-drawtoolsSet .ui-dialog-buttonset').prepend('<p class="drawtools-alert" style="float:left;margin-top:4px;">'+message+'</p>');
    $('.drawtools-alert').delay(2500).fadeOut();
}

window.plugin.drawTools.optCopy = function() {
    if (typeof android !== 'undefined' && android && android.shareString) {
        android.shareString(localStorage['plugin-drawTools-data']);
    } else {
      var stockWarnings = {};
      var stockLinks = [];
      window.plugin.drawTools.drawnItems.eachLayer( function(layer) {
        if (layer instanceof L.GeodesicCircle || layer instanceof L.Circle) {
          stockWarnings.noCircle = true;
          return; //.eachLayer 'continue'
        } else if (layer instanceof L.GeodesicPolygon || layer instanceof L.Polygon) {
          stockWarnings.polyAsLine = true;
          // but we can export them
        } else if (layer instanceof L.GeodesicPolyline || layer instanceof L.Polyline) {
          // polylines are fine
        } else if (layer instanceof L.Marker) {
          stockWarnings.noMarker = true;
          return; //.eachLayer 'continue'
        } else {
          stockWarnings.unknown = true; //should never happen
          return; //.eachLayer 'continue'
        }
        // only polygons and polylines make it through to here
        var latLngs = layer.getLatLngs();
        // stock only handles one line segment at a time
        for (var i=0; i<latLngs.length-1; i++) {
          stockLinks.push([latLngs[i].lat,latLngs[i].lng,latLngs[i+1].lat,latLngs[i+1].lng]);
        }
        // for polygons, we also need a final link from last to first point
        if (layer instanceof L.GeodesicPolygon || layer instanceof L.Polygon) {
          stockLinks.push([latLngs[latLngs.length-1].lat,latLngs[latLngs.length-1].lng,latLngs[0].lat,latLngs[0].lng]);
        }
      });
      var stockUrl = 'https://www.ingress.com/intel?ll='+map.getCenter().lat+','+map.getCenter().lng+'&z='+map.getZoom()+'&pls='+stockLinks.map(function(link){return link.join(',');}).join('_');
      var stockWarnTexts = [];
      if (stockWarnings.polyAsLine) stockWarnTexts.push('Note: polygons are exported as lines');
      if (stockLinks.length>40) stockWarnTexts.push('Warning: Stock intel may not work with more than 40 line segments - there are '+stockLinks.length);
      if (stockWarnings.noCircle) stockWarnTexts.push('Warning: Circles cannot be exported to stock intel');
      if (stockWarnings.noMarker) stockWarnTexts.push('Warning: Markers cannot be exported to stock intel');
      if (stockWarnings.unknown) stockWarnTexts.push('Warning: UNKNOWN ITEM TYPE');

      var html = '<p><a onclick="$(\'.ui-dialog-drawtoolsSet-copy textarea\').select();">Select all</a> and press CTRL+C to copy it.</p>'
                +'<textarea readonly onclick="$(\'.ui-dialog-drawtoolsSet-copy textarea\').select();">'+localStorage['plugin-drawTools-data']+'</textarea>'
                +'<p>or, export as a link for the standard intel map (for non IITC users)</p>'
                +'<input onclick="event.target.select();" type="text" size="90" value="'+stockUrl+'"/>';
      if (stockWarnTexts.length>0) {
        html += '<ul><li>'+stockWarnTexts.join('</li><li>')+'</li></ul>';
      }

      dialog({
        html: html,
        width: 600,
        dialogClass: 'ui-dialog-drawtoolsSet-copy',
        title: 'Draw Tools Export'
        });
    }
}

window.plugin.drawTools.optExport = function() {
  if(typeof android !== 'undefined' && android && android.saveFile) {
    android.saveFile('IITC-drawn-items.json', 'application/json', localStorage['plugin-drawTools-data']);
  }
}

window.plugin.drawTools.optPaste = function() {
  var promptAction = prompt('Press CTRL+V to paste (draw-tools data or stock intel URL).', '');
  if(promptAction !== null && promptAction !== '') {
    try {
      // first see if it looks like a URL-format stock intel link, and if so, try and parse out any stock drawn items
      // from the pls parameter
      if (promptAction.match(new RegExp("^(https?://)?(www\\.)?ingress\\.com/intel.*[?&]pls="))) {
        //looks like a ingress URL that has drawn items...
        var items = promptAction.split(/[?&]/);
        var foundAt = -1;
        for (var i=0; i<items.length; i++) {
          if (items[i].substr(0,4) == "pls=") {
            foundAt = i;
          }
        }

        if (foundAt == -1) throw ("No drawn items found in intel URL");

        var newLines = [];
        var linesStr = items[foundAt].substr(4).split('_');
        for (var i=0; i<linesStr.length; i++) {
          var floats = linesStr[i].split(',').map(Number);
          if (floats.length != 4) throw("URL item not a set of four floats");
          for (var j=0; j<floats.length; j++) {
            if (isNaN(floats[j])) throw("URL item had invalid number");
          }
          var layer = L.geodesicPolyline([[floats[0],floats[1]],[floats[2],floats[3]]], window.plugin.drawTools.lineOptions);
          newLines.push(layer);
        }

        window.plugin.drawTools.resetDrawings();

        for (var i=0; i<newLines.length; i++) {
          window.plugin.drawTools.drawnItems.addLayer(newLines[i]);
        }
        runHooks('pluginDrawTools', {event: 'import'});

        console.log('DRAWTOOLS: reset and imported drawn items from stock URL');
      } else {
        var data = JSON.parse(promptAction);
        window.plugin.drawTools.resetDrawings();
        window.plugin.drawTools.importMapping(data);
        console.log('DRAWTOOLS: reset and imported drawn items');
      }
      window.plugin.drawTools.optAlert('Import Successful.');
      window.plugin.drawTools.save();

    } catch(e) {
      console.warn('DRAWTOOLS: failed to import data: '+e);
      window.plugin.drawTools.optAlert('<span style="color: #f88">Import failed</span>');
    }
  }
}

window.plugin.drawTools.optImport = function() {
  if (window.requestFile === undefined) return;
  window.requestFile(function(filename, content) {
    try {
      var data = JSON.parse(content);
      window.plugin.drawTools.resetDrawings();
      window.plugin.drawTools.importMapping(data);
      console.log('DRAWTOOLS: reset and imported drawn items');
      window.plugin.drawTools.optAlert('Import Successful.');

      // to write back the data to localStorage
      window.plugin.drawTools.save();
    } catch(e) {
      console.warn('DRAWTOOLS: failed to import data: '+e);
      window.plugin.drawTools.optAlert('<span style="color: #f88">Import failed</span>');
    }
  });
}

window.plugin.drawTools.optReset = function() {
  var promptAction = confirm('All drawn items will be deleted. Are you sure?', '');
  if(promptAction) {
    window.plugin.drawTools.resetDrawings();
    window.plugin.drawTools.optAlert('Reset Successful. ');
    runHooks('pluginDrawTools', {event: 'clear'});
  }
}

window.plugin.drawTools.snapToPortals = function() {
  var dataParams = getMapZoomTileParameters(getDataZoomForMapZoom(map.getZoom()));
  if (dataParams.level > 0) {
    if (!confirm('Not all portals are visible on the map. Snap to portals may move valid points to the wrong place. Continue?')) {
      return;
    }
  }

  if (mapDataRequest.status.short != 'done') {
    if (!confirm('Map data has not completely loaded, so some portals may be missing. Do you want to continue?')) {
      return;
    }
  }

  var visibleBounds = map.getBounds();

  // let's do all the distance calculations in screen space. 2d is much easier, should be faster, and is more than good enough
  // we'll pre-project all the on-screen portals too, to save repeatedly doing it
  var visiblePortals = {};
  $.each(window.portals, function(guid,portal) {
    var ll = portal.getLatLng();
    if (visibleBounds.contains(ll)) {
      visiblePortals[guid] = map.project(ll);
    }
  });

  if (Object.keys(visiblePortals).length == 0) {
    alert('Error: No portals visible in this view - nothing to snap points to!');
    return;
  }

  var findClosestPortalLatLng = function(latlng) {
    var testpoint = map.project(latlng);

    var minDistSquared = undefined;
    var minGuid = undefined;
    for (var guid in visiblePortals) {
      var p = visiblePortals[guid];
      var distSquared = (testpoint.x-p.x)*(testpoint.x-p.x) + (testpoint.y-p.y)*(testpoint.y-p.y);
      if (minDistSquared == undefined || minDistSquared > distSquared) {
        minDistSquared = distSquared;
        minGuid = guid;
      }
    }
    return minGuid ? portals[minGuid].getLatLng() : undefined; //should never hit 'undefined' case - as we abort when the list is empty
  };


  var changedCount = 0;
  var testCount = 0;

  window.plugin.drawTools.drawnItems.eachLayer(function(layer) {
    if (layer.getLatLng) {
      //circles and markers - a single point to snap
      var ll = layer.getLatLng();
      if (visibleBounds.contains(ll)) {
        testCount++;
        var newll = findClosestPortalLatLng(ll);
        if (!newll.equals(ll)) {
          layer.setLatLng(new L.LatLng(newll.lat,newll.lng));
          changedCount++;
        }
      }
    } else if (layer.getLatLngs) {
      var lls = layer.getLatLngs();
      var layerChanged = false;
      for (var i=0; i<lls.length; i++) {
        if (visibleBounds.contains(lls[i])) {
          testCount++;
          var newll = findClosestPortalLatLng(lls[i]);
          if (!newll.equals(lls[i])) {
            lls[i] = new L.LatLng(newll.lat,newll.lng);
            changedCount++;
            layerChanged = true;
          }
        }
      }
      if (layerChanged) {
        layer.setLatLngs(lls);
      }
    }
  });

  if(changedCount > 0) {
    runHooks('pluginDrawTools',{event:'layersSnappedToPortals'}); //or should we send 'layersEdited'? as that's effectively what's happened...
  }

  alert('Tested '+testCount+' points, and moved '+changedCount+' onto portal coordinates');

  window.plugin.drawTools.save();
}

window.plugin.drawTools.boot = function() {
  // add a custom hook for draw tools to share it's activity with other plugins
  pluginCreateHook('pluginDrawTools');
  window.addHook('iitcLoaded', window.plugin.drawTools.registerFieldForSyncing);

  window.plugin.drawTools.currentMarker = window.plugin.drawTools.getMarkerIcon(window.plugin.drawTools.currentColor);

  window.plugin.drawTools.setOptions();

  //create a leaflet FeatureGroup to hold drawn items
  window.plugin.drawTools.drawnItems = new L.FeatureGroup();

  //load any previously saved items
  plugin.drawTools.load();

  //add the draw control - this references the above FeatureGroup for editing purposes
  plugin.drawTools.addDrawControl();

  //start off hidden. if the layer is enabled, the below addLayerGroup will add it, triggering a 'show'
  $('.leaflet-draw-section').hide();


  //hide the draw tools when the 'drawn items' layer is off, show it when on
  map.on('layeradd', function(obj) {
    if(obj.layer === window.plugin.drawTools.drawnItems) {
      $('.leaflet-draw-section').show();
    }
  });
  map.on('layerremove', function(obj) {
    if(obj.layer === window.plugin.drawTools.drawnItems) {
      $('.leaflet-draw-section').hide();
    }
  });

  //add the layer
  window.addLayerGroup('Drawn Items', window.plugin.drawTools.drawnItems, true);


  //place created items into the specific layer
  map.on('draw:created', function(e) {
    var type=e.layerType;
    var layer=e.layer;
    window.plugin.drawTools.drawnItems.addLayer(layer);
    window.plugin.drawTools.save();

    if(layer instanceof L.Marker) {
      window.registerMarkerForOMS(layer);
    }

    runHooks('pluginDrawTools',{event:'layerCreated',layer:layer});
  });

  map.on('draw:deleted', function(e) {
    window.plugin.drawTools.save();
    runHooks('pluginDrawTools',{event:'layersDeleted'});
  });

  map.on('draw:edited', function(e) {
    window.plugin.drawTools.save();
    runHooks('pluginDrawTools',{event:'layersEdited'});
  });
  //add options menu
  $('#toolbox').append('<a onclick="window.plugin.drawTools.manualOpt();return false;" accesskey="x" title="[x]">DrawTools Opt</a>');

  $('head').append('<style>' +
        '.drawtoolsSetbox > a { display:block; color:#ffce00; border:1px solid #ffce00; padding:3px 0; margin:10px auto; width:80%; text-align:center; background:rgba(8,48,78,.9); }'+
        '.ui-dialog-drawtoolsSet-copy textarea { width:96%; height:250px; resize:vertical; }'+
        '</style>');

}


var setup =  window.plugin.drawTools.loadExternals;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
