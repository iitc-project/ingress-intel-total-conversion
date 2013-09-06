// ==UserScript==
// @id             iitc-plugin-draw-resonators@xelio
// @name           IITC plugin: Draw resonators
// @category       Layer
// @version        0.2.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Draw resonators on map.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.drawResonators = function() {};


window.plugin.drawResonators.options;
window.plugin.drawResonators.render;



//////// Render for handling render of resonators ////////

// As long as 'window.Render.prototype.createPortalEntity' delete and recreate portal
// on any change of data, this resonator render should make resonator create and remove
// with portal correctly.
//
// Resonators will create when
// 1.Portal added to map
// 2.Zooming in to enable zoom level
//
// Resonators will remove when
// 1.Portal removed from map
// 2.Zooming out beyond enable zoom level

window.plugin.drawResonators.Render = function(options) {
  this.enableZoomLevel = options['enableZoomLevel'];
  this.useStyler = options['useStyler'];

  this.stylers = {};
  this.resonators = {};
  this.resonatorLayerGroup = new L.LayerGroup();
  this.addStyler(new window.plugin.drawResonators.Styler());
  this.beforeZoomLevel = map.getZoom();

  this.portalAdded = this.portalAdded.bind(this);
  this.createResonatorEntities = this.createResonatorEntities.bind(this);
  this.deleteResonatorEntities = this.deleteResonatorEntities.bind(this);
  this.handleResonatorEntitiesBeforeZoom = this.handleResonatorEntitiesBeforeZoom.bind(this);
  this.handleResonatorEntitiesAfterZoom = this.handleResonatorEntitiesAfterZoom.bind(this);
  this.portalSelectionChange = this.portalSelectionChange.bind(this);
};

window.plugin.drawResonators.Render.prototype.registerHook = function() {
  window.addHook('portalAdded', this.portalAdded);
  window.addHook('portalSelected', this.portalSelectionChange);
  window.map.on('zoomstart', this.handleResonatorEntitiesBeforeZoom);
  window.map.on('zoomend', this.handleResonatorEntitiesAfterZoom);
}

window.plugin.drawResonators.Render.prototype.portalAdded = function(data) {
  var marker = data.portal;
  var render = this;

  marker.on('add', function() {
    render.createResonatorEntities(this); // the 'this' in here is the portal.
  });

  marker.on('remove', function() {
    render.deleteResonatorEntities(this.options.guid); // the 'this' in here is the portal.
  });
}

window.plugin.drawResonators.Render.prototype.createResonatorEntities = function(portal) {
  // No need to check for existing resonators, as old resonators should be removed with the portal marker.

  if(!this.isResonatorsShow()) return;
  var portalDetails = portal.options.details;
  var resonatorsWithConnector = new L.LayerGroup()

  var portalLatLng = [portalDetails.locationE6.latE6/1E6, portalDetails.locationE6.lngE6/1E6];
  var portalSelected = selectedPortal === portal.options.guid;

  for(var i in portalDetails.resonatorArray.resonators) {
    resoData = portalDetails.resonatorArray.resonators[i];
    if(resoData === null) continue;

    var resoLatLng = this.getResonatorLatLng(resoData.distanceToPortal, resoData.slot, portalLatLng);

    var resoMarker = this.createResoMarker(resoData, resoLatLng, portalSelected);
    var connMarker = this.createConnMarker(resoData, resoLatLng, portalLatLng, portalSelected);

    resonatorsWithConnector.addLayer(resoMarker);
    resonatorsWithConnector.addLayer(connMarker);
  }

  resonatorsWithConnector.options = {
    details: portalDetails.resonatorArray.resonators,
    guid: portal.options.guid
  };

  this.resonators[portal.options.guid] = resonatorsWithConnector;
  this.resonatorLayerGroup.addLayer(resonatorsWithConnector);
  
  // bring portal in front of resonator connector
  portal.bringToFront();
}

window.plugin.drawResonators.Render.prototype.createResoMarker = function(resoData, resoLatLng, portalSelected) {
  var resoProperty = this.getStyler().getResonatorStyle(resoData, portalSelected);
  resoProperty.type = 'resonator';
  resoProperty.details = resoData;
  var reso =  L.circleMarker(resoLatLng, resoProperty);
  return reso;
}

