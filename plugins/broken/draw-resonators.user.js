// ==UserScript==
// @id             iitc-plugin-draw-resonators@xelio
// @name           IITC plugin: Draw resonators
// @category       Layer
// @version        0.4.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Draw resonators on map. With stylers to highlight resonators with specific criteria.
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
  this.useStyler = '';

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
  this.handleEnableZoomLevelChange = this.handleEnableZoomLevelChange.bind(this);
  this.portalSelectionChange = this.portalSelectionChange.bind(this);
  this.changeStyler = this.changeStyler.bind(this);
  this.getStylersList = this.getStylersList.bind(this);
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
    this.clearAllResonators();
    return;
  }

  // Draw all resonators if they were not drawn
  if(!this.isResonatorsShowBeforeZoom()) {
    this.drawAllResonators();
  }
}

window.plugin.drawResonators.Render.prototype.handleEnableZoomLevelChange = function(zoomLevel) {
  this.enableZoomLevel = zoomLevel;

  if(!this.isResonatorsShow()) {
    this.clearAllResonators();
    return;
  }

  // Draw all resonators if they were not drawn
  if(!Object.keys(this.resonators).length > 0) {
    this.drawAllResonators();
  }
}

window.plugin.drawResonators.Render.prototype.clearAllResonators = function() {
  this.resonatorLayerGroup.clearLayers();
  this.resonators = {};
}

window.plugin.drawResonators.Render.prototype.drawAllResonators = function() {
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
  var stylerName = this.useStyler in this.stylers ? this.useStyler : 'Default';
  return this.stylers[stylerName];
}

// Change if styler need change, and redraw all resonators using new styler
window.plugin.drawResonators.Render.prototype.changeStyler = function(name) {
  if (name === this.useStyler) return;
  for(stylerName in this.stylers) {
    if(stylerName === name) {
      if(this.stylers[this.useStyler]) this.stylers[this.useStyler].onDisableFunc();
      this.useStyler = stylerName;
      this.stylers[this.useStyler].onEnableFunc();
      this.clearAllResonators();
      this.drawAllResonators();
      return;
    }
  }
}

window.plugin.drawResonators.Render.prototype.refreshStyler = function() {
  this.clearAllResonators();
  this.drawAllResonators();
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
  this.name = options['name'] || 'Default';
  this.otherOptions = options['otherOptions'];
  this.getResonatorStyle = options['resonatorStyleFunc'] || this.defaultResonatorStyle;
  this.getConnectorStyle = options['connectorStyleFunc'] || this.defaultConnectorStyle;
  this.onEnableFunc = options['onEnableFunc'] || function() {};
  this.onDisableFunc = options['onDisableFunc'] || function() {};
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
  this._options[name] = this.loadLocal(this.getStorageKey(name), defaultValue)
}

window.plugin.drawResonators.Options.prototype.getOption = function(name) {
  return this._options[name];
}

window.plugin.drawResonators.Options.prototype.removeOption = function(name) {
  delete this._options[name];
  delete this._callbacks[name];
}

