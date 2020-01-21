// ==UserScript==
// @id             iitc-plugin-distance-to-portal@jonatkins
// @name           IITC plugin: Distance to portal
// @category       Portal Info
// @version        0.1.1.20181101.60209
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      none
// @downloadURL    none
// @description    [mobile-2018-11-01-060209] Allows your current location to be set manually, then shows the distance to the selected portal. Useful when managing portal keys.
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
plugin_info.pluginId = 'distance-to-portal';
//END PLUGIN AUTHORS NOTE



// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.distanceToPortal = function() {};

window.plugin.distanceToPortal.addDistance = function() {
  var div = $('<div>')
    .attr({
      id: 'portal-distance',
      title: 'Double-click to set/change current location',
    })
    .on('dblclick', window.plugin.distanceToPortal.setLocation);

  $('#resodetails').after(div);

  window.plugin.distanceToPortal.updateDistance();
};

window.plugin.distanceToPortal.formatDistance = function(dist) {
  if (dist >= 10000) {
    dist = Math.round(dist/1000)+'km';
  } else if (dist >= 1000) {
    dist = Math.round(dist/100)/10+'km';
  } else {
    dist = Math.round(dist)+'m';
  }

  return dist;
}


window.plugin.distanceToPortal.updateDistance = function() {
  if(!(selectedPortal && portals[selectedPortal])) return;
  var portal = portals[selectedPortal];

  var ll = portal.getLatLng();

  var text;

  if (window.plugin.distanceToPortal.currentLoc) {
    var dist = window.plugin.distanceToPortal.currentLoc.distanceTo(ll);

    dist = window.plugin.distanceToPortal.formatDistance(dist);

    var bearing = window.plugin.distanceToPortal.currentLoc.bearingTo(ll);
    var bearingWord = window.plugin.distanceToPortal.currentLoc.bearingWordTo(ll);

    $('#portal-distance')
      .text('Distance: ' + dist + ' ')
      .append($('<span>')
        .addClass('portal-distance-bearing')
        .css({
          'transform': 'rotate('+bearing+'deg)',
          '-moz-transform': 'rotate('+bearing+'deg)',
          '-webkit-transform': 'rotate('+bearing+'deg)',
        }))
      .append(document.createTextNode(' ' + zeroPad(bearing, 3) + '° ' + bearingWord));
  } else {
    $('#portal-distance').text('Location not set');
  }
};


window.plugin.distanceToPortal.setLocation = function() {
  if (window.plugin.distanceToPortal.currentLocMarker) {
    map.removeLayer(window.plugin.distanceToPortal.currentLocMarker);
    window.plugin.distanceToPortal.currentLocMarker = null;
    return;
  }


  if (!window.plugin.distanceToPortal.currentLoc) {
    window.plugin.distanceToPortal.currentLoc = map.getCenter();
  }

  window.plugin.distanceToPortal.currentLocMarker = createGenericMarker (window.plugin.distanceToPortal.currentLoc,'#444',{draggable:true});

  window.plugin.distanceToPortal.currentLocMarker.on('drag', function(e) {
    window.plugin.distanceToPortal.currentLoc = window.plugin.distanceToPortal.currentLocMarker.getLatLng();

    localStorage['plugin-distance-to-portal'] = JSON.stringify({lat:window.plugin.distanceToPortal.currentLoc.lat, lng:window.plugin.distanceToPortal.currentLoc.lng});

    if (selectedPortal) window.plugin.distanceToPortal.updateDistance();
  });

  map.addLayer(window.plugin.distanceToPortal.currentLocMarker);
};

window.plugin.distanceToPortal.setupPortalsList = function() {
  if(!window.plugin.portalslist) return;

  window.plugin.portalslist.fields.push({
    title: "Dist",
    value: function(portal) { if (window.plugin.distanceToPortal.currentLoc) return window.plugin.distanceToPortal.currentLoc.distanceTo(portal.getLatLng()); else return 0; },
    format: function(cell, portal, dist) {
      $(cell).addClass('alignR').text(dist?window.plugin.distanceToPortal.formatDistance(dist):'-');
    }
  });
}


