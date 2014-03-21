// ==UserScript==
// @id             iitc-plugin-marker-canvas-icon@jonatkins
// @name           IITC plugin: Marker drawn using icons from canvas data URLs
// @category       Tweaks
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] EXPERIMENTAL: draw markers using individual Leaflet Icons, created from canvas elements converted to data: URLs
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.markerIconCanvasUrl = function() {};

window.plugin.markerIconCanvasUrl.setup  = function() {

  // create a new marker. 'data' contain the IITC-specific entity data to be stored in the object options
  window.createMarker = function(latlng, data) {
    var icon = createMarkerIcon(data);

    var options = L.extend({}, data, { icon: icon });

    var marker = L.marker (latlng, options);
    marker.bringToFront = function(){}; //TEMP - until the rest of IITC code is changed to take account of non-path markers
    return marker;

  }

  window.setMarkerStyle = function(marker, selected) {
    var icon = createMarkerIcon(marker.options,selected);

    marker.setIcon(icon);

  }


  window.createMarkerIcon = function(details,selected) {
    var scale = window.portalMarkerScale();

    var lvlWeight = Math.max(2, Math.floor(details.level) / 1.5) * scale;
    var lvlRadius = (details.team === window.TEAM_NONE ? 7 : Math.floor(details.level) + 4) * scale;

    lvlRadius += (L.Browser.mobile ? PORTAL_RADIUS_ENLARGE_MOBILE*scale : 0);

    var fillColor = COLORS[details.team];
    var fillAlpha = 0.5;

    var lineColor = selected ? COLOR_SELECTED_PORTAL : COLORS[details.team];
    var lineAlpha = 1.0;

    var cacheKey = ([lvlRadius,lvlWeight,fillColor,fillAlpha,lineColor,lineAlpha]).join(':');

    if (!window.markerIconCache[cacheKey]) {
      window.markerIconCache[cacheKey] = createNewMarkerIcon(lvlRadius,lvlWeight,fillColor,fillAlpha,lineColor,lineAlpha);
    }
    return window.markerIconCache[cacheKey];
  }

  window.markerIconCache = {};

  window.createNewMarkerIcon = function (radius,weight,fillcol,fillalpha,linecol,linealpha) {

    var size = Math.ceil(radius + weight/2)*2;
    var anchor = Math.floor(size/2);


    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    var ctx = canvas.getContext('2d');
    ctx.beginPath();

    ctx.arc(anchor,anchor,radius,0,2*Math.PI);

    ctx.fillStyle = fillcol;
    ctx.globalAlpha = fillalpha;

    ctx.fill();

    ctx.lineWidth = weight;
    ctx.strokeStyle = linecol;
    ctx.globalAlpha = linealpha;

    ctx.stroke();

    var dataurl = canvas.toDataURL();

    return L.icon({
      iconUrl: dataurl,
      iconSize: [size,size],
      iconAnchor: [anchor,anchor]
    });

  }



};

var setup =  window.plugin.markerIconCanvasUrl.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
