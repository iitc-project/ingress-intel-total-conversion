// ==UserScript==
// @id             iitc-plugin-basemap-yandex@jonatkins
// @name           IITC plugin: Yandex maps
// @category       Map Tiles
// @version        0.2.0.20181101.60209
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      none
// @downloadURL    none
// @description    [mobile-2018-11-01-060209] Add Yandex.com (Russian/Русский) map layers
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


function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

//PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
//(leaving them in place might break the 'About IITC' page or break update checks)
plugin_info.buildName = 'mobile';
plugin_info.dateTimeVersion = '20181101.60209';
plugin_info.pluginId = 'basemap-yandex';
//END PLUGIN AUTHORS NOTE



// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.mapTileYandex = function() {};

window.plugin.mapTileYandex.leafletSetup = function() {

//include Yandex.js start
/*
 * L.TileLayer is used for standard xyz-numbered tile layers.
 */
//(function (ymaps, L) {

L.Yandex = L.Class.extend({
	includes: L.Mixin.Events,

	options: {
		minZoom: 0,
		maxZoom: 18,
		attribution: '',
		opacity: 1,
		traffic: false
	},

	// Possible types: map, satellite, hybrid, publicMap, publicMapHybrid
	initialize: function(type, options) {
		L.Util.setOptions(this, options);

		this._type = "yandex#" + (type || 'map');
	},

	onAdd: function(map, insertAtTheBottom) {
		this._map = map;
		this._insertAtTheBottom = insertAtTheBottom;

		// create a container div for tiles
		this._initContainer();
		this._initMapObject();

		// set up events
		map.on('viewreset', this._resetCallback, this);

		this._limitedUpdate = L.Util.limitExecByInterval(this._update, 150, this);
		map.on('move', this._update, this);

		map._controlCorners['bottomright'].style.marginBottom = "3em";

		this._reset();
		this._update(true);
	},

	onRemove: function(map) {
		this._map._container.removeChild(this._container);

		this._map.off('viewreset', this._resetCallback, this);

		this._map.off('move', this._update, this);

		map._controlCorners['bottomright'].style.marginBottom = "0em";
	},

	getAttribution: function() {
		return this.options.attribution;
	},

	setOpacity: function(opacity) {
		this.options.opacity = opacity;
		if (opacity < 1) {
			L.DomUtil.setOpacity(this._container, opacity);
		}
	},

	setElementSize: function(e, size) {
		e.style.width = size.x + "px";
		e.style.height = size.y + "px";
	},

	_initContainer: function() {
		var tilePane = this._map._container,
			first = tilePane.firstChild;

		if (!this._container) {
			this._container = L.DomUtil.create('div', 'leaflet-yandex-layer leaflet-top leaflet-left');
			this._container.id = "_YMapContainer_" + L.Util.stamp(this);
			this._container.style.zIndex = "auto";
		}

		if (this.options.overlay) {
			first = this._map._container.getElementsByClassName('leaflet-map-pane')[0];
			first = first.nextSibling;
			// XXX: Bug with layer order
			if (L.Browser.opera)
				this._container.className += " leaflet-objects-pane";
		}
		tilePane.insertBefore(this._container, first);

		this.setOpacity(this.options.opacity);
		this.setElementSize(this._container, this._map.getSize());
	},

	_initMapObject: function() {
		if (this._yandex) return;

		// Check that ymaps.Map is ready
		if (ymaps.Map === undefined) {
			if (console) {
				console.debug("L.Yandex: Waiting on ymaps.load('package.map')");
			}
			return ymaps.load(["package.map"], this._initMapObject, this);
		}

		// If traffic layer is requested check if control.TrafficControl is ready
		if (this.options.traffic)
			if (ymaps.control === undefined ||
					ymaps.control.TrafficControl === undefined) {
				if (console) {
					console.debug("L.Yandex: loading traffic and controls");
				}
				return ymaps.load(["package.traffic", "package.controls"],
					this._initMapObject, this);
			}

		var map = new ymaps.Map(this._container, {center: [0,0], zoom: 0, behaviors: []});

		if (this.options.traffic)
			map.controls.add(new ymaps.control.TrafficControl({shown: true}));

		if (this._type == "yandex#null") {
			this._type = new ymaps.MapType("null", []);
			map.container.getElement().style.background = "transparent";
		}
		map.setType(this._type);

		this._yandex = map;
		this._update(true);
	},

	_resetCallback: function(e) {
		this._reset(e.hard);
	},

	_reset: function(clearOldContainer) {
		this._initContainer();
	},

	_update: function(force) {
		if (!this._yandex) return;
		this._resize(force);

		var center = this._map.getCenter();
		var _center = [center.lat, center.lng];
		var zoom = this._map.getZoom();

		if (force || this._yandex.getZoom() != zoom)
			this._yandex.setZoom(zoom);
		this._yandex.panTo(_center, {duration: 0, delay: 0});
	},

	_resize: function(force) {
		var size = this._map.getSize(), style = this._container.style;
		if (style.width == size.x + "px" &&
				style.height == size.y + "px")
			if (force != true) return;
		this.setElementSize(this._container, size);
		var b = this._map.getBounds(), sw = b.getSouthWest(), ne = b.getNorthEast();
		this._yandex.container.fitToViewport();
	}
});
//})(ymaps, L)

//include Yandex.js end

}



window.plugin.mapTileYandex.setup = function() {

  var yStyles = {
    'map': "Map",
    'satellite': "Satellite",
    'hybrid': "Hybrid",
//    'publicMap': "Public Map",
//    'publicMapHybrid': "Public Hybrid",
  };


  // we can't directly create the L.Yandex object, as we need to async load the yandex map API
  // so we'll add empty layer groups, then in the callback we can add the yandex layers to the layer groups
  var layers = {};

  $.each(yStyles, function(key,value) {
    layers[key] = new L.LayerGroup();
    layerChooser.addBaseLayer(layers[key], 'Yandex '+value);
  });

  var callback = function() {
    window.plugin.mapTileYandex.leafletSetup();
    var yOpt = {maxZoom: 18};
    $.each(layers, function(key,layer) {
      var yMap = new L.Yandex(key, yOpt);
      layer.addLayer(yMap);
    });
  }


//a few options on language are available, including en-US. Oddly, the detail available on the maps varies
//depending on the language
  var yandexApiJs = '//api-maps.yandex.ru/2.0-stable/?load=package.standard&lang=ru-RU'

  load(yandexApiJs).thenRun(callback);
}


var setup =  window.plugin.mapTileYandex.setup;

// PLUGIN END //////////////////////////////////////////////////////////


setup.info = plugin_info; //add the script info data to the function as a property
if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);


