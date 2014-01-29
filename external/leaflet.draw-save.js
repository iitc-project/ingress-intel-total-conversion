/*
	Leaflet.draw-save, adds support for saving and loading drawn items to Leaflet.draw.
	(c) 2014 Marcus Winkler

	This extension can not be used standalone but requires - and is based on the code of - Leaflet.draw which is Copyright (c) 2012-2013, Jacob Toye, Smartrak (see https://github.com/Leaflet/Leaflet.draw, http://leafletjs.com, https://github.com/jacobtoye)
	Some parts of this script (the 'loading'-part with the invisible file input and reading the file using HTML 5 File API) where inspired by Leaflet.FileLayer which is Copyright (c) 2012 Makina Corpus (see https://github.com/makinacorpus/Leaflet.FileLayer/)
*/
L.drawLocal = L.Util.extend({}, L.drawLocal, {
	save: {
		toolbar: {
			actions: {
				save: {
					title: 'Save drawn items.',
					text: 'Save'
				},
				load: {
					title: 'Load drawn items.',
					text: 'Load'
				},
				clear: {
					title: 'Clear all drawn items.',
					text: 'Clear'
				},
				cancel: {
					title: 'Cancel.',
					text: 'Cancel'
				}
			},
			buttons: {
				save: 'Save / load drawn items'
			}
		}
	}
});

L.SaveToolbar = L.Toolbar.extend({
	options: {
		save: false,
		fileExt: 'ldi',
		fileName: 'my-drawings',
		polylineOptions: {
			stroke: true,
			color: '#f06eaa',
			weight: 4,
			opacity: 0.5,
			fill: false,
			clickable: true
		},
		polygonOptions: {
			stroke: true,
			color: '#f06eaa',
			weight: 4,
			opacity: 0.5,
			fill: true,
			fillColor: null, //same as color by default
			fillOpacity: 0.2,
			clickable: true
		},
		rectangleOptions: {
			stroke: true,
			color: '#f06eaa',
			weight: 4,
			opacity: 0.5,
			fill: true,
			fillColor: null, //same as color by default
			fillOpacity: 0.2,
			clickable: true
		},
		circleOptions: {
			stroke: true,
			color: '#f06eaa',
			weight: 4,
			opacity: 0.5,
			fill: true,
			fillColor: null, //same as color by default
			fillOpacity: 0.2,
			clickable: true
		},
		markerOptions: {
			icon: new L.Icon.Default(),
			repeatMode: false,
			zIndexOffset: 2000 // This should be > than the highest z-index any markers
		},
		featureGroup: null
	},

	initialize: function (options) {
		if (options.save) {
			options.save = L.extend({}, this.options.save, options.save);
		}
		if (options.polylineOptions) {
			options.polylineOptions = L.extend({}, this.options.polylineOptions, options.polylineOptions);
		}
		if (options.polygonOptions) {
			options.polygonOptions = L.extend({}, this.options.polygonOptions, options.polygonOptions);
		}
		if (options.rectangleOptions) {
			options.rectangleOptions = L.extend({}, this.options.rectangleOptions, options.rectangleOptions);
		}
		if (options.circleOptions) {
			options.circleOptions = L.extend({}, this.options.circleOptions, options.circleOptions);
		}
		if (options.markerOptions) {
			options.markerOptions = L.extend({}, this.options.markerOptions, options.markerOptions);
		}

		this._downloadLink = null;
		this._fileInput = null;

		L.Toolbar.prototype.initialize.call(this, options);
	},

	addToolbar: function (map) {
		var container = L.DomUtil.create('div', 'leaflet-draw-section'),
			buttonIndex = 0,
			buttonClassPrefix = 'leaflet-draw-save';

		// Create an invisible file input 
		var fileInput = L.DomUtil.create('input', 'hidden', container);
		fileInput.type = 'file';
		fileInput.accept = '.' + this.options.fileExt;
		fileInput.style.display = 'none';
		// Load on file change
		var that = this;
		fileInput.addEventListener('change', function (e) {
			that._loadFile(this.files[0]);
		}, false);
		this._fileInput = fileInput;

		this._toolbarContainer = L.DomUtil.create('div', 'leaflet-draw-toolbar leaflet-bar');

		this._map = map;

		if (this.options.save) {
			this._initModeHandler(
				new L.SaveToolbar.Save(map, {toolbar: this}),
				this._toolbarContainer,
				buttonIndex++,
				buttonClassPrefix,
				L.drawLocal.save.toolbar.buttons.save
			);
		}

		// Save button index of the last button, -1 as we would have ++ after the last button
		this._lastButtonIndex = --buttonIndex;

		// Create the actions part of the toolbar
		this._actionsContainer = this._createActions([
			{
				title: L.drawLocal.save.toolbar.actions.save.title,
				text: L.drawLocal.save.toolbar.actions.save.text,
				callback: this.disable,
				context: this
			},
			{
				title: L.drawLocal.save.toolbar.actions.load.title,
				text: L.drawLocal.save.toolbar.actions.load.text,
				callback: this.load,
				context: this
			},
			{
				title: L.drawLocal.save.toolbar.actions.clear.title,
				text: L.drawLocal.save.toolbar.actions.clear.text,
				callback: this.clear,
				context: this
			},
			{
				title: L.drawLocal.save.toolbar.actions.cancel.title,
				text: L.drawLocal.save.toolbar.actions.cancel.text,
				callback: this.disable,
				context: this
			}
		]);

		this._downloadLink = this._actionButtons[0].button;
		
		// reenable default actions on click to make downloading work
		L.DomEvent
			.off(this._downloadLink, 'click', L.DomEvent.stopPropagation)
			.off(this._downloadLink, 'mousedown', L.DomEvent.stopPropagation)
			.off(this._downloadLink, 'dblclick', L.DomEvent.stopPropagation)
			.off(this._downloadLink, 'click', L.DomEvent.preventDefault);


		// Add draw and cancel containers to the control container
		container.appendChild(this._toolbarContainer);
		container.appendChild(this._actionsContainer);

		return container;
	},

	disable: function () {
		if (!this.enabled()) { return; }

		L.Toolbar.prototype.disable.call(this);
	},
	
	clear: function() {
		var deletedLayers = new L.LayerGroup(this.options.featureGroup.getLayers());
		this.options.featureGroup.clearLayers();

		this._map.fire('draw:deleted', {layers: deletedLayers});

		this._activeMode.handler.disable();
	},

	_createDownloadLink: function () {
		var dataStr = this._serializeDrawnItems(this.options.featureGroup);
		if (dataStr === undefined) {
			// TODO better error handling
			dataStr = "";
		}

		var bb = new Blob([dataStr], {type: 'text/plain'});

		this._downloadLink.download = this.options.fileName + '.' + this.options.fileExt;
		this._downloadLink.href = (window.webkitURL ? window.webkitURL : window.URL).createObjectURL(bb);

		this._downloadLink.dataset.downloadurl = ['text/plain', this._downloadLink.download, this._downloadLink.href].join(':');
	},
	
	_serializeDrawnItems: function(featureGroup) {
		var data = [];

		featureGroup.eachLayer( function(layer) {
			var item = {};
			if (layer instanceof L.GeodesicCircle || layer instanceof L.Circle) {
				item.type = 'circle';
				item.latLng = layer.getLatLng();
				item.radius = layer.getRadius();
			} else if (layer instanceof L.GeodesicPolygon || layer instanceof L.Polygon) {
				item.type = 'polygon';
				item.latLngs = layer.getLatLngs();
			} else if (layer instanceof L.GeodesicPolyline || layer instanceof L.Polyline) {
				item.type = 'polyline';
				item.latLngs = layer.getLatLngs();
			} else if (layer instanceof L.Marker) {
				item.type = 'marker';
				item.latLng = layer.getLatLng();
			} else {
				console.warn('Unknown layer type when saving draw tools layer');
				return; //.eachLayer 'continue'
			}

			data.push(item);
		});

		return JSON.stringify(data);
	},

	load: function () {
		this._fileInput.click();
		this._activeMode.handler.disable();
	},

	_loadFile: function (file /* File */) {
		if (!this._checkExtension(file.name)) {
			return;
		}

		// Read selected file using HTML5 File API
		var reader = new FileReader();
		var that = this;
		reader.onload = L.Util.bind(function (e) {
			that._addItems(e.target.result);
		}, this);
		reader.readAsText(file);
	},

	_checkExtension: function (filename) {
		var ext = filename.split('.').pop();
		if (ext.toLowerCase() != this.options.fileExt) {
			window.alert('Unsupported file type (' + ext + ')');
			return false;
		}
		return true;
	},

	_addItems: function (items /* JSON string */) {
		items = JSON.parse(items);

		var featureGroup = this.options.featureGroup;
		var loadedLayers = new L.LayerGroup();
		var polylineOptions = this.options.polylineOptions;
		var polygonOptions = this.options.polygonOptions;
		var circleOptions = this.options.circleOptions;
		var markerOptions = this.options.markerOptions;
		$.each(items, function(index,item) {
			var layer = null;
			switch(item.type) {
				case 'polyline':
					layer = L.geodesicPolyline(item.latLngs,polylineOptions);
					break;
				case 'polygon':
					layer = L.geodesicPolygon(item.latLngs,polygonOptions);
					break;
				case 'circle':
					layer = L.geodesicCircle(item.latLng,item.radius,circleOptions);
					break;
				case 'marker':
					layer = L.marker(item.latLng,markerOptions)
					break;
				default:
					console.warn('unknown layer type "'+item.type+'" when loading draw tools layer');
					break;
			}
			if (layer) {
				featureGroup.addLayer(layer);
				loadedLayers.addLayer(layer);
			}
		});
		this._map.fire('draw:loaded', {layers: loadedLayers});
	}
});