window.plugin.drawResonators.Render.prototype.createConnMarker = function(resoData, resoLatLng, portalLatLng, portalSelected) {
  var connProperty = this.getStyler().getConnectorStyle(resoData, portalSelected);
  connProperty.type = 'connector';
  connProperty.details = resoData;
  var conn = L.polyline([portalLatLng, resoLatLng], connProperty);
  return conn;
}

window.plugin.drawResonators.Render.prototype.getResonatorLatLng = function(dist, slot, portalLatLng) {
  // offset in meters
  var dn = dist*SLOT_TO_LAT[slot];
  var de = dist*SLOT_TO_LNG[slot];

  // Coordinate offset in radians
  var dLat = dn/EARTH_RADIUS;
  var dLon = de/(EARTH_RADIUS*Math.cos(Math.PI/180*portalLatLng[0]));

  // OffsetPosition, decimal degrees
  var lat0 = portalLatLng[0] + dLat * 180/Math.PI;
  var lon0 = portalLatLng[1] + dLon * 180/Math.PI;

  return [lat0, lon0];
}

window.plugin.drawResonators.Render.prototype.deleteResonatorEntities = function(portalGuid) {
  if (!(portalGuid in this.resonators)) return;

  var r = this.resonators[portalGuid];
  this.resonatorLayerGroup.removeLayer(r);
  delete this.resonators[portalGuid];
}

// Save zoom level before zoom, use to determine redraw of resonator
window.plugin.drawResonators.Render.prototype.handleResonatorEntitiesBeforeZoom = function() {
  this.beforeZoomLevel = map.getZoom();
}

window.plugin.drawResonators.Render.prototype.handleResonatorEntitiesAfterZoom = function() {
  if(!this.isResonatorsShow()) {
    this.resonatorLayerGroup.clearLayers();
    this.resonators = {};
  } else {
    // Redraw all resonators if they were deleted
    if(this.isResonatorsShowBeforeZoom()) return;

    var render = this;

    // loop through level of portals, only draw if the portal is shown on map
    for (var guid in window.portals) {
      var portal = window.portals[guid];
      // FIXME: need to find a proper way to check if a portal is added to the map without depending on leaflet internals
      // (and without depending on portalsLayers either - that's IITC internal)
      if (portal._map) {
        render.createResonatorEntities(portal);
      }
    }

  }
}

window.plugin.drawResonators.Render.prototype.portalSelectionChange = function(data) {
  this.toggleSelectedStyle(data.selectedPortalGuid);
  this.toggleSelectedStyle(data.unselectedPortalGuid);
}

window.plugin.drawResonators.Render.prototype.toggleSelectedStyle = function(portalGuid) {
  if (!(portalGuid in this.resonators)) return;

  var render = this;
  var portalSelected = selectedPortal === portalGuid;
  var r = this.resonators[portalGuid];

  r.eachLayer(function(entity) {
    var style;
    if(entity.options.type === 'resonator') {
      style = render.getStyler().getResonatorStyle(entity.options.details, portalSelected);
    } else {
      style = render.getStyler().getConnectorStyle(entity.options.details, portalSelected);
    }

    entity.setStyle(style);
  });
}

window.plugin.drawResonators.Render.prototype.addStyler = function(styler) {
  this.stylers[styler.name] = styler;
}

window.plugin.drawResonators.Render.prototype.getStylersList = function() {
  return Object.keys(this.stylers);
}

window.plugin.drawResonators.Render.prototype.getStyler = function() {
  var stylerName = this.useStyler in this.stylers ? this.useStyler : 'default';
  return this.stylers[stylerName];
}

window.plugin.drawResonators.Render.prototype.changeStyler = function(name) {
  // TODO: check whether styler has change, and update style of all resonators
}

window.plugin.drawResonators.Render.prototype.isResonatorsShow = function() {
  return map.getZoom() >= this.enableZoomLevel;
}

window.plugin.drawResonators.Render.prototype.isResonatorsShowBeforeZoom = function() {
  return this.beforeZoomLevel >= this.enableZoomLevel;
}



//////// Styler for getting resonator and connector style ////////



window.plugin.drawResonators.Styler = function(options) {
  options = options || {};
  this.name = options['name'] || 'default';
  this.getResonatorStyle = options['resonatorStyleFunc'] || this.defaultResonatorStyle;
  this.getConnectorStyle = options['connectorStyleFunc'] || this.defaultConnectorStyle;
}