window.plugin.drawResonators.Options.prototype.changeOption = function(name, value) {
  if(!(name in this._options)) return false;
  if(value === this._options[name]) return false;

  this._options[name] = value;
  this.storeLocal(this.getStorageKey(name), this._options[name]);

  if (this._callbacks[name] !== null) {
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



//////// Dialog

window.plugin.drawResonators.Dialog = function() {
  this._dialogEntries = {};
}

window.plugin.drawResonators.Dialog.prototype.addLink = function() {
  $('#toolbox').append('<a id="draw-reso-show-dialog" onclick="window.plugin.drawResonators.dialog.show();">Resonators</a> ');
}

window.plugin.drawResonators.Dialog.prototype.addEntry = function(name, dialogEntry) {
  this._dialogEntries[name] = dialogEntry;
  this.change();
}

window.plugin.drawResonators.Dialog.prototype.removeEntry = function(name) {
  delete this._dialogEntries[name];
  this.change();
}

window.plugin.drawResonators.Dialog.prototype.show = function() {
  window.dialog({html: this.getDialogHTML(), title: 'Resonators', modal: true, id: 'draw-reso-setting'});

  // Attach entries event
  for(var name in this._dialogEntries) {
    var events = this._dialogEntries[name].getOnEvents();
    for(var i in events) {
      var event = events[i];
      $('#draw-reso-dialog').on(event.event, '#' + event.id, event.callback);
    }
  }
}

window.plugin.drawResonators.Dialog.prototype.change = function() {
  if($('#draw-reso-dialog').length > 0) this.show();
}

window.plugin.drawResonators.Dialog.prototype.getDialogHTML = function() {
  var html = '<div id="draw-reso-dialog">'
  for(var name in this._dialogEntries) {
    html += '<div>'
          + this._dialogEntries[name].getHTML()
          + '</div>';
  }
  html += '</div>';
  return html;
}



//////// ListDialogEntry



window.plugin.drawResonators.ListDialogEntry = function(options) {
  this._name = options['name'];
  this._label = options['label'];
  this._valueFunc = options['valueFunc'];
  this._valuesList = options['valuesList'];
  this._valuesListFunc = options['valuesListFunc'];
  this._onChangeCallback = options['onChangeCallback'];
}

window.plugin.drawResonators.ListDialogEntry.prototype.getHTML = function() {
  var curValue = this._valueFunc();
  var valuesList = this._valuesList ? this._valuesList : this._valuesListFunc();
  var html = '<label for="' + this.getSelectId() + '">'
           + this._label + ': '
           + '</label>'
           + '<select id="' + this.getSelectId() + '">';

  var noLabel = valuesList instanceof Array;
  for(var label in valuesList) {
    var selected = valuesList[label] === curValue;
    html += '<option value="' + valuesList[label] + '" '
          + (selected ? 'selected="selected"' : '')
          +'>'
          + (noLabel ? valuesList[label] : label)
          + '</option>';
  }

  html += '</select>';
  return html;
}

window.plugin.drawResonators.ListDialogEntry.prototype.getOnEvents = function() {
  return [{'event': 'change',
           'id': this.getSelectId(),
           'callback': this._onChangeCallback
  }];
}

window.plugin.drawResonators.ListDialogEntry.prototype.getSelectId = function() {
  return 'draw-reso-option-' + this._name;
}



//////// TextboxDialogEntry


window.plugin.drawResonators.TextboxDialogEntry = function(options) {
  this._name = options['name'];
  this._label = options['label'];
  this._valueFunc = options['valueFunc'];
  this._onChangeCallback = options['onChangeCallback'];
}

window.plugin.drawResonators.TextboxDialogEntry.prototype.getHTML = function() {
  var curValue = this._valueFunc();
  var html = '<label for="' + this.getInputId() + '">'
           + this._label + ': '
           + '</label>'
           + '<input type="text" size="20" id="' + this.getInputId() + '" '
           + 'value="' + curValue + '" />';
  return html;
}


window.plugin.drawResonators.TextboxDialogEntry.prototype.getOnEvents = function() {
  return [{'event': 'change',
           'id': this.getInputId(),
           'callback': this._onChangeCallback
  }];
}

window.plugin.drawResonators.TextboxDialogEntry.prototype.getInputId = function() {
  return 'draw-reso-option-' + this._name;
}



window.plugin.drawResonators.setupStyler = function() {
  var thisPlugin = window.plugin.drawResonators;

  var highlightedReso = {color: '#fff', weight: 2, radius: 4, opacity: 1, clickable: false};
  var normalReso = {color: '#aaa', weight: 1, radius: 3, opacity: 1, clickable: false};
  var selectedReso = {color: '#eee', weight: 1.1, radius: 4, opacity: 1, clickable: false};
  var highlightedConn = {opacity: 0.7, weight: 3, color: '#FFA000', dashArray: '0,10,999', color: '#FFA000', fill: false, clickable: false};
  var normalConn = {opacity: 0.25, weight: 2, color: '#FFA000', dashArray: '0,10' + (new Array(25).join(',8,4')), fill: false, clickable: false};
  var selectedConn = {opacity: 0.7, weight: 3, color: '#FFA000', dashArray: '0,10' + (new Array(25).join(',8,4')), fill: false, clickable: false};

  // Styler for highlighting resonators deployed by me
  var myReso = {
    name: 'Highlight my resonators',
    otherOptions: {
      'highlightedReso' : highlightedReso,
      'normalReso' : normalReso,
      'selectedReso' : selectedReso,
      'highlightedConn' : highlightedConn,
      'normalConn' : normalConn,
      'selectedConn' : selectedConn
    },
    resonatorStyleFunc: function(resoDetail, selected) {
      var mine = resoDetail.ownerGuid === PLAYER.guid;
      var resoSharedStyle = mine
                        ? this.otherOptions.highlightedReso
                        : (selected ? this.otherOptions.selectedReso : this.otherOptions.normalReso);

      var resoStyle = $.extend({
            fillColor: COLORS_LVL[resoDetail.level],
            fillOpacity: resoDetail.energyTotal/RESO_NRG[resoDetail.level] * (mine ? 1 : 0.75)
          }, resoSharedStyle);
      return resoStyle;
    },
    connectorStyleFunc: function(resoDetail, selected) {
      var mine = resoDetail.ownerGuid === PLAYER.guid;
      var connStyle  = mine
                     ? this.otherOptions.highlightedConn
                     : (selected ? this.otherOptions.selectedConn : this.otherOptions.normalConn);
      return connStyle;
    }
  };

  thisPlugin.render.addStyler(new thisPlugin.Styler(myReso));

  // Styler for highlighting L8 resonators
  var l8Reso = {
    name: 'Highlight L8 resonators',
    otherOptions: {
      'highlightedReso' : highlightedReso,
      'normalReso' : normalReso,
      'selectedReso' : selectedReso,
      'highlightedConn' : highlightedConn,
      'normalConn' : normalConn,
      'selectedConn' : selectedConn
    },
    resonatorStyleFunc: function(resoDetail, selected) {
      var l8 = resoDetail.level === 8;
      var resoSharedStyle = l8
                        ? this.otherOptions.highlightedReso
                        : (selected ? this.otherOptions.selectedReso : this.otherOptions.normalReso);

      var resoStyle = $.extend({
            fillColor: COLORS_LVL[resoDetail.level],
            fillOpacity: resoDetail.energyTotal/RESO_NRG[resoDetail.level] * (l8 ? 1 : 0.75)
          }, resoSharedStyle);
      return resoStyle;
    },
    connectorStyleFunc: function(resoDetail, selected) {
      var l8 = resoDetail.level === 8;
      var connStyle  = l8
                     ? this.otherOptions.highlightedConn
                     : (selected ? this.otherOptions.selectedConn : this.otherOptions.normalConn);
      return connStyle;
    }
  };

  thisPlugin.render.addStyler(new thisPlugin.Styler(l8Reso));

  // Styler for highlighting resonators with less than X% energy
  var lessThanXPctReso = {
    name: 'Highlight < X% resonators',
    otherOptions: {
      'highlightedReso': highlightedReso,
      'normalReso': normalReso,
      'selectedReso': selectedReso,
      'highlightedConn': highlightedConn,
      'normalConn': normalConn,
      'selectedConn': selectedConn,
      'pct': 15,
      'dialogEntry': new thisPlugin.TextboxDialogEntry({
                      name: 'resoLessThanPct-pct',
                      label: 'Percentage',
                      valueFunc: function() {return thisPlugin.options.getOption('styler-resoLessThanPct-pct')},
                      onChangeCallback: function(event) {thisPlugin.options.changeOption('styler-resoLessThanPct-pct', parseInt(event.target.value));}
                    })
    },
    resonatorStyleFunc: function(resoDetail, selected) {
      var highlight = (resoDetail.energyTotal * 100) < (RESO_NRG[resoDetail.level] * this.otherOptions.pct);
      var resoSharedStyle = highlight
                        ? this.otherOptions.highlightedReso
                        : (selected ? this.otherOptions.selectedReso : this.otherOptions.normalReso);

      var resoStyle = $.extend({
            fillColor: COLORS_LVL[resoDetail.level],
            fillOpacity: resoDetail.energyTotal/RESO_NRG[resoDetail.level]
          }, resoSharedStyle);
      return resoStyle;
    },
    connectorStyleFunc: function(resoDetail, selected) {
      var highlight = (resoDetail.energyTotal * 100) < (RESO_NRG[resoDetail.level] * this.otherOptions.pct);
      var connStyle  = highlight
                     ? this.otherOptions.highlightedConn
                     : (selected ? this.otherOptions.selectedConn : this.otherOptions.normalConn);
      return connStyle;
    },
    onEnableFunc: function() {
      var thisPlugin = window.plugin.drawResonators;
      var thisStyler = this;
      // Add option
      thisPlugin.options.newOption('styler-resoLessThanPct-pct', 15);
      thisPlugin.options.addCallback('styler-resoLessThanPct-pct', function(value) {
        thisStyler.otherOptions.pct = value;
        thisPlugin.render.refreshStyler();
      });
      thisStyler.otherOptions.pct = thisPlugin.options.getOption('styler-resoLessThanPct-pct');
      // Add dialog entry
      thisPlugin.dialog.addEntry('resoLessThanPct-pct', this.otherOptions.dialogEntry);
    },
    onDisableFunc: function() {
      var thisPlugin = window.plugin.drawResonators;
      // Remove option
      thisPlugin.options.removeOption('styler-resoLessThanPct-pct');
      // Remove dialog entry
      thisPlugin.dialog.removeEntry('resoLessThanPct-pct');
    }
  };

  thisPlugin.render.addStyler(new thisPlugin.Styler(lessThanXPctReso));

  // Styler for highlighting resonators deployed by specific player
  var resoOfSpecificPlayer = {
    name: 'Highlight resonators by player',
    otherOptions: {
      'highlightedReso': highlightedReso,
      'normalReso': normalReso,
      'selectedReso': selectedReso,
      'highlightedConn': highlightedConn,
      'normalConn': normalConn,
      'selectedConn': selectedConn,
      'player': '',
      'playerGuid': '',
      'dialogEntry': new thisPlugin.TextboxDialogEntry({
                      name: 'resoOfSpecificPlayer-player',
                      label: 'Player name',
                      valueFunc: function() {return thisPlugin.options.getOption('styler-resoOfSpecificPlayer-player')},
                      onChangeCallback: function(event) {thisPlugin.options.changeOption('styler-resoOfSpecificPlayer-player', event.target.value);}
                    })
    },
    resonatorStyleFunc: function(resoDetail, selected) {
      var highlight = resoDetail.ownerGuid === this.otherOptions.playerGuid;
      var resoSharedStyle = highlight
                        ? this.otherOptions.highlightedReso
                        : (selected ? this.otherOptions.selectedReso : this.otherOptions.normalReso);

      var resoStyle = $.extend({
            fillColor: COLORS_LVL[resoDetail.level],
            fillOpacity: resoDetail.energyTotal/RESO_NRG[resoDetail.level] * (highlight ? 1 : 0.75)
          }, resoSharedStyle);
      return resoStyle;
    },
    connectorStyleFunc: function(resoDetail, selected) {
      var highlight = resoDetail.ownerGuid === this.otherOptions.playerGuid;
      var connStyle  = highlight
                     ? this.otherOptions.highlightedConn
                     : (selected ? this.otherOptions.selectedConn : this.otherOptions.normalConn);
      return connStyle;
    },
    onEnableFunc: function() {
      var thisPlugin = window.plugin.drawResonators;
      var thisStyler = this;
      // Add option
      thisPlugin.options.newOption('styler-resoOfSpecificPlayer-player', '');
      thisPlugin.options.addCallback('styler-resoOfSpecificPlayer-player', function(value) {
        thisStyler.otherOptions.player = value;
        thisStyler.otherOptions.playerGuid = window.playerNameToGuid(value);
        thisPlugin.render.refreshStyler();
      });
      thisStyler.otherOptions.player = thisPlugin.options.getOption('styler-resoOfSpecificPlayer-player');
      thisStyler.otherOptions.playerGuid = window.playerNameToGuid(thisStyler.otherOptions.player);
      // Add dialog entry
      thisPlugin.dialog.addEntry('resoOfSpecificPlayer-player', this.otherOptions.dialogEntry);
    },
    onDisableFunc: function() {
      var thisPlugin = window.plugin.drawResonators;
      // Remove option
      thisPlugin.options.removeOption('styler-resoOfSpecificPlayer-player');
      // Remove dialog entry
      thisPlugin.dialog.removeEntry('resoOfSpecificPlayer-player');
    }
  };

  thisPlugin.render.addStyler(new thisPlugin.Styler(resoOfSpecificPlayer));

  thisPlugin.render.changeStyler(thisPlugin.options.getOption('useStyler'));
}


window.plugin.drawResonators.setupOptions = function() {
  var thisPlugin = window.plugin.drawResonators;
  // Initialize options
  thisPlugin.options = new thisPlugin.Options();
  thisPlugin.options.newOption('enableZoomLevel', 17);
  thisPlugin.options.newOption('useStyler', 'Default');
}

window.plugin.drawResonators.setupDialog = function() {
  var thisPlugin = window.plugin.drawResonators;
  // Initialize dialog
  thisPlugin.dialog = new thisPlugin.Dialog();

  var enableZoomLevelDialogEntryOptions = {
    name: 'enable-zoom-level',
    label: 'Enable zoom level',
    valueFunc: function() {return thisPlugin.options.getOption('enableZoomLevel')},
    valuesList: {'15':15, '16':16, '17':17, '18':18, '19':19, '20':20, 'None':99},
    onChangeCallback: function(event) {thisPlugin.options.changeOption('enableZoomLevel', parseInt(event.target.value));}
  };
  var enableZoomLevelDialogEntry = new thisPlugin.ListDialogEntry(enableZoomLevelDialogEntryOptions);
  thisPlugin.dialog.addEntry('enable-zoom-level', enableZoomLevelDialogEntry);

  var stylerDialogEntryOptions = {
    name: 'use-styler',
    label: 'Styler',
    valueFunc: function() {return thisPlugin.options.getOption('useStyler')},
    valuesListFunc: thisPlugin.render.getStylersList,
    onChangeCallback: function(event) {thisPlugin.options.changeOption('useStyler', event.target.value);}
  };
  var stylerDialogEntry = new thisPlugin.ListDialogEntry(stylerDialogEntryOptions);
  thisPlugin.dialog.addEntry('use-styler', stylerDialogEntry);

  thisPlugin.dialog.addLink();
}

var setup =  function() {
  var thisPlugin = window.plugin.drawResonators;

  // Initialize options
  thisPlugin.setupOptions();

  // Initialize render
  var renderOptions = {'enableZoomLevel': thisPlugin.options.getOption('enableZoomLevel')};

  thisPlugin.render = new thisPlugin.Render(renderOptions);

  // callback run at option change
  thisPlugin.options.addCallback('enableZoomLevel', thisPlugin.render.handleEnableZoomLevelChange);
  thisPlugin.options.addCallback('useStyler', thisPlugin.render.changeStyler);

  // Initialize Dialog
  thisPlugin.setupDialog();
  // Initialize styler
  thisPlugin.setupStyler();

  thisPlugin.render.registerHook();
  window.addLayerGroup('Resonators', thisPlugin.render.resonatorLayerGroup, true);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