L.SaveToolbar.Save = L.Handler.extend({
	statics: {
		TYPE: 'save'
	},

	includes: L.Mixin.Events,

	initialize: function (map, options) {
		L.Handler.prototype.initialize.call(this, map);

		L.Util.setOptions(this, options);

		this._toolbar = options.toolbar;

		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.SaveToolbar.Save.TYPE;
	},

	enable: function () {
		if (this._enabled) { return; }

		L.Handler.prototype.enable.call(this);

		this.fire('enabled', { handler: this.type});
	},

	disable: function () {
		if (!this._enabled) { return; }

		L.Handler.prototype.disable.call(this);

		this.fire('disabled', { handler: this.type});
	},

	addHooks: function () {
		this._toolbar._createDownloadLink();
	},

	removeHooks: function () {
	},
});

// We backup the original initialize method as initialize__ ...
L.Control.Draw.prototype.initialize__ = L.Control.Draw.prototype.initialize;

// ... and than replace the initialize method with our code ...
L.Control.Draw.prototype.initialize = function (options) {
	// ... which first calles the original code ...
	this.initialize__(options);

	// ... and than adds the toolbar for saving / loading drawn items
	if (L.SaveToolbar && this.options.save) {
		var id, toolbar;
		toolbar = new L.SaveToolbar(this.options.save);
		id = L.stamp(toolbar);
		this._toolbars[id] = toolbar;

		// Listen for when toolbar is enabled
		this._toolbars[id].on('enable', this._toolbarEnabled, this);
	}
}
