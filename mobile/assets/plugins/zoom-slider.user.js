// ==UserScript==
// @id             iitc-plugin-zoom-slider@fragger
// @name           IITC plugin: zoom slider
// @category       Controls
// @version        0.1.1.20181101.60209
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      none
// @downloadURL    none
// @description    [mobile-2018-11-01-060209] Show a zoom slider on the map instead of the zoom buttons.
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
plugin_info.pluginId = 'zoom-slider';
//END PLUGIN AUTHORS NOTE



// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.zoomSlider = function() {};

window.plugin.zoomSlider.setup  = function() {
  try { console.log('Loading Leaflet.zoomslider JS now'); } catch(e) {}
  L.Control.Zoomslider = (function () {

	var Knob = L.Draggable.extend({
		initialize: function (element, stepHeight, knobHeight) {
			L.Draggable.prototype.initialize.call(this, element, element);
			this._element = element;

			this._stepHeight = stepHeight;
			this._knobHeight = knobHeight;

			this.on('predrag', function () {
				this._newPos.x = 0;
				this._newPos.y = this._adjust(this._newPos.y);
			}, this);
		},

		_adjust: function (y) {
			var value = Math.round(this._toValue(y));
			value = Math.max(0, Math.min(this._maxValue, value));
			return this._toY(value);
		},

		// y = k*v + m
		_toY: function (value) {
			return this._k * value + this._m;
		},
		// v = (y - m) / k
		_toValue: function (y) {
			return (y - this._m) / this._k;
		},

		setSteps: function (steps) {
			var sliderHeight = steps * this._stepHeight;
			this._maxValue = steps - 1;

			// conversion parameters
			// the conversion is just a common linear function.
			this._k = -this._stepHeight;
			this._m = sliderHeight - (this._stepHeight + this._knobHeight) / 2;
		},

		setPosition: function (y) {
			L.DomUtil.setPosition(this._element,
								  L.point(0, this._adjust(y)));
		},

		setValue: function (v) {
			this.setPosition(this._toY(v));
		},

		getValue: function () {
			return this._toValue(L.DomUtil.getPosition(this._element).y);
		}
	});

	var Zoomslider = L.Control.extend({
		options: {
			position: 'topleft',
			// Height of zoom-slider.png in px
			stepHeight: 9,
			// Height of the knob div in px
			knobHeight: 5,
			styleNS: 'leaflet-control-zoomslider'
		},

		onAdd: function (map) {
			var container = L.DomUtil.create('div', this.options.styleNS + ' leaflet-bar');

			L.DomEvent.disableClickPropagation(container);

			this._map = map;

			this._zoomInButton = this._createZoomButton(
				'in', 'top', container, this._zoomIn);

			this._sliderElem = L.DomUtil.create(
				'div',
				this.options.styleNS + "-slider leaflet-bar-part",
				container);

			this._zoomOutButton = this._createZoomButton(
				'out', 'bottom', container, this._zoomOut);

			map .on('zoomlevelschange', this._refresh, this)
				.on("zoomend", this._updateKnob, this)
				.on("zoomend", this._updateDisabled, this)
				.whenReady(this._createSlider, this)
				.whenReady(this._createKnob, this)
				.whenReady(this._refresh, this);

			return container;
		},

		onRemove: function (map) {
			map .off("zoomend", this._updateKnob)
				.off("zoomend", this._updateDisabled)
				.off('zoomlevelschange', this._refresh);
		},

		_refresh: function () {
			var zoomLevels = this._zoomLevels();
			if (zoomLevels < Infinity  && this._knob  && this._sliderBody) {
				this._setSteps(zoomLevels);
				this._updateKnob();
				this._updateDisabled();
			}
		},
		_zoomLevels: function () {
			return this._map.getMaxZoom() - this._map.getMinZoom() + 1;
		},

		_createSlider: function () {
			this._sliderBody = L.DomUtil.create('div',
												this.options.styleNS + '-slider-body',
												this._sliderElem);
			L.DomEvent.on(this._sliderBody, 'click', this._onSliderClick, this);
		},

		_createKnob: function () {
			var knobElem = L.DomUtil.create('div', this.options.styleNS + '-slider-knob',
											this._sliderBody);
			L.DomEvent.disableClickPropagation(knobElem);

			this._knob = new Knob(knobElem,
								  this.options.stepHeight,
								  this.options.knobHeight)
				.on('dragend', this._updateZoom, this);
			this._knob.enable();
		},

		_onSliderClick: function (e) {
			var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e);
			var y = L.DomEvent.getMousePosition(first).y
	  				- L.DomUtil.getViewportOffset(this._sliderBody).y; // Cache this?
			this._knob.setPosition(y);
			this._updateZoom();
		},

		_zoomIn: function (e) {
			this._map.zoomIn(e.shiftKey ? 3 : 1);
		},
		_zoomOut: function (e) {
			this._map.zoomOut(e.shiftKey ? 3 : 1);
		},

		_createZoomButton: function (zoomDir, end, container, fn) {
			var barPart = 'leaflet-bar-part',
				classDef = this.options.styleNS + '-' + zoomDir
					+ ' ' + barPart
					+ ' ' + barPart + '-' + end,
				title = 'Zoom ' + zoomDir,
				link = L.DomUtil.create('a', classDef, container);
			link.href = '#';
			link.title = title;

			L.DomEvent
				.on(link, 'click', L.DomEvent.preventDefault)
				.on(link, 'click', fn, this);

			return link;
		},
		_toZoomLevel: function (value) {
			return value + this._map.getMinZoom();
		},
		_toValue: function (zoomLevel) {
			return zoomLevel - this._map.getMinZoom();
		},
		_setSteps: function (zoomLevels) {
			this._sliderBody.style.height 
				= (this.options.stepHeight * zoomLevels) + "px";
			this._knob.setSteps(zoomLevels);
		},
		_updateZoom: function () {
			this._map.setZoom(this._toZoomLevel(this._knob.getValue()));
		},
		_updateKnob: function () {
			if (this._knob) {
				this._knob.setValue(this._toValue(this._map.getZoom()));
			}
		},
		_updateDisabled: function () {
			var map = this._map,
				className = this.options.styleNS + '-disabled';

			L.DomUtil.removeClass(this._zoomInButton, className);
			L.DomUtil.removeClass(this._zoomOutButton, className);

			if (map.getZoom() === map.getMinZoom()) {
				L.DomUtil.addClass(this._zoomOutButton, className);
			}
			if (map.getZoom() === map.getMaxZoom()) {
				L.DomUtil.addClass(this._zoomInButton, className);
			}
		}
	});
	return Zoomslider;
})();

