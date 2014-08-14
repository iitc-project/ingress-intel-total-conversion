// ==UserScript==
// @id             iitc-plugin-draw-tools@breunigs
// @name           IITC plugin: draw tools
// @category       Layer
// @version        0.6.4.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Allow drawing things onto the current map so you may plan your next move.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.drawTools = function() {};

window.plugin.drawTools.SYNC_DELAY = 10000;
window.plugin.drawTools.KEY_STORAGE = 'plugin-draw-tools-data';

window.plugin.drawTools.KEY = {key: window.plugin.drawTools.KEY_STORAGE, field: 'drawnItemsData'};
window.plugin.drawTools.UPDATE_QUEUE = {key: 'plugin-draw-tools-data-queue', field: 'updateQueue'};
window.plugin.drawTools.UPDATING_QUEUE = {key: 'plugin-draw-tools-data-updating-queue', field: 'updatingQueue'};

window.plugin.drawTools.drawnItemsData = {'itemArray':[]};
window.plugin.drawTools.updateQueue = {};
window.plugin.drawTools.updatingQueue = {};

window.plugin.drawTools.enableSync = false;
window.plugin.drawTools.syncInProgress = false;

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

  window.plugin.drawTools.drawControl.setDrawingOptions({
    'polygon': { 'shapeOptions': { color: color } },
    'polyline': { 'shapeOptions': { color: color } },
    'circle': { 'shapeOptions': { color: color } },
    'marker': { 'icon': window.plugin.drawTools.currentMarker },
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
  return candidates[0][1];
}

/***************************************************************************************************************************************************************/
/** LOAD/SAVE **************************************************************************************************************************************************/
/***************************************************************************************************************************************************************/

window.plugin.drawTools.upgradeStorage = function(){
  if (localStorage['plugin-draw-tools-layer']){
    var oldStor = JSON.parse(localStorage['plugin-draw-tools-layer']);
    window.plugin.drawTools.drawnItemsData.itemArray = oldStor;
    window.plugin.drawTools.saveStorage();
    localStorage.removeItem('plugin-draw-tools-layer');
  }
}

window.plugin.drawTools.loadStorage = function(){
    var jsonStr = localStorage[window.plugin.drawTools.KEY_STORAGE];
    if (typeof(jsonStr) === 'undefined'){
        return;
    }
    window.plugin.drawTools.drawnItemsData = JSON.parse(jsonStr);
}

window.plugin.drawTools.saveStorage = function(){
    localStorage[window.plugin.drawTools.KEY_STORAGE] = JSON.stringify(window.plugin.drawTools.drawnItemsData);
}

window.plugin.drawTools.getDrawnItemsArray = function() {
  var data = [];
  window.plugin.drawTools.drawnItems.eachLayer( function(layer) {
    var item = {};
    if (layer instanceof L.GeodesicCircle || layer instanceof L.Circle) {
      item.type = 'circle';
      item.latLng = layer.getLatLng();
      item.radius = layer.getRadius();
      item.color = layer.options.color;
    } else if (layer instanceof L.GeodesicPolygon || layer instanceof L.Polygon) {
      item.type = 'polygon';
      item.latLngs = layer.getLatLngs();
      item.color = layer.options.color;
    } else if (layer instanceof L.GeodesicPolyline || layer instanceof L.Polyline) {
      item.type = 'polyline';
      item.latLngs = layer.getLatLngs();
      item.color = layer.options.color;
    } else if (layer instanceof L.Marker) {
      item.type = 'marker';
      item.latLng = layer.getLatLng();
      item.color = layer.options.icon.options.color;
    } else {
      console.warn('Unknown layer type when saving draw tools layer');
      return; //.eachLayer 'continue'
    }

    data.push(item);
  });
  return data;
}

window.plugin.drawTools.save = function(){
    window.plugin.drawTools.drawnItemsData.itemArray = window.plugin.drawTools.getDrawnItemsArray();
    window.plugin.drawTools.saveStorage();
}


window.plugin.drawTools.load = function(){
    window.plugin.drawTools.loadStorage();
    window.plugin.drawTools.drawnItems.clearLayers();
    if (!window.plugin.drawTools.drawnItemsData.itemArray.length){
        return;
    }
    window.plugin.drawTools.import(window.plugin.drawTools.drawnItemsData.itemArray);
}

/***************************************************************************************************************************************************************/

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
           + '</div>';

  dialog({
    html: html,
    dialogClass: 'ui-dialog-drawtoolsSet',
    title: 'Draw Tools Options'
  });

  // need to initialise the 'spectrum' colour picker
  $('#drawtools_color').spectrum({
    flat: false,
    showInput: false,
    showButtons: false,
    showPalette: true,
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
        android.shareString(localStorage['plugin-draw-tools-layer']);
    } else {
      dialog({
        html: '<p><a onclick="$(\'.ui-dialog-drawtoolsSet-copy textarea\').select();">Select all</a> and press CTRL+C to copy it.</p><textarea readonly onclick="$(\'.ui-dialog-drawtoolsSet-copy textarea\').select();">'+localStorage['plugin-draw-tools-layer']+'</textarea>',
        width: 600,
        dialogClass: 'ui-dialog-drawtoolsSet-copy',
        title: 'Draw Tools Export'
        });
    }
}

window.plugin.drawTools.optExport = function() {
  if(typeof android !== 'undefined' && android && android.saveFile) {
    android.saveFile('IITC-drawn-items.json', 'application/json', localStorage['plugin-draw-tools-layer']);
  }
}

window.plugin.drawTools.optPaste = function() {
  var promptAction = prompt('Press CTRL+V to paste it.', '');
  if(promptAction !== null && promptAction !== '') {
    try {
      var data = JSON.parse(promptAction);
      window.plugin.drawTools.drawnItemsData.itemArray = data;
      window.plugin.drawTools.load();
      console.log('DRAWTOOLS: reset and imported drawn tiems');
      window.plugin.drawTools.optAlert('Import Successful.');

      // to write back the data to localStorage
      window.plugin.drawTools.saveStorage();
      runHooks('pluginDrawTools', {event: 'paste'})
    } catch(e) {
      console.warn('DRAWTOOLS: failed to import data: '+e);
      window.plugin.drawTools.optAlert('<span style="color: #f88">Import failed</span>');
      window.plugin.drawTools.drawnItemsData.itemArray = [];
      window.plugin.drawTools.saveStorage();
    }
  }
}

window.plugin.drawTools.optImport = function() {
  if (window.requestFile === undefined) return;
  window.requestFile(function(filename, content) {
    try {
      var data = JSON.parse(content);
      window.plugin.drawTools.drawnItemsData.itemArray = data;
      window.plugin.drawTools.load();
      console.log('DRAWTOOLS: reset and imported drawn tiems');
      window.plugin.drawTools.optAlert('Import Successful.');

      // to write back the data to localStorage
      window.plugin.drawTools.saveStorage();
      runHooks('pluginDrawTools', {event: 'import'})
    } catch(e) {
      console.warn('DRAWTOOLS: failed to import data: '+e);
      window.plugin.drawTools.optAlert('<span style="color: #f88">Import failed</span>');
      window.plugin.drawTools.drawnItemsData.itemArray = [];
      window.plugin.drawTools.saveStorage();
    }
  });
}

window.plugin.drawTools.optReset = function() {
  var promptAction = confirm('All drawn items will be deleted. Are you sure?', '');
  if(promptAction) {
    window.plugin.drawTools.drawnItemsData.itemArray = [];
    window.plugin.drawTools.saveStorage();
    window.plugin.drawTools.load();
    console.log('DRAWTOOLS: reset all drawn items');
    window.plugin.drawTools.optAlert('Reset Successful. ');
    runHooks('pluginDrawTools', {event: 'clear'});
  }
}

/***************************************************************************************************************************************************************/
/** SYNC *******************************************************************************************************************************************************/
/***************************************************************************************************************************************************************/

// Delay the syncing to group a few updates in a single request
window.plugin.drawTools.delaySync = function() {
  if(!window.plugin.drawTools.enableSync) return;
  clearTimeout(window.plugin.drawTools.delaySync.timer);
  window.plugin.drawTools.delaySync.timer = setTimeout(function() {
      window.plugin.drawTools.delaySync.timer = null;
      window.plugin.drawTools.syncNow();
    }, window.plugin.drawTools.SYNC_DELAY);
}

// Store the updateQueue in updatingQueue and upload
window.plugin.drawTools.syncNow = function() {
  if(!window.plugin.drawTools.enableSync) return;
  $.extend(window.plugin.drawTools.updatingQueue, window.plugin.drawTools.updateQueue);
  window.plugin.drawTools.updateQueue = {};
  window.plugin.drawTools.storeLocal(window.plugin.drawTools.UPDATING_QUEUE);
  window.plugin.drawTools.storeLocal(window.plugin.drawTools.UPDATE_QUEUE);
  console.log('drawTools sync - pushing update');
  window.plugin.sync.updateMap('drawTools', window.plugin.drawTools.KEY.field, Object.keys(window.plugin.drawTools.updatingQueue));
}

// Call after local or remote change uploaded
window.plugin.drawTools.syncCallback = function(pluginName, fieldName, e, fullUpdated) {
  if(fieldName === window.plugin.drawTools.KEY.field) {
    window.plugin.drawTools.storeLocal(window.plugin.drawTools.KEY);
    // All data is replaced if other client update the data during this client offline,
    if(fullUpdated) {
      console.log('drawTools sync - full update... refreshing');
      window.plugin.drawTools.load();
      return;
    }

    if(!e) return;
    if(e.isLocal) {
      // Update pushed successfully, remove it from updatingQueue
      console.log('drawTools sync - pushed successfully');
      delete window.plugin.drawTools.updatingQueue[e.property];
    } else {
      // Remote update
      delete window.plugin.drawTools.updateQueue[e.property];
      console.log('drawTools sync - received remote update');
      window.plugin.drawTools.syncInProgress = true;
      window.plugin.drawTools.storeLocal(window.plugin.drawTools.UPDATE_QUEUE);
      window.plugin.drawTools.load();
      window.plugin.drawTools.syncInProgress = false;
    }
  }
}

// Call after IITC and all plugin loaded
window.plugin.drawTools.registerFieldForSyncing = function() {
  if(!window.plugin.sync) return;
  window.plugin.sync.registerMapForSync('drawTools', window.plugin.drawTools.KEY.field, window.plugin.drawTools.syncCallback, window.plugin.drawTools.syncInitialed);
}

// syncing of the field is initialed, upload all queued update
window.plugin.drawTools.syncInitialed = function(pluginName, fieldName) {
  if(fieldName === window.plugin.drawTools.KEY.field) {
    window.plugin.drawTools.enableSync = true;
      if(Object.keys(window.plugin.drawTools.updateQueue).length > 0) {
        window.plugin.drawTools.delaySync();
      }
  }
}

window.plugin.drawTools.storeLocal = function(mapping) {
  if(typeof(window.plugin.drawTools[mapping.field]) !== 'undefined' && window.plugin.drawTools[mapping.field] !== null) {
    localStorage[mapping.key] = JSON.stringify(window.plugin.drawTools[mapping.field]);
  } else {
    localStorage.removeItem(mapping.key);
  }
}

window.plugin.drawTools.loadLocal = function(mapping) {
  var objectJSON = localStorage[mapping.key];
  if(!objectJSON) return;
  window.plugin.drawTools[mapping.field] = mapping.convertFunc
                            ? mapping.convertFunc(JSON.parse(objectJSON))
                            : JSON.parse(objectJSON);
}

window.plugin.drawTools.syncItems = function(data){
  if(window.plugin.drawTools.syncInProgress) return;
  var watchedEvents = ['layerCreated', 'layersEdited', 'layersDeleted', 'paste', 'import', 'clear'];
  // No need to update from localStorage since it's already been done after these events are triggered
  if(data.event && watchedEvents.indexOf(data.event) != -1){
    window.plugin.drawTools.updateQueue = window.plugin.drawTools.drawnItemsData;
    window.plugin.drawTools.storeLocal(window.plugin.drawTools.UPDATE_QUEUE);
    window.plugin.drawTools.delaySync();
  }
}

/***************************************************************************************************************************************************************/

window.plugin.drawTools.boot = function() {
  // add a custom hook for draw tools to share it's activity with other plugins
  //pluginCreateHook('pluginDrawTools');

  if($.inArray('pluginDrawTools', window.VALID_HOOKS) < 0) { window.VALID_HOOKS.push('pluginDrawTools'); }

  window.plugin.drawTools.currentMarker = window.plugin.drawTools.getMarkerIcon(window.plugin.drawTools.currentColor);

  window.plugin.drawTools.setOptions();

  //create a leaflet FeatureGroup to hold drawn items
  window.plugin.drawTools.drawnItems = new L.FeatureGroup();

  window.plugin.drawTools.loadLocal(window.plugin.drawTools.UPDATE_QUEUE);

  //load any previously saved items
  window.plugin.drawTools.upgradeStorage();
  window.plugin.drawTools.load();

  //add the draw control - this references the above FeatureGroup for editing purposes
  window.plugin.drawTools.addDrawControl();

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
  window.addHook('pluginDrawTools', window.plugin.drawTools.syncItems);
  window.addHook('iitcLoaded', window.plugin.drawTools.registerFieldForSyncing);
}

var setup =  window.plugin.drawTools.loadExternals;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
