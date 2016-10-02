// ==UserScript==
// @id             iitc-plugin-marker-divicon-svg@jonatkins
// @name           IITC plugin: Marker drawn using separate SVGs
// @category       Tweaks
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] EXPERIMENTAL: draw markers using individual Leaflet DivIcons, as SVG
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.markerDivIconSvg = function() {};

window.plugin.markerDivIconSvg.setup  = function() {

  // create a new marker. 'data' contain the IITC-specific entity data to be stored in the object options
  window.createMarker = function(latlng, data) {
    var icon = createMarkerDivIcon(data);

    var options = L.extend({}, data, { icon: icon });

    var marker = L.marker (latlng, options);
    return marker;

  }


  window.setMarkerStyle = function(marker, selected) {
    var icon = createMarkerDivIcon(marker.options);

    marker.setIcon(icon);

  }


  window.createMarkerDivIcon = function(details) {
    var scale = window.portalMarkerScale();

    var lvlWeight = Math.max(2, Math.floor(details.level) / 1.5) * scale;
    var lvlRadius = (details.team === window.TEAM_NONE ? 7 : Math.floor(details.level) + 4) * scale;

    lvlRadius += (L.Browser.mobile ? PORTAL_RADIUS_ENLARGE_MOBILE*scale : 0);

    var size = Math.ceil(lvlRadius + lvlWeight/2)*2;
    var anchor = Math.floor(size/2);

    var svg = '<svg width="'+size+'" height="'+size+'">'
            + '<circle cx="'+anchor+'" cy="'+anchor+'" r="'+lvlRadius+'" stroke="'+COLORS[details.team]+'" stroke-width="'+lvlWeight+'" fill="'+COLORS[details.team]+'" fill-opacity="0.5" />'
            + '</svg>';

    return L.divIcon({
      iconSize: [size,size],
      iconAnchor: [anchor,anchor],
      className: 'portal-marker',
      html: svg
    });

  }



};

var setup =  window.plugin.markerDivIconSvg.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