L.Map.mergeOptions({
    zoomControl: false,
    zoomsliderControl: true
});

L.Map.addInitHook(function () {
    if (this.options.zoomsliderControl) {
		this.zoomsliderControl = new L.Control.Zoomslider();
		this.addControl(this.zoomsliderControl);
	}
});

L.control.zoomslider = function (options) {
    return new L.Control.Zoomslider(options);
};

  try { console.log('done loading Leaflet.zoomslider JS'); } catch(e) {}

  // prevent Zoomslider from being activated by default (e.g. in minimap)
  L.Map.mergeOptions({
    zoomsliderControl: false
  });

  if(map.zoomControl._map) {
    window.map.removeControl(map.zoomControl);
  }
  window.map.addControl(L.control.zoomslider());

  $('head').append('<style>/** Slider **/\n.leaflet-control-zoomslider-slider {\n	padding-top: 5px;\n	padding-bottom: 5px;\n	background-color: #fff;\n	border-bottom: 1px solid #ccc;\n}\n\n.leaflet-control-zoomslider-slider-body {\n	background-image: url(data:image/png;base64,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);\n	background-repeat: repeat-y;\n	background-position: center 0px;\n	height: 100%;\n	cursor: default;\n}\n\n.leaflet-control-zoomslider-slider-knob {\n	width: 13px;\n	height:5px;\n	background-color: black;\n	background-position: center;\n 	-webkit-border-radius: 15px;\n	border-radius: 15px;\n	margin-left: 5px;\n	/*border: 5px; */\n	position:relative;\n}\n\n.leaflet-control-zoomslider-slider-body:hover {\n	cursor: pointer;\n}\n\n.leaflet-control-zoomslider-slider-knob:hover {\n	cursor: default;\n	cursor: -webkit-grab;\n	cursor:    -moz-grab;\n}\n\n.leaflet-dragging .leaflet-control-zoomslider,\n.leaflet-dragging .leaflet-control-zoomslider-slider,\n.leaflet-dragging .leaflet-control-zoomslider-slider-body,\n.leaflet-dragging .leaflet-control-zoomslider a,\n.leaflet-dragging .leaflet-control-zoomslider a.leaflet-control-zoomslider-disabled,\n.leaflet-dragging .leaflet-control-zoomslider-slider-knob:hover  {\n	cursor: move;\n	cursor: -webkit-grabbing;\n	cursor:    -moz-grabbing;\n}\n\n/** Leaflet Zoom Styles **/\n.leaflet-container .leaflet-control-zoomslider {\n	margin-left: 13px;\n	margin-top: 12px;\n}\n.leaflet-control-zoomslider a {\n	width: 23px;\n	height: 22px;\n	text-align: center;\n	text-decoration: none;\n	color: black;\n	display: block;\n}\n.leaflet-control-zoomslider a:hover {\n	background-color: #fff;\n	color: #777;\n}\n.leaflet-control-zoomslider-in {\n	font: bold 19px/24px Arial, Helvetica, sans-serif;\n}\n.leaflet-control-zoomslider-in:after{\n	content:"+"\n}\n.leaflet-control-zoomslider-out {\n	font: bold 23px/20px Tahoma, Verdana, sans-serif;\n}\n.leaflet-control-zoomslider-out:after{\n	content:"-"\n}\n.leaflet-control-zoomslider a.leaflet-control-zoomslider-disabled {\n	cursor: default;\n	color: #bbb;\n}\n\n/* Touch */\n\n.leaflet-touch .leaflet-control-zoomslider-slider-knob {\n	width:20px;\n}\n.leaflet-touch .leaflet-control-zoomslider a {\n	width: 30px;\n	height: 30px;\n}\n.leaflet-touch .leaflet-control-zoomslider-in {\n	font-size: 24px;\n	line-height: 29px;\n}\n.leaflet-touch .leaflet-control-zoomslider-out {\n	font-size: 28px;\n	line-height: 24px;\n}\n\n.leaflet-touch .leaflet-control-zoomslider {\n	box-shadow: none;\n}\n\n.leaflet-touch .leaflet-control-zoomslider {\n	border: 4px solid rgba(0,0,0,0.3);\n}\n</style>');
};

var setup = window.plugin.zoomSlider.setup;

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