window.plugin.drawResonators.Styler.prototype.DEFAULT_OPTIONS_RESONATOR_SELECTED = {
  color: '#fff',
  weight: 1.1,
  radius: 4,
  opacity: 1,
  clickable: false};

window.plugin.drawResonators.Styler.prototype.DEFAULT_OPTIONS_RESONATOR_NON_SELECTED = {
  color: '#aaa',
  weight: 1,
  radius: 3,
  opacity: 1,
  clickable: false};

window.plugin.drawResonators.Styler.prototype.DEFAULT_OPTIONS_RESONATOR_LINE_SELECTED = {
  opacity: 0.7,
  weight: 3,
  color: '#FFA000',
  dashArray: '0,10' + (new Array(25).join(',8,4')),
  fill: false,
  clickable: false};

window.plugin.drawResonators.Styler.prototype.DEFAULT_OPTIONS_RESONATOR_LINE_NON_SELECTED = {
  opacity: 0.25,
  weight: 2,
  color: '#FFA000',
  dashArray: '0,10' + (new Array(25).join(',8,4')),
  fill: false,
  clickable: false};

window.plugin.drawResonators.Styler.prototype.defaultResonatorStyle = function(resoDetail, selected) {
  var resoSharedStyle = selected 
                ? this.DEFAULT_OPTIONS_RESONATOR_SELECTED
                : this.DEFAULT_OPTIONS_RESONATOR_NON_SELECTED;

  var resoStyle = $.extend({
        fillColor: COLORS_LVL[resoDetail.level],
        fillOpacity: resoDetail.energyTotal/RESO_NRG[resoDetail.level],
      }, resoSharedStyle);

  return resoStyle;
}

window.plugin.drawResonators.Styler.prototype.defaultConnectorStyle = function(resoDetail, selected) {
  var connStyle  = selected 
                ? this.DEFAULT_OPTIONS_RESONATOR_LINE_SELECTED
                : this.DEFAULT_OPTIONS_RESONATOR_LINE_NON_SELECTED;

  return connStyle;
}



//////// Options for storing and loading options ////////

// TODO: add callback to notify option changes

window.plugin.drawResonators.Options = function() {
  this._options = {};
  this._callbacks = {};
}

window.plugin.drawResonators.Options.prototype.addCallback = function(name, callback) {
  if (!this._callbacks[name]) {
    this._callbacks[name] = [];
  }
  this._callbacks[name].push(callback);
}

window.plugin.drawResonators.Options.prototype.newOption = function(name, defaultValue) {
  this._options[name] = this.loadLocal(this.getStorageKey, defaultValue)
}

window.plugin.drawResonators.Options.prototype.getOption = function(name) {
  return this._options[name];
}

window.plugin.drawResonators.Options.prototype.changeOption = function(name, value) {
  if(!(name in this._options)) return false;
  if(value === this._options[name]) return false;

  this._options[name] = value;
  this.storeLocal(name, this._options[name]);

  if (!this._callbacks[name]) {
    for(var i in this._callbacks[name]) {
      this._callbacks[name][i](value);
    }
  }
}

window.plugin.drawResonators.Options.prototype.getStorageKey = function(name) {
  return 'plugin-drawResonators-option-' + name;
}

window.plugin.drawResonators.Options.prototype.loadLocal = function(key, defaultValue) {
  var objectJSON = localStorage[key];
  if(objectJSON) {
    return JSON.parse(objectJSON);
  } else {
    return defaultValue;
  }
}

window.plugin.drawResonators.Options.prototype.storeLocal = function(key, value) {
  if(typeof(value) !== 'undefined' && value !== null) {
    localStorage[key] = JSON.stringify(value);
  } else {
    localStorage.removeItem(key);
  }
}




var setup =  function() {
  window.plugin.drawResonators.options = new window.plugin.drawResonators.Options();
  window.plugin.drawResonators.options.newOption('enableZoomLevel', 17);
  window.plugin.drawResonators.options.newOption('useStyler', 'default');

  var renderOptions = {
    'enableZoomLevel': window.plugin.drawResonators.options.getOption('enableZoomLevel'),
    'useStyler': window.plugin.drawResonators.options.getOption('useStyler')};

  window.plugin.drawResonators.render = new window.plugin.drawResonators.Render(renderOptions);
  window.plugin.drawResonators.render.registerHook();
  window.addLayerGroup('Resonators', window.plugin.drawResonators.render.resonatorLayerGroup, true);

  // TODO: add options dialog to change options
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
