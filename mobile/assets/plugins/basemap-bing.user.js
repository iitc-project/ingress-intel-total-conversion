// ==UserScript==
// @id             iitc-plugin-bing-maps
// @name           IITC plugin: Bing maps
// @category       Map Tiles
// @version        0.1.3.20181101.60209
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      none
// @downloadURL    none
// @description    [mobile-2018-11-01-060209] Add the maps.bing.com map layers.
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
plugin_info.pluginId = 'basemap-bing';
//END PLUGIN AUTHORS NOTE



// PLUGIN START ////////////////////////////////////////////////////////

window.plugin.mapBing = function() {};

window.plugin.mapBing.setupBingLeaflet = function() {
L.BingLayer = L.TileLayer.extend({
	options: {
		subdomains: [0, 1, 2, 3],
		type: 'Aerial',
		attribution: 'Bing',
		culture: ''
	},

	initialize: function(key, options) {
		L.Util.setOptions(this, options);

		this._key = key;
		this._url = null;
		this.meta = {};
		this.loadMetadata();
	},

	tile2quad: function(x, y, z) {
		var quad = '';
		for (var i = z; i > 0; i--) {
			var digit = 0;
			var mask = 1 << (i - 1);
			if ((x & mask) != 0) digit += 1;
			if ((y & mask) != 0) digit += 2;
			quad = quad + digit;
		}
		return quad;
	},

	getTileUrl: function(p, z) {
		var z = this._getZoomForUrl();
		var subdomains = this.options.subdomains,
			s = this.options.subdomains[Math.abs((p.x + p.y) % subdomains.length)];
		return this._url.replace('{subdomain}', s)
				.replace('{quadkey}', this.tile2quad(p.x, p.y, z))
				.replace('http:', document.location.protocol)
				.replace('{culture}', this.options.culture);
	},

	loadMetadata: function() {
		//MODIFIED: use browser sessionStorage, if available, to cache the metadata
		var _this = this;
		var cbid = '_bing_metadata_' + L.Util.stamp(this);
		var cachedMetadataKey = '_Leaflet_Bing_metadata_'+this.options.type;

		try {
			if (sessionStorage[cachedMetadataKey]) {
				this.meta = JSON.parse(sessionStorage[cachedMetadataKey]);
				this.initMetadata();
				return;
			}
		} catch(e) {}

		window[cbid] = function (meta) {
			_this.meta = meta;
			window[cbid] = undefined;
			var e = document.getElementById(cbid);
			e.parentNode.removeChild(e);
			if (meta.errorDetails) {
				if (window.console) console.log("Leaflet Bing Plugin Error - Got metadata: " + meta.errorDetails);
				return;
			}
			try {
				sessionStorage[cachedMetadataKey] = JSON.stringify(meta);
			} catch(e) {}
			_this.initMetadata();
		};
		var url = document.location.protocol + "//dev.virtualearth.net/REST/v1/Imagery/Metadata/" + this.options.type + "?include=ImageryProviders&jsonp=" + cbid + "&key=" + this._key;
		var script = document.createElement("script");
		script.type = "text/javascript";
		script.src = url;
		script.id = cbid;
		document.getElementsByTagName("head")[0].appendChild(script);
	},

	initMetadata: function() {
		var r = this.meta.resourceSets[0].resources[0];
		this.options.subdomains = r.imageUrlSubdomains;
		this._url = r.imageUrl;
		this._providers = [];
		if (r.imageryProviders) {
			for (var i = 0; i < r.imageryProviders.length; i++) {
				var p = r.imageryProviders[i];
				for (var j = 0; j < p.coverageAreas.length; j++) {
					var c = p.coverageAreas[j];
					var coverage = {zoomMin: c.zoomMin, zoomMax: c.zoomMax, active: false};
					var bounds = new L.LatLngBounds(
							new L.LatLng(c.bbox[0]+0.01, c.bbox[1]+0.01),
							new L.LatLng(c.bbox[2]-0.01, c.bbox[3]-0.01)
					);
					coverage.bounds = bounds;
					coverage.attrib = p.attribution;
					this._providers.push(coverage);
				}
			}
		}
		this._update();
	},

	_update: function() {
		if (this._url == null || !this._map) return;
		this._update_attribution();
		L.TileLayer.prototype._update.apply(this, []);
	},

	_update_attribution: function() {
		var bounds = this._map.getBounds();
		var zoom = this._map.getZoom();
		for (var i = 0; i < this._providers.length; i++) {
			var p = this._providers[i];
			if ((zoom <= p.zoomMax && zoom >= p.zoomMin) &&
					bounds.intersects(p.bounds)) {
				if (!p.active && this._map.attributionControl)
					this._map.attributionControl.addAttribution(p.attrib);
				p.active = true;
			} else {
				if (p.active && this._map.attributionControl)
					this._map.attributionControl.removeAttribution(p.attrib);
				p.active = false;
			}
		}
	},

	onRemove: function(map) {
		for (var i = 0; i < this._providers.length; i++) {
			var p = this._providers[i];
			if (p.active && this._map.attributionControl) {
				this._map.attributionControl.removeAttribution(p.attrib);
				p.active = false;
			}
		}
        	L.TileLayer.prototype.onRemove.apply(this, [map]);
	}
});

L.bingLayer = function (key, options) {
    return new L.BingLayer(key, options);
};

}


window.plugin.mapBing.setup = function() {
  window.plugin.mapBing.setupBingLeaflet();

  //set this to your API key
  var bingApiKey = 'ArR2hTa2C9cRQZT-RmgrDkfvh3PwEVRl0gB34OO4wJI7vQNElg3DDWvbo5lfUs3p';

  var bingTypes = {
    'Road': "Road",
    'Aerial': "Aerial",
    'AerialWithLabels': "Aerial with labels",
  };

  // bing maps has an annual usage limit, which will likely be hit in 6 months at this time.
  // it seems that the usage is counted on initialising the L.BingLayer, when the metadata is retrieved.
  // so, we'll create some dummy layers and add those to the map, then, the first time a layer is added,
  // create the L.BingLayer. This will eliminate all usage for users who install but don't use the map,
  // and only create usage for the map layers actually selected in use

  var bingMapContainers = [];

  for (type in bingTypes) {
    var name = bingTypes[type];

    bingMapContainers[type] = new L.LayerGroup();
    layerChooser.addBaseLayer(bingMapContainers[type], 'Bing '+name);
  }

  // now a leaflet event to catch base layer changes and create a L.BingLayer when needed
  map.on('baselayerchange', function(e) {
    for (type in bingMapContainers) {
      if (e.layer == bingMapContainers[type]) {
        if (bingMapContainers[type].getLayers().length == 0) {
          // dummy layer group is empty - create the bing layer
          console.log('basemap-bing: creating '+type+' layer');
          var bingMap = new L.BingLayer (bingApiKey, {type: type, maxNativeZoom: 19, maxZoom: 21});
          bingMapContainers[type].addLayer(bingMap);
        }
      }
    }
  });

};

var setup = window.plugin.mapBing.setup;

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