window.plugin.distanceToPortal.setup  = function() {
  // https://github.com/gregallensworth/Leaflet/
  /*
 * extend Leaflet's LatLng class
 * giving it the ability to calculate the bearing to another LatLng
 * Usage example:
 *     here  = map.getCenter();   / some latlng
 *     there = L.latlng([37.7833,-122.4167]);
 *     var whichway = here.bearingWordTo(there);
 *     var howfar   = (here.distanceTo(there) / 1609.34).toFixed(2);
 *     alert("San Francisco is " + howfar + " miles, to the " + whichway );
 * 
 * Greg Allensworth   <greg.allensworth@gmail.com>
 * No license, use as you will, kudos welcome but not required, etc.
 */


L.LatLng.prototype.bearingTo = function(other) {
    var d2r  = L.LatLng.DEG_TO_RAD;
    var r2d  = L.LatLng.RAD_TO_DEG;
    var lat1 = this.lat * d2r;
    var lat2 = other.lat * d2r;
    var dLon = (other.lng-this.lng) * d2r;
    var y    = Math.sin(dLon) * Math.cos(lat2);
    var x    = Math.cos(lat1)*Math.sin(lat2) - Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
    var brng = Math.atan2(y, x);
    brng = parseInt( brng * r2d );
    brng = (brng + 360) % 360;
    return brng;
};

L.LatLng.prototype.bearingWordTo = function(other) {
    var bearing = this.bearingTo(other);
    var bearingword = '';
    if      (bearing >=  22 && bearing <=  67) bearingword = 'NE';
    else if (bearing >=  67 && bearing <= 112) bearingword =  'E';
    else if (bearing >= 112 && bearing <= 157) bearingword = 'SE';
    else if (bearing >= 157 && bearing <= 202) bearingword =  'S';
    else if (bearing >= 202 && bearing <= 247) bearingword = 'SW';
    else if (bearing >= 247 && bearing <= 292) bearingword =  'W';
    else if (bearing >= 292 && bearing <= 337) bearingword = 'NW';
    else if (bearing >= 337 || bearing <=  22) bearingword =  'N';
    return bearingword;
};



  try {
    window.plugin.distanceToPortal.currentLoc = L.latLng(JSON.parse(localStorage['plugin-distance-to-portal']));
  } catch(e) {
    window.plugin.distanceToPortal.currentLoc = null;
  }

  window.plugin.distanceToPortal.currentLocMarker = null;

  $('<style>').prop('type', 'text/css').html('#portal-distance {\n	text-align: center;\n}\n.portal-distance-bearing {\n	display: inline-block;\n	vertical-align: top;\n	position: relative;\n	height: 1em;\n	width: 1em;\n}\n.portal-distance-bearing:before, .portal-distance-bearing:after {\n	border-color: transparent currentcolor transparent transparent;\n	border-style: solid;\n	border-width: 0.75em 0.4em 0 0;\n	content: "";\n	height: 0;\n	width: 0;\n	position: absolute;\n	top: 0.15em;\n	left: 0.15em;\n	transform: skewY(-30deg);\n	-moz-transform: skewY(-30deg);\n	-webkit-transform: skewY(-30deg);\n}\n.portal-distance-bearing:after {\n	left: auto;\n	right: 0.15em;\n	transform: scaleX(-1) skewY(-30deg);\n	-moz-transform: scaleX(-1) skewY(-30deg);\n	-webkit-transform: scaleX(-1) skewY(-30deg);\n}\n\n').appendTo('head');

  addHook('portalDetailsUpdated', window.plugin.distanceToPortal.addDistance);

  window.plugin.distanceToPortal.setupPortalsList();

};

var setup =  window.plugin.distanceToPortal.setup;

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


