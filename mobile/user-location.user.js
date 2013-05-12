// ==UserScript==
// @id             iitc-plugin-user-location@cradle
// @name           IITC plugin: User Location
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Show user location marker on map
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// ==/UserScript==

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////

window.plugin.userLocation = function() {};

window.plugin.userLocation.marker = {};
window.plugin.userLocation.locationLayer = new L.LayerGroup();

window.plugin.userLocation.setup = function() {

    var iconImage = '@@INCLUDEIMAGE:images/marker-icon.png@@';
    var iconRetImage = '@@INCLUDEIMAGE:images/marker-icon-2x.png@@';

    plugin.userLocation.icon = L.Icon.Default.extend({options: {
        iconUrl: iconImage,
        iconRetinaUrl: iconRetImage
    }});

    var marker = L.marker(window.map.getCenter(), {
        title: "User Location",
        icon: new plugin.userLocation.icon()
    });
    plugin.userLocation.marker = marker;
    marker.addTo(window.map);
    // jQueryUI doesn’t automatically notice the new markers
    window.setupTooltips($(marker._icon));
};

window.plugin.userLocation.updateLocation = function(lat, lng) {
    var latlng = new L.LatLng(lat, lng);
    window.plugin.userLocation.marker.setLatLng(latlng);
}

var setup = window.plugin.userLocation.setup;

// PLUGIN END //////////////////////////////////////////////////////////

if(window.iitcLoaded && typeof setup === 'function') {
  setup();
} else {
  if(window.bootPlugins)
    window.bootPlugins.push(setup);
  else
    window.bootPlugins = [setup];
}
} // wrapper end
// inject code into site context
var script = document.createElement('script');
script.appendChild(document.createTextNode('('+ wrapper +')();'));
(document.body || document.head || document.documentElement).appendChild(script);

