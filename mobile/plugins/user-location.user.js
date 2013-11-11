// ==UserScript==
// @id             iitc-plugin-user-location@cradle
// @name           IITC plugin: User Location
// @version        0.1.4.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Show user location marker on map
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// ==/UserScript==

@@PLUGINSTART@@

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

    var cssClass = PLAYER.team === 'RESISTANCE' ? 'res' : 'enl';
    var title = '<span class="nickname '+ cssClass+'" style="font-weight:bold;">' + PLAYER.nickname + '</span>\'s location';

    var marker = L.marker(window.map.getCenter(), {
        icon: new plugin.userLocation.icon()
    });

    marker.bindPopup(title);

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

@@PLUGINEND@@
