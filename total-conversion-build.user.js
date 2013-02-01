// ==UserScript==
// @id             ingress-intel-total-conversion@breunigs
// @name           intel map total conversion
// @version        0.1-2013-02-02-003549
// @namespace      https://github.com/breunigs/ingress-intel-total-conversion
// @updateURL      https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/total-conversion-build.user.js
// @downloadURL    https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/total-conversion-build.user.js
// @description    total conversion for the ingress intel map.
// @include        http://www.ingress.com/intel*
// ==/UserScript==


// REPLACE ORIG SITE ///////////////////////////////////////////////////
if(document.getElementsByTagName('html')[0].getAttribute('itemscope') != null)
  throw('Ingress Intel Website is down, not a userscript issue.');

// disable vanilla JS
window.onload = function() {};

// rescue user data from original page
var scr = document.getElementsByTagName('script');
for(var x in scr) {
  var s = scr[x];
  if(s.src) continue;
  if(s.type !== 'text/javascript') continue;
  var d = s.innerHTML.split('\n');
  break;
}

for(var i = 0; i < d.length; i++) {
  if(!d[i].match('var PLAYER = ')) continue;
  eval(d[i].match(/^var /, 'window.'));
  break;
}
// player information is now available in a hash like this:
// window.PLAYER = {"ap": "123", "energy": 123, "available_invites": 123, "nickname": "somenick", "team": "ALIENS||RESISTANCE"};


// remove complete page. We only wanted the user-data and the page’s
// security context so we can access the API easily. Setup as much as
// possible without requiring scripts.
document.getElementsByTagName('head')[0].innerHTML = ''
  + '<link rel="stylesheet" type="text/css" href="http://breunigs.github.com/ingress-intel-total-conversion/style.css"/>'
  + '<link rel="stylesheet" type="text/css" href="http://cdn.leafletjs.com/leaflet-0.5/leaflet.css"/>'
  + '<link rel="stylesheet" type="text/css" href="http://fonts.googleapis.com/css?family=Coda"/>';

document.getElementsByTagName('body')[0].innerHTML = ''
  + '<div id="map">Loading, please wait</div>'
  + '<div id="chatcontrols">'
  + '  <a>expand</a><a>automated</a><a>public</a><a class="active">faction</a>'
  + '</div>'
  + '<div id="chat">'
  + '  <div id="chatfaction"></div>'
  + '  <div id="chatpublic"></div>'
  + '  <div id="chatbot"></div>'
  + '</div>'
  + '<div id="sidebar" style="display: none">'
  + '  <div id="playerstat">t</div>'
  + '  <div id="gamestat">&nbsp;loading global control stats</div>'
  + '  <input id="geosearch" placeholder="Search location…" type="search"/>'
  + '  <div id="portaldetails"></div>'
  + '  <input id="redeem" placeholder="Redeem code…" type="text"/>'
  + '  <div id="updatestatus"></div>'
  + '</div>';

// putting everything in a wrapper function that in turn is placed in a
// script tag on the website allows us to execute in the site’s context
// instead of in the Greasemonkey/Extension/etc. context.
function wrapper() {

// LEAFLET PREFER CANVAS ///////////////////////////////////////////////
// Set to true if Leaflet should draw things using Canvas instead of SVG
// Disabled for now because it has several bugs: flickering, constant
// CPU usage and it continuously fires the moveend event.
L_PREFER_CANVAS = false;

// CONFIG OPTIONS ////////////////////////////////////////////////////
var REFRESH = 30; // refresh view every 30s (base time)
var ZOOM_LEVEL_ADJ = 5; // add 5 seconds per zoom level
var REFRESH_GAME_SCORE = 5*60; // refresh game score every 5 minutes
var MAX_IDLE_TIME = 4; // stop updating map after 4min idling
var PRECACHE_PLAYER_NAMES_ZOOM = 17; // zoom level to start pre-resolving player names
var SIDEBAR_WIDTH = 300;
// this controls how far data is being drawn outside the viewport. Set
// it 0 to only draw entities that intersect the current view. A value
// of one will render an area twice the size of the viewport (or some-
// thing like that, Leaflet doc isn’t too specific). Setting it too low
// makes the missing data on move/zoom out more obvious. Setting it too
// high causes too many items to be drawn, making drag&drop sluggish.
var VIEWPORT_PAD_RATIO = 0.3;


var COLOR_SELECTED_PORTAL = '#f00';
var COLORS = ['#FFCE00', '#0088FF', '#03FE03']; // none, res, enl
var COLORS_LVL = ['#000', '#FECE5A', '#FFA630', '#FF7315', '#E40000', '#FD2992', '#EB26CD', '#C124E0', '#9627F4'];
// circles around a selected portal that show from where you can hack
// it and how far the portal reaches (i.e. how far links may be made
// from this portal)
var ACCESS_INDICATOR_COLOR = 'orange';
var RANGE_INDICATOR_COLOR = 'red';

// INGRESS CONSTANTS /////////////////////////////////////////////////
// http://decodeingress.me/2012/11/18/ingress-portal-levels-and-link-range/
var RESO_NRG = [0, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000];
var MAX_XM_PER_LEVEL = [0, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000];
var MIN_AP_FOR_LEVEL = [0, 10000, 30000, 70000, 150000, 300000, 600000, 1200000];
var HACK_RANGE = 35; // in meters, max. distance from portal to be able to access it
var SLOT_TO_CARDINAL = ['E', 'NE', 'N', 'NW', 'W', 'SW', 'S', 'SE'];
var DEFAULT_PORTAL_IMG = 'http://commondatastorage.googleapis.com/ingress/img/default-portal-image.png';

// OTHER MORE-OR-LESS CONSTANTS //////////////////////////////////////
var NOMINATIM = 'http://nominatim.openstreetmap.org/search?format=json&limit=1&q=';
var DEG2RAD = Math.PI / 180;
var TEAM_NONE = 0, TEAM_RES = 1, TEAM_ENL = 2;
var TEAM_TO_CSS = ['none', 'res', 'enl'];
// make PLAYER variable available in site context
var PLAYER = window.PLAYER;
var CHAT_SHRINKED = 60;

// STORAGE ///////////////////////////////////////////////////////////
// global variables used for storage. Most likely READ ONLY. Proper
// way would be to encapsulate them in an anonymous function and write
// getters/setters, but if you are careful enough, this works.
var refreshTimeout;
var urlPortal = null;
window.playersToResolve = [];
window.playersInResolving = [];
window.selectedPortal = null;
window.portalRangeIndicator = null;
window.portalAccessIndicator = null;
window.mapRunsUserAction = false;
var portalsLayer, linksLayer, fieldsLayer;
var portalsDetail = {};

// contain references to all entities shown on the map. These are
// automatically kept in sync with the items on *sLayer, so never ever
// write to them.
window.portals = {};
window.links = {};
window.fields = {};






// MAP DATA //////////////////////////////////////////////////////////
// these functions handle how and which entities are displayed on the
// map. They also keep them up to date, unless interrupted by user
// action.


// sets the timer for the next auto refresh. Ensures only one timeout
// is queued. May be given 'override' in milliseconds if time should
// not be guessed automatically. Especially useful if a little delay
// is required, for example when zooming.
window.startRefreshTimeout = function(override) {
  // may be required to remove 'paused during interaction' message in
  // status bar
  window.renderUpdateStatus();
  if(refreshTimeout) clearTimeout(refreshTimeout);
  if(override) {
    console.log('refreshing in ' + override + 'ms');
    refreshTimeout = setTimeout(window.requestData, override);
    return;
  }
  var t = REFRESH*1000;
  var adj = ZOOM_LEVEL_ADJ * (18 - window.map.getZoom());
  if(adj > 0) t += adj*1000;
  console.log("next auto refresh in " + t/1000 + " seconds.");
  refreshTimeout = setTimeout(window.requestData, t);
}

// requests map data for current viewport. For details on how this
// works, refer to the description in “MAP DATA REQUEST CALCULATORS”
window.requestData = function() {
  if(window.idleTime >= MAX_IDLE_TIME) {
    console.log('user has been idle for ' + idleTime + ' minutes. Skipping refresh.');
    renderUpdateStatus();
    return;
  }

  console.log('refreshing data');
  requests.abort();
  cleanUp();

  var magic = convertCenterLat(map.getCenter().lat);
  var R = calculateR(magic);

  var bounds = map.getBounds();
  // convert to point values
  topRight = convertLatLngToPoint(bounds.getNorthEast(), magic, R);
  bottomLeft = convertLatLngToPoint(bounds.getSouthWest() , magic, R);
  // how many quadrants intersect the current view?
  quadsX = Math.abs(bottomLeft.x - topRight.x);
  quadsY = Math.abs(bottomLeft.y - topRight.y);

  // will group requests by second-last quad-key quadrant
  tiles = {};

  // walk in x-direction, starts right goes left
  for(var i = 0; i <= quadsX; i++) {
    var x = Math.abs(topRight.x - i);
    var qk = pointToQuadKey(x, topRight.y);
    var bnds = convertPointToLatLng(x, topRight.y, magic, R);
    if(!tiles[qk.slice(0, -1)]) tiles[qk.slice(0, -1)] = [];
    tiles[qk.slice(0, -1)].push(generateBoundsParams(qk, bnds));

    // walk in y-direction, starts top, goes down
    for(var j = 1; j <= quadsY; j++) {
      var qk = pointToQuadKey(x, topRight.y + j);
      var bnds = convertPointToLatLng(x, topRight.y + j, magic, R);
      if(!tiles[qk.slice(0, -1)]) tiles[qk.slice(0, -1)] = [];
      tiles[qk.slice(0, -1)].push(generateBoundsParams(qk, bnds));
    }
  }

  // finally send ajax requests
  $.each(tiles, function(ind, tls) {
    data = { minLevelOfDetail: -1 };
    data.boundsParamsList = tls;
    window.requests.add(window.postAjax('getThinnedEntitiesV2', data, window.handleDataResponse));
  });
}

// works on map data response and ensures entities are drawn/updated.
window.handleDataResponse = function(data, textStatus, jqXHR) {
  // remove from active ajax queries list
  window.requests.remove(jqXHR);
  if(!data || !data.result) {
    console.warn(data);
    return;
  }

  var portalUpdateAvailable = false;
  var m = data.result.map;
  // defer rendering of portals because there is no z-index in SVG.
  // this means that what’s rendered last ends up on top. While the
  // portals can be brought to front, this costs extra time. They need
  // to be in the foreground, or they cannot be clicked. See
  // https://github.com/Leaflet/Leaflet/issues/185
  var ppp = [];
  $.each(m, function(qk, val) {
    $.each(val.deletedGameEntityGuids, function(ind, guid) {
      window.removeByGuid(guid);
    });

    $.each(val.gameEntities, function(ind, ent) {
      // ent = [GUID, id(?), details]
      // format for links: { controllingTeam, creator, edge }
      // format for portals: { controllingTeam, turret }

      if(ent[2].turret !== undefined) {
        if(selectedPortal == ent[0]) portalUpdateAvailable = true;

        portalsDetail[ent[0]] = ent[2];
        // immediately render portal details if selected by URL
        if(urlPortal && ent[0] == urlPortal && !selectedPortal) {
          urlPortal = null; // only pre-select it once
          window.renderPortalDetails(ent[0]);
        }
        ppp.push(ent); // delay portal render
      } else if(ent[2].edge !== undefined)
        renderLink(ent);
      else if(ent[2].capturedRegion !== undefined)
        renderField(ent);
      else
        throw('Unknown entity: ' + JSON.stringify(ent));
    });
  });

  $.each(ppp, function(ind, portal) { renderPortal(portal); });

  if(portals[selectedPortal]) portals[selectedPortal].bringToFront();

  if(portalUpdateAvailable) renderPortalDetails(selectedPortal);
  resolvePlayerNames();
}

// removes entities that are still handled by Leaflet, although they
// do not intersect the current viewport.
window.cleanUp = function() {
  var cnt = [0,0,0];
  var b = getPaddedBounds();
  portalsLayer.eachLayer(function(portal) {
    if(b.contains(portal.getLatLng())) return;
    cnt[0]++;
    portalsLayer.removeLayer(portal);
  });
  linksLayer.eachLayer(function(link) {
    if(b.intersects(link.getBounds())) return;
    cnt[1]++;
    linksLayer.removeLayer(link);
  });
  fieldsLayer.eachLayer(function(field) {
    if(b.intersects(field.getBounds())) return;
    cnt[2]++;
    fieldsLayer.removeLayer(field);
  });
  console.log('removed out-of-bounds: '+cnt[0]+' portals, '+cnt[1]+' links, '+cnt[2]+' fields');
}

// removes given entity from map
window.removeByGuid = function(guid) {
  // portals end in “.11” or “.12“, links in “.9", fields in “.b”
  // .c == player/creator
  switch(guid.slice(33)) {
    case '11':
    case '12':
      if(!window.portals[guid]) return;
      portalsLayer.removeLayer(window.portals[guid]);
      break;
    case '9':
      if(!window.links[guid]) return;
      linksLayer.removeLayer(window.links[guid]);
      break;
    case 'b':
      if(!window.fields[guid]) return;
      fieldsLayer.removeLayer(window.fields[guid]);
      break;
    default:
      console.warn('unknown GUID type: ' + guid);
      window.debug.printStackTrace();
  }
}



// renders a portal on the map from the given entity
window.renderPortal = function(ent) {
  removeByGuid(ent[0]);
  var latlng = [ent[2].locationE6.latE6/1E6, ent[2].locationE6.lngE6/1E6];
  if(!getPaddedBounds().contains(latlng)) return;

  // pre-load player names for high zoom levels
  if(map.getZoom() >= PRECACHE_PLAYER_NAMES_ZOOM) {
    if(ent[2].captured && ent[2].captured.capturingPlayerId)
      getPlayerName(ent[2].captured.capturingPlayerId);
    if(ent[2].resonatorArray && ent[2].resonatorArray.resonators)
      $.each(ent[2].resonatorArray.resonators, function(ind, reso) {
        if(reso) getPlayerName(reso.ownerGuid);
      });
  }

  var team = getTeam(ent[2]);

  var p = L.circleMarker(latlng, {
    radius: 7,
    color: ent[0] == selectedPortal ? COLOR_SELECTED_PORTAL : COLORS[team],
    opacity: 1,
    weight: 3,
    fillColor: COLORS[team],
    fillOpacity: 0.5,
    clickable: true,
    guid: ent[0]});

  p.on('remove',   function() { delete window.portals[this.options.guid]; });
  p.on('add',      function() { window.portals[this.options.guid] = this; });
  p.on('click',    function() { window.renderPortalDetails(ent[0]); });
  p.on('dblclick', function() {
    window.renderPortalDetails(ent[0]);
    window.map.setView(latlng, 17);
  });
  p.addTo(portalsLayer);
}

// renders a link on the map from the given entity
window.renderLink = function(ent) {
  removeByGuid(ent[0]);
  var team = getTeam(ent[2]);
  var edge = ent[2].edge;
  var latlngs = [
    [edge.originPortalLocation.latE6/1E6, edge.originPortalLocation.lngE6/1E6],
    [edge.destinationPortalLocation.latE6/1E6, edge.destinationPortalLocation.lngE6/1E6]
  ];
  var poly = L.polyline(latlngs, {
    color: COLORS[team],
    opacity: 0.5,
    weight:2,
    clickable: false,
    guid: ent[0]
  });

  if(!getPaddedBounds().intersects(poly.getBounds())) return;

  poly.on('remove', function() { delete window.links[this.options.guid]; });
  poly.on('add',    function() { window.links[this.options.guid] = this; });
  poly.addTo(linksLayer);
}

// renders a field on the map from a given entity
window.renderField = function(ent) {
  window.removeByGuid(ent[0]);
  var team = getTeam(ent[2]);
  var reg = ent[2].capturedRegion;
  var latlngs = [
    [reg.vertexA.location.latE6/1E6, reg.vertexA.location.lngE6/1E6],
    [reg.vertexB.location.latE6/1E6, reg.vertexB.location.lngE6/1E6],
    [reg.vertexC.location.latE6/1E6, reg.vertexC.location.lngE6/1E6]
  ];
  var poly = L.polygon(latlngs, {
    fillColor: COLORS[team],
    fillOpacity: 0.25,
    stroke: false,
    clickable: false,
    guid: ent[0]});

  if(!getPaddedBounds().intersects(poly.getBounds())) return;

  poly.on('remove', function() { delete window.fields[this.options.guid]; });
  poly.on('add',    function() { window.fields[this.options.guid] = this; });
  poly.addTo(fieldsLayer);
}



// REQUEST HANDLING //////////////////////////////////////////////////
// note: only meant for portal/links/fields request, everything else
// does not count towards “loading”

window.activeRequests = [];
window.failedRequestCount = 0;

window.requests = function() {}

window.requests.add = function(ajax) {
  window.activeRequests.push(ajax);
  renderUpdateStatus();
}

window.requests.remove = function(ajax) {
  window.activeRequests.splice(window.activeRequests.indexOf(ajax), 1);
  renderUpdateStatus();
}

window.requests.abort = function() {
  $.each(window.activeRequests, function(ind, actReq) {
    if(actReq) actReq.abort();
  });
  window.activeRequests = [];
  window.failedRequestCount = 0;

  startRefreshTimeout();
  renderUpdateStatus();
}

// gives user feedback about pending operations. Draws current status
// to website.
window.renderUpdateStatus = function() {
  var t = '<b>map status:</b> ';
  if(mapRunsUserAction)
    t += 'paused during interaction';
  else if(isIdle())
    t += 'Idle, not updating.';
  else if(window.activeRequests.length > 0)
    t += window.activeRequests.length + ' requests running.';
  else
    t += 'Up to date.';

  if(window.failedRequestCount > 0)
    t += ' ' + window.failedRequestCount + ' requests failed.'

  t += '<br/><span title="not removing portals as long as you keep them in view, though">(';
  var conv = ['impossible', 8,8,7,7,6,6,5,5,4,4,3,3,2,2,1];
  var z = map.getZoom();
  if(z >= 16)
    t += 'requesting all portals';
  else
    t+= 'only requesting portals with level '+conv[z]+' and up';
  t += ')</span>';

  $('#updatestatus').html(t);
}




// UTILS + MISC  ///////////////////////////////////////////////////////

// retrieves parameter from the URL?query=string.
window.getURLParam = function(param) {
  var v = document.URL;
  var i = v.indexOf(param);
  if(i <= -1) return '';
  v = v.substr(i);
  i = v.indexOf("&");
  if(i >= 0) v = v.substr(0, i);
  return v.replace(param+"=","");
}

// read cookie by name.
// http://stackoverflow.com/a/5639455/1684530 by cwolves
var cookies;
window.readCookie = function(name,c,C,i){
  if(cookies) return cookies[name];
  c = document.cookie.split('; ');
  cookies = {};
  for(i=c.length-1; i>=0; i--){
    C = c[i].split('=');
    cookies[C[0]] = unescape(C[1]);
  }
  return cookies[name];
}

window.writeCookie = function(name, val) {
  document.cookie = name + "=" + val + '; expires=Thu, 31 Dec 2020 23:59:59 GMT; path=/';
}

// add thousand separators to given number.
// http://stackoverflow.com/a/1990590/1684530 by Doug Neiner.
window.digits = function(d) {
  return (d+"").replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1 ");
}

// posts AJAX request to Ingress API.
// action: last part of the actual URL, the rpc/dashboard. is
//         added automatically
// data: JSON data to post. method will be derived automatically from
//       action, but may be overridden. Expects to be given Hash.
//       Strings are not supported.
// success: method to call on success. See jQuery API docs for avail-
//          able arguments: http://api.jquery.com/jQuery.ajax/
// error: see above. Additionally it is logged if the request failed.
window.postAjax = function(action, data, success, error) {
  data = JSON.stringify($.extend({method: 'dashboard.'+action}, data));
  var errCnt = function(jqXHR) { window.failedRequestCount++; window.requests.remove(jqXHR); };
  return $.ajax({
    url: 'rpc/dashboard.'+action,
    type: 'POST',
    data: data,
    dataType: 'json',
    success: success,
    error: error ? [errCnt, error] : errCnt,
    contentType: 'application/json; charset=utf-8',
    beforeSend: function(req) {
      req.setRequestHeader('X-CSRFToken', readCookie('csrftoken'));
    }
  });
}

// converts unix timestamps to HH:mm:ss format if it was today;
// otherwise it returns YYYY-MM-DD
window.unixTimeToString = function(time, full) {
  if(!time) return null;
  var d = new Date(typeof time === 'string' ? parseInt(time) : time);
  var time = d.toLocaleTimeString();
  var date = d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
  if(typeof full !== 'undefined' && full) return date + ' ' + time;
  if(d.toDateString() == new Date().toDateString())
    return time;
  else
    return date;
}

window.unixTimeToHHmm = function(time) {
  if(!time) return null;
  var d = new Date(typeof time === 'string' ? parseInt(time) : time);
  return d.toLocaleTimeString().slice(0, -3);
}



window.rangeLinkClick = function() {
  if(window.portalRangeIndicator)
    window.map.fitBounds(window.portalRangeIndicator.getBounds());
}

window.reportPortalIssue = function(info) {
  var t = 'Redirecting you to a Google Help Page. Once there, click on “Contact Us” in the upper right corner.\n\nThe text box contains all necessary information. Press CTRL+C to copy it.';
  //codename, approx addr, portalname
  if(prompt(t, info) !== null)
    location.href = 'https://support.google.com/ingress?hl=en';
}


window._storedPaddedBounds = undefined;
window.getPaddedBounds = function() {
  if(_storedPaddedBounds === undefined) {
    map.on('zoomstart zoomend movestart moveend', function() {
      window._storedPaddedBounds = null;
    });
  }
  if(window._storedPaddedBounds) return window._storedPaddedBounds;
  var p = window.map.getBounds().pad(VIEWPORT_PAD_RATIO);
  window._storedPaddedBounds = p;
  return p;
}




// SETUP /////////////////////////////////////////////////////////////
// these functions set up specific areas after the boot function
// created a basic framework. All of these functions should only ever
// be run once.

window.setupLargeImagePreview = function() {
  $('#portaldetails').on('click', '.imgpreview img', function() {
    var ex = $('#largepreview');
    if(ex.length > 0) {
      ex.remove();
      return;
    }
    var img = $(this).parent().html();
    var w = $(this)[0].naturalWidth/2;
    var h = $(this)[0].naturalHeight/2;
    var c = $('#portaldetails').attr('class');
    $('body').append(
      '<div id="largepreview" class="'+c+'" style="margin-left: '+(-SIDEBAR_WIDTH/2-w-2)+'px; margin-top: '+(-h-2)+'px">' + img + '</div>'
    );
    $('#largepreview').click(function() { $(this).remove() });
    $('#largepreview img').attr('title', '');
  });
}

window.setupStyles = function() {
  $('head').append('<style>' +
    [ '#largepreview.res img { border:2px solid '+COLORS[TEAM_RES]+'; } ',
      '#largepreview.enl img { border:2px solid '+COLORS[TEAM_ENL]+'; } ',
      '#largepreview.none img { border:2px solid '+COLORS[TEAM_NONE]+'; } ',
      '#chatcontrols { bottom: '+(CHAT_SHRINKED+4)+'px; }',
      '#chat { height: '+CHAT_SHRINKED+'px; } ',
      '#updatestatus { width:'+(SIDEBAR_WIDTH-2*4)+'px;  } ',
      '#sidebar, #gamestat, #gamestat span, input, ',
      '.imgpreview img { width:'+SIDEBAR_WIDTH+'px;  }'].join("\n")
    + '</style>');
}

window.setupMap = function() {
  $('#map').text('');

  var osmOpt = {attribution: 'Map data © OpenStreetMap contributors', maxZoom: 18};
  var osm = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', osmOpt);

  var cmOpt = {attribution: 'Map data © OpenStreetMap contributors, Imagery © CloudMade', maxZoom: 18};
  var cmMin = new L.TileLayer('http://{s}.tile.cloudmade.com/654cef5fd49a432ab81267e200ecc502/22677/256/{z}/{x}/{y}.png', cmOpt);
  var cmMid = new L.TileLayer('http://{s}.tile.cloudmade.com/654cef5fd49a432ab81267e200ecc502/999/256/{z}/{x}/{y}.png', cmOpt);

  var views = [cmMid, cmMin, osm, new L.Google('INGRESS'), new L.Google('ROADMAP'),
               new L.Google('SATELLITE'), new L.Google('HYBRID')];

  portalsLayer = L.layerGroup([]);
  linksLayer = L.layerGroup([]);
  fieldsLayer = L.layerGroup([]);
  window.map = new L.Map('map', $.extend(getPosition(), {zoomControl: false}));
  try {
    map.addLayer(views[readCookie('ingress.intelmap.type')]);
  } catch(e) { map.addLayer(views[0]); }
  map.addLayer(portalsLayer);
  map.addLayer(fieldsLayer, true);
  map.addLayer(linksLayer, true);
  map.addControl(new L.Control.Layers({
    'OSM Cloudmade Midnight': views[0],
    'OSM Cloudmade Minimal': views[1],
    'OSM Mapnik': views[2],
    'Google Roads Ingress Style': views[3],
    'Google Roads':  views[4],
    'Google Satellite':  views[5],
    'Google Hybrid':  views[6]
    }, {
    'Portals': portalsLayer,
    'Links': linksLayer,
    'Fields': fieldsLayer
    }));
  map.attributionControl.setPrefix('');
  // listen for changes and store them in cookies
  map.on('moveend', window.storeMapPosition);
  map.on('zoomend', window.storeMapPosition);
  $("[name='leaflet-base-layers']").change(function () {
    writeCookie('ingress.intelmap.type', $(this).parent().index());
  });

  // map update status handling
  map.on('zoomstart', function() { window.mapRunsUserAction = true });
  map.on('movestart', function() { window.mapRunsUserAction = true });
  map.on('zoomend', function() { window.mapRunsUserAction = false });
  map.on('moveend', function() { window.mapRunsUserAction = false });


  // update map hooks
  map.on('zoomstart', window.requests.abort);
  map.on('zoomend', function() { window.startRefreshTimeout(500) });
  map.on('movestart', window.requests.abort );
  map.on('moveend', function() { window.startRefreshTimeout(500) });

  // run once on init
  window.requestData();
  window.startRefreshTimeout();
};

// renders player details into the website. Since the player info is
// included as inline script in the original site, the data is static
// and cannot be updated.
window.setupPlayerStat = function() {
  var level;
  var ap = parseInt(PLAYER.ap);
  for(level = 0; level < 7; level++) {
    if(ap < MIN_AP_FOR_LEVEL[level]) break;
  }

  var thisLvlAp = MIN_AP_FOR_LEVEL[level-1];
  var nextLvlAp = MIN_AP_FOR_LEVEL[level] || ap;
  var lvlUpAp = digits(nextLvlAp-ap);
  var lvlApProg = Math.round((ap-thisLvlAp)/(nextLvlAp-thisLvlAp)*100);


  var xmMax = MAX_XM_PER_LEVEL[level];
  var xmRatio = Math.round(PLAYER.energy/xmMax*100);

  var cls = PLAYER.team === 'ALIENS' ? 'enl' : 'res';


  var t = 'Level:\t\t' + level + '\n'
        + 'XM:\t\t\t' + PLAYER.energy + ' / ' + xmMax + '\n'
        + 'AP:\t\t\t' + digits(ap) + '\n'
        + (level < 8 ? 'level up in:\t' + lvlUpAp + ' AP' : 'Congrats! (neeeeerd)')
        + '\n\Invites:\t\t'+PLAYER.available_invites;
        + '\n\nNote: your player stats can only be updated by a full reload (F5)';

  $('#playerstat').html(''
    + '<h2 title="'+t+'">'+level+'&nbsp;'
    + '<span class="'+cls+'">'+PLAYER.nickname+'</span>'
    + '<div>'
    + '<sup>XM: '+xmRatio+'%</sup>'
    + '<sub>' + (level < 8 ? 'level: '+lvlApProg+'%' : 'max level') + '</sub>'
    + '</div>'
    + '</h2>'
  );
}


// BOOTING ///////////////////////////////////////////////////////////

function boot() {
  console.log('loading done, booting');
  window.setupStyles();
  window.setupMap();
  window.setupGeosearch();
  window.setupRedeem();
  window.setupLargeImagePreview();
  window.updateGameScore();
  window.setupPlayerStat();
  window.setupChat();
  // read here ONCE, so the URL is only evaluated one time after the
  // necessary data has been loaded.
  urlPortal = getURLParam('pguid');

  $('#sidebar').show();
}

// this is the minified load.js script that allows us to easily load
// further javascript files async as well as in order.
// https://github.com/chriso/load.js
// Copyright (c) 2010 Chris O'Hara <cohara87@gmail.com>. MIT Licensed
function asyncLoadScript(a){return function(b,c){var d=document.createElement("script");d.type="text/javascript",d.src=a,d.onload=b,d.onerror=c,d.onreadystatechange=function(){var a=this.readyState;if(a==="loaded"||a==="complete")d.onreadystatechange=null,b()},head.insertBefore(d,head.firstChild)}}(function(a){a=a||{};var b={},c,d;c=function(a,d,e){var f=a.halt=!1;a.error=function(a){throw a},a.next=function(c){c&&(f=!1);if(!a.halt&&d&&d.length){var e=d.shift(),g=e.shift();f=!0;try{b[g].apply(a,[e,e.length,g])}catch(h){a.error(h)}}return a};for(var g in b){if(typeof a[g]=="function")continue;(function(e){a[e]=function(){var g=Array.prototype.slice.call(arguments);if(e==="onError"){if(d)return b.onError.apply(a,[g,g.length]),a;var h={};return b.onError.apply(h,[g,g.length]),c(h,null,"onError")}return g.unshift(e),d?(a.then=a[e],d.push(g),f?a:a.next()):c({},[g],e)}})(g)}return e&&(a.then=a[e]),a.call=function(b,c){c.unshift(b),d.unshift(c),a.next(!0)},a.next()},d=a.addMethod=function(d){var e=Array.prototype.slice.call(arguments),f=e.pop();for(var g=0,h=e.length;g<h;g++)typeof e[g]=="string"&&(b[e[g]]=f);--h||(b["then"+d.substr(0,1).toUpperCase()+d.substr(1)]=f),c(a)},d("chain",function(a){var b=this,c=function(){if(!b.halt){if(!a.length)return b.next(!0);try{null!=a.shift().call(b,c,b.error)&&c()}catch(d){b.error(d)}}};c()}),d("run",function(a,b){var c=this,d=function(){c.halt||--b||c.next(!0)},e=function(a){c.error(a)};for(var f=0,g=b;!c.halt&&f<g;f++)null!=a[f].call(c,d,e)&&d()}),d("defer",function(a){var b=this;setTimeout(function(){b.next(!0)},a.shift())}),d("onError",function(a,b){var c=this;this.error=function(d){c.halt=!0;for(var e=0;e<b;e++)a[e].call(c,d)}})})(this);var head=document.getElementsByTagName("head")[0]||document.documentElement;addMethod("load",function(a,b){for(var c=[],d=0;d<b;d++)(function(b){c.push(asyncLoadScript(a[b]))})(d);this.call("run",c)})


// modified version of https://github.com/shramov/leaflet-plugins. Also
// contains the default Ingress map style.
var LLGMAPS = 'http://breunigs.github.com/ingress-intel-total-conversion/leaflet_google.js';
var JQUERY = 'https://ajax.googleapis.com/ajax/libs/jquery/1.9.0/jquery.min.js';
var LEAFLET = 'http://cdn.leafletjs.com/leaflet-0.5/leaflet.js';

// after all scripts have loaded, boot the actual app
load(JQUERY, LEAFLET).then(LLGMAPS).thenRun(boot);


window.chat = function() {}

window.getOldestTimestampChat = function(public) {
  if(public) {
    var a = $('#chatpublic time:first').data('timestamp');
    var b = $('#chatbot time:first').data('timestamp');
    if(a && b) return Math.min(a, b);
    return a || b || -1;
  } else {
    return $('#chatfaction time').first().data('timestamp') || -1;
  }
}

window.getNewestTimestampChat = function(public) {
  if(public) {
    var a = $('#chatpublic time:last').data('timestamp');
    var b = $('#chatbot time:last').data('timestamp');
    if(a && b) return Math.max(a, b);
    return a || b || -1;
  } else {
    return $('#chatfaction time').last().data('timestamp') || -1;
  }
}

window.getPostDataForChat = function(public, getOlderMsgs) {
  if(typeof public !== 'boolean') throw('Need to know if public or faction chat.');

  var b = map.getBounds();
  var ne = b.getNorthEast();
  var sw = b.getSouthWest();

  var data = {
    desiredNumItems: 10,
    minLatE6: Math.round(sw.lat*1E6),
    minLngE6: Math.round(sw.lng*1E6),
    maxLatE6: Math.round(ne.lat*1E6),
    maxLngE6: Math.round(ne.lng*1E6),
    minTimestampMs: -1,
    maxTimestampMs: -1,
    factionOnly: !public
  }

  if(getOlderMsgs) {
    // ask for older chat when scrolling up
    data = $.extend(data, {maxTimestampMs: getOldestTimestampChat(public)});
  } else {
    // ask for newer chat
    $.extend(data, {minTimestampMs: getNewestTimestampChat(public)});
  }
  return data;
}

window.requestFactionChat  = function(getOlderMsgs) {
  if(window.idleTime >= MAX_IDLE_TIME) {
    console.log('user has been idle for ' + idleTime + ' minutes. Skipping faction chat.');
    renderUpdateStatus();
    return;
  }

  data = getPostDataForChat(false, false);
  window.requests.add(window.postAjax('getPaginatedPlextsV2', data, window.handleFactionChat));
}

window.renderChatMsg = function(msg, nick, time, team) {
  var ta = unixTimeToHHmm(time);
  var tb = unixTimeToString(time, true);
  var t = '<time title="'+tb+'" data-timestamp="'+time+'">'+ta+'</time>';
  var s = 'style="color:'+COLORS[team]+'"';
  return '<p>'+t+'<mark '+s+'>'+nick+'</mark><span>'+msg+'</span></p>';
}

window.handleFactionChat = function(data, textStatus, jqXHR) {
  var appMsg = '';
  var first = null;
  var last;
  $.each(data.result.reverse(), function(ind, chat) {
    var time = chat[1];
    var msg = chat[2].plext.markup[2][1].plain;
    var team = chat[2].plext.team === 'ALIENS' ? TEAM_ENL : TEAM_RES;
    var nick = chat[2].plext.markup[1][1].plain.slice(0, -2); // cut “: ” at end
    var guid = chat[2].plext.markup[1][1].guid;
    window.setPlayerName(guid, nick); // free nick name resolves

    if(!first) first = time;
    last = time;
    appMsg += renderChatMsg(msg, nick, time, team);
  });

  $('#chatfaction').html(appMsg);
}

window.toggleChat = function() {
  var c = $('#chat');
  var cc = $('#chatcontrols');
  if(c.data('toggle')) {
    $('#chatcontrols a:first').text('expand');
    c.css('height', CHAT_SHRINKED+'px');
    c.css('top', 'auto');
    c.data('toggle', false);
    cc.css('top', 'auto');
    cc.css('bottom', (CHAT_SHRINKED+4)+'px');
  } else {
    $('#chatcontrols a:first').text('shrink');
    c.css('height', 'auto');
    c.css('top', '25px');
    c.data('toggle', true);
    cc.css('top', '0');
    cc.css('bottom', 'auto');
  }
}


window.setupChat = function() {
  $('#chatcontrols a').first().click(window.toggleChat);
  requestFactionChat();
}



// PORTAL DETAILS DISPLAY ////////////////////////////////////////////
// hand any of these functions the details-hash of a portal, and they
// will return pretty, displayable HTML or parts thereof.

// returns displayable text+link about portal range
window.getRangeText = function(d) {
  var range = getPortalRange(d);
  return 'range: '
    + '<a onclick="window.rangeLinkClick()">'
    + (range > 1000
      ? Math.round(range/1000) + ' km'
      : Math.round(range)      + ' m')
    + '</a>';
}

// generates description text from details for portal
window.getPortalDescriptionFromDetails = function(details) {
  var descObj = details.portalV2.descriptiveText;
  // FIXME: also get real description?
  var desc = descObj.TITLE + '\n' + descObj.ADDRESS;
  if(descObj.ATTRIBUTION)
    desc += '\nby '+descObj.ATTRIBUTION+' ('+descObj.ATTRIBUTION_LINK+')';
  return desc;
}


// given portal details, returns html code to display mod details.
window.getModDetails = function(d) {
  var mods = [];
  var modsTitle = [];
  $.each(d.portalV2.linkedModArray, function(ind, mod) {
    if(!mod) {
      mods.push('');
      modsTitle.push('');
    } else if(mod.type === 'RES_SHIELD') {
      mods.push(mod.rarity + ' ' + mod.displayName);
      modsTitle.push(mod.rarity + ' ' + mod.displayName + '\ninstalled by: '+getPlayerName(mod.installingUser));
    } else {
      mods.push(mod.type);
      modsTitle.push('Unknown mod. No further details available.');
    }
  });

  var t = '<span title="'+modsTitle[0]+'">'+mods[0]+'</span>'
        + '<span title="'+modsTitle[1]+'">'+mods[1]+'</span>'
        + '<span title="'+modsTitle[2]+'">'+mods[2]+'</span>'
        + '<span title="'+modsTitle[3]+'">'+mods[3]+'</span>'

  return t;
}

window.getEnergyText = function(d) {
  var nrg = getPortalEnergy(d);
  return 'energy: ' + (nrg > 1000 ? Math.round(nrg/1000) +' k': nrg);
}

window.getAvgResoDistText = function(d) {
  var avgDist = Math.round(10*getAvgResoDist(d))/10;
  return '⌀ res dist: ' + avgDist + ' m';
}

window.getReportIssueInfoText = function(d) {
  return ('Your Nick: '+PLAYER.nickname+'        '
    + 'Portal: '+d.portalV2.descriptiveText.TITLE+'        '
    + 'Location: '+d.portalV2.descriptiveText.ADDRESS
    +' (lat '+(d.locationE6.latE6/1E6)+'; lng '+(d.locationE6.latE6/1E6)+')'
  ).replace(/['"]/, '');
}

window.getResonatorDetails = function(d) {
  console.log('rendering reso details');
  var resoDetails = '';
  var slotsFilled = 0;
  $.each(d.resonatorArray.resonators, function(ind, reso) {
    if(!reso) {
      resoDetails += renderResonatorDetails(slotsFilled++, 0);
      return true;
    }

    var l = parseInt(reso.level);
    var v = parseInt(reso.energyTotal);
    var nick = window.getPlayerName(reso.ownerGuid);
    var dist = reso.distanceToPortal;

    slotsFilled++;
    resoDetails += renderResonatorDetails(parseInt(reso.slot), l, v, dist, nick);
  });
  return resoDetails;
}

// helper function that renders the HTML for a given resonator. Does
// not work with raw details-hash. Needs digested infos instead:
// slot: which slot this resonator occupies. Starts with 0 (east) and
// rotates clockwise. So, last one is 7 (southeast).
window.renderResonatorDetails = function(slot, level, nrg, dist, nick) {
  if(level == 0) {
    var meter = '<span class="meter" style="cursor:auto"></span>';
  } else {
    var max = RESO_NRG[level];
    var fillGrade = nrg/max*100;

    var inf = 'energy:\t\t' + nrg   + ' / ' + max + '\n'
            + 'level:\t\t'  + level +'\n'
            + 'distance:\t' + dist  + 'm\n'
            + 'owner:\t\t'  + nick  + '\n'
            + 'cardinal:\t' + SLOT_TO_CARDINAL[slot];

    var style = 'width:'+fillGrade+'%; background:'+COLORS_LVL[level]+'; color:'+COLORS_LVL[level];
    var fill  = '<span style="'+style+'"></span>';
    var meter = '<span class="meter" title="'+inf+'">'
                  + fill + '</span>';
  }
  var cls = slot <= 3 ? 'left' : 'right';
  var text = '<span class="meter-text '+cls+'">'+(nick||'')+'</span>';
  return (slot <= 3 ? text+meter : meter+text) + '<br/>';
}



// GAME STATUS ///////////////////////////////////////////////////////
// MindUnit display
window.updateGameScore = function(data) {
  if(!data) {
    window.postAjax('getGameScore', {}, window.updateGameScore);
    return;
  }

  var r = parseInt(data.result.resistanceScore), e = parseInt(data.result.alienScore);
  var s = r+e;
  var rp = r/s*100, ep = e/s*100;
  r = digits(r), e = digits(e);
  var rs = '<span class="res" style="width:'+rp+'%;">'+Math.round(rp)+'%&nbsp;</span>';
  var es = '<span class="enl" style="width:'+ep+'%;">&nbsp;'+Math.round(ep)+'%</span>';
  $('#gamestat').html(rs+es).one('click', function() { window.updateGameScore() });
  $('#gamestat').attr('title', 'Resistance:\t\t'+r+' MindUnits\nEnlightenment:\t'+e+' MindUnits');

  window.setTimeout('window.updateGameScore', REFRESH_GAME_SCORE*1000);
}




// MAP DATA REQUEST CALCULATORS //////////////////////////////////////
// Ingress Intel splits up requests for map data (portals, links,
// fields) into tiles. To get data for the current viewport (i.e. what
// is currently visible) it first calculates which tiles intersect.
// For all those tiles, it then calculates the lat/lng bounds of that
// tile and a quadkey. Both the bounds and the quadkey are “somewhat”
// required to get complete data. No idea how the projection between
// lat/lng and tiles works.
// What follows now are functions that allow conversion between tiles
// and lat/lng as well as calculating the quad key. The variable names
// may be misleading.
// The minified source for this code was in gen_dashboard.js after the
// “// input 89” line (alternatively: the class was called “Xe”).

window.convertCenterLat = function(centerLat) {
  return Math.round(256 * 0.9999 * Math.abs(1 / Math.cos(centerLat * DEG2RAD)));
}

window.calculateR = function(convCenterLat) {
  return 1 << window.map.getZoom() - (convCenterLat / 256 - 1);
}

window.convertLatLngToPoint = function(latlng, magic, R) {
  var x = (magic/2 + latlng.lng * magic / 360)*R;
  var l = Math.sin(latlng.lat * DEG2RAD);
  var y =  (magic/2 + 0.5*Math.log((1+l)/(1-l)) * -(magic / (2*Math.PI)))*R;
  return {x: Math.floor(x/magic), y: Math.floor(y/magic)};
}

window.convertPointToLatLng = function(x, y, magic, R) {
  var e = {};
  e.sw = {
    // orig function put together from all over the place
    // lat: (2 * Math.atan(Math.exp((((y + 1) * magic / R) - (magic/ 2)) / (-1*(magic / (2 * Math.PI))))) - Math.PI / 2) / (Math.PI / 180),
    // shortened version by your favorite algebra program.
    lat: (360*Math.atan(Math.exp(Math.PI - 2*Math.PI*(y+1)/R)))/Math.PI - 90,
    lng: 360*x/R-180
  };
  e.ne = {
    //lat: (2 * Math.atan(Math.exp(((y * magic / R) - (magic/ 2)) / (-1*(magic / (2 * Math.PI))))) - Math.PI / 2) / (Math.PI / 180),
    lat: (360*Math.atan(Math.exp(Math.PI - 2*Math.PI*y/R)))/Math.PI - 90,
    lng: 360*(x+1)/R-180
  };
  return e;
}

// calculates the quad key for a given point. The point is not(!) in
// lat/lng format.
window.pointToQuadKey = function(x, y) {
  var quadkey = [];
  for(var c = window.map.getZoom(); c > 0; c--) {
    //  +-------+   quadrants are probably ordered like this
    //  | 0 | 1 |
    //  |---|---|
    //  | 2 | 3 |
    //  |---|---|
    var quadrant = 0;
    var e = 1 << c - 1;
    (x & e) != 0 && quadrant++;               // push right
    (y & e) != 0 && (quadrant++, quadrant++); // push down
    quadkey.push(quadrant);
  }
  return quadkey.join("");
}

// given quadkey and bounds, returns the format as required by the
// Ingress API to request map data.
window.generateBoundsParams = function(quadkey, bounds) {
  return {
    id: quadkey,
    qk: quadkey,
    minLatE6: Math.round(bounds.sw.lat * 1E6),
    minLngE6: Math.round(bounds.sw.lng * 1E6),
    maxLatE6: Math.round(bounds.ne.lat * 1E6),
    maxLngE6: Math.round(bounds.ne.lng * 1E6)
  };
}




// ENTITY DETAILS TOOLS //////////////////////////////////////////////
// hand any of these functions the details-hash of an entity (i.e.
// portal, link, field) and they will return useful data.


// given the entity detail data, returns the team the entity belongs
// to. Uses TEAM_* enum values.
window.getTeam = function(details) {
  var team = TEAM_NONE;
  if(details.controllingTeam.team === 'ALIENS') team = TEAM_ENL;
  if(details.controllingTeam.team === 'RESISTANCE') team = TEAM_RES;
  return team;
}


// IDLE HANDLING /////////////////////////////////////////////////////

window.idleTime = 0; // in minutes

setInterval('window.idleTime += 1', 60*1000);
var idleReset = function (e) {
  // update immediately when the user comes back
  if(isIdle()) {
    window.idleTime = 0;
    window.requestData();
  }
  window.idleTime = 0;
};
$('body').mousemove(idleReset).keypress(idleReset);

window.isIdle = function() {
  return window.idleTime >= MAX_IDLE_TIME;
}



// LOCATION HANDLING /////////////////////////////////////////////////
// i.e. setting initial position and storing new position after moving

// retrieves current position from map and stores it cookies
window.storeMapPosition = function() {
  var m = window.map.getCenter();
  writeCookie('ingress.intelmap.lat', m['lat']);
  writeCookie('ingress.intelmap.lng', m['lng']);
  writeCookie('ingress.intelmap.zoom', window.map.getZoom());
}

// either retrieves the last shown position from a cookie, from the
// URL or if neither is present, via Geolocation. If that fails, it
// returns a map that shows the whole world.
window.getPosition = function() {
  if(getURLParam('latE6') && getURLParam('lngE6')) {
    console.log("mappos: reading URL params");
    var lat = parseInt(getURLParam('latE6'))/1E6 || 0.0;
    var lng = parseInt(getURLParam('lngE6'))/1E6 || 0.0;
    // google seems to zoom in far more than leaflet
    var z = parseInt(getURLParam('z'))+1 || 17;
    return {center: new L.LatLng(lat, lng), zoom: z > 18 ? 18 : z};
  }

  if(readCookie('ingress.intelmap.lat') && readCookie('ingress.intelmap.lng')) {
    console.log("mappos: reading cookies");
    var lat = parseFloat(readCookie('ingress.intelmap.lat')) || 0.0;
    var lng = parseFloat(readCookie('ingress.intelmap.lng')) || 0.0;
    var z = parseInt(readCookie('ingress.intelmap.zoom')) || 17;
    return {center: new L.LatLng(lat, lng), zoom: z > 18 ? 18 : z};
  }

  setTimeout("window.map.locate({setView : true, maxZoom: 13});", 50);

  return {center: new L.LatLng(0.0, 0.0), zoom: 1};
}



// PORTAL DETAILS MAIN ///////////////////////////////////////////////
// main code block that renders the portal details in the sidebar and
// methods that highlight the portal in the map view.

window.renderPortalDetails = function(guid) {
  var update = selectPortal(guid);
  var d = portalsDetail[guid];

  // collect some random data that’s not worth to put in an own method
  var links = {incoming: 0, outgoing: 0};
  if(d.portalV2.linkedEdges) $.each(d.portalV2.linkedEdges, function(ind, link) {
    links[link.isOrigin ? 'outgoing' : 'incoming']++;
  });
  var linksText = 'links: ↳ ' + links.incoming+'&nbsp;&nbsp;•&nbsp;&nbsp;'+links.outgoing+' ↴';

  var player = d.captured && d.captured.capturingPlayerId
    ? getPlayerName(d.captured.capturingPlayerId)
    : null;
  var playerText = player ? 'owner: ' + player : null;

  var time = d.captured ? unixTimeToString(d.captured.capturedTime) : null;
  var sinceText  = time ? 'since: ' + time : null;

  // collect and html-ify random data
  var randDetails = [playerText, sinceText, getRangeText(d), getEnergyText(d), linksText, getAvgResoDistText(d)];
  randDetails = randDetails.map(function(e) {
    if(!e) return '';
    e = e.split(':');
    e = '<aside>'+e.shift()+'<span>'+e.join(':')+'</span></aside>';
    return e;
  }).join('\n');

  // replacing causes flicker, so if the selected portal does not
  // change, only update the data points that are likely to change.
  if(update) {
    console.log('Updating portal details');
    $('#level').text(Math.floor(getPortalLevel(d)));
    $('.mods').html(getModDetails(d));
    $('#randdetails').html(randDetails);
    $('#resodetails').html(getResonatorDetails(d));
    $('#portaldetails').attr('class', TEAM_TO_CSS[getTeam(d)]);
  } else {
    console.log('exchanging portal details');
    setPortalIndicators(d);
    var img = d.imageByUrl && d.imageByUrl.imageUrl ? d.imageByUrl.imageUrl : DEFAULT_PORTAL_IMG;

    var lat = d.locationE6.latE6;
    var lng = d.locationE6.lngE6;
    var perma = 'http://ingress.com/intel?latE6='+lat+'&lngE6='+lng+'&z=17&pguid='+guid;

    $('#portaldetails')
      .attr('class', TEAM_TO_CSS[getTeam(d)])
      .html(''
        + '<h3>'+d.portalV2.descriptiveText.TITLE+'</h3>'
        + '<div class="imgpreview"><img src="'+img+'" title="'+getPortalDescriptionFromDetails(d)+'\n\nClick to show full image."/></div>'
        + '<span id="level">'+Math.floor(getPortalLevel(d))+'</span>'
        + '<div class="mods">'+getModDetails(d)+'</div>'
        + '<div id="randdetails">'+randDetails+'</div>'
        + '<div id="resodetails">'+getResonatorDetails(d)+'</div>'
        + '<div class="linkdetails">'
        + '<aside><a href="'+perma+'">portal link</a></aside>'
        + '<aside><a onclick="window.reportPortalIssue(\''+getReportIssueInfoText(d)+'\')">report issue</a></aside>'
        + '</div>'
      );
  }

  // try to resolve names that were required for above functions, but
  // weren’t available yet.
  resolvePlayerNames();
}

// draws link-range and hack-range circles around the portal with the
// given details.
window.setPortalIndicators = function(d) {
  if(portalRangeIndicator) map.removeLayer(portalRangeIndicator);
  var range = getPortalRange(d);
  var coord = [d.locationE6.latE6/1E6, d.locationE6.lngE6/1E6];
  portalRangeIndicator = (range > 0
      ? L.circle(coord, range, { fill: false, color: RANGE_INDICATOR_COLOR, weight: 3, clickable: false })
      : L.circle(coord, range, { fill: false, stroke: false, clickable: false })
    ).addTo(map);
  if(!portalAccessIndicator)
    portalAccessIndicator = L.circle(coord, HACK_RANGE,
      { fill: false, color: ACCESS_INDICATOR_COLOR, weight: 2, clickable: false }
    ).addTo(map);
  else
    portalAccessIndicator.setLatLng(coord);

}

// highlights portal with given GUID. Automatically clears highlights
// on old selection. Returns false if the selected portal changed.
// Returns true if it’s still the same portal that just needs an
// update.
window.selectPortal = function(guid) {
  var update = selectedPortal === guid;
  var oldPortal = portals[selectedPortal];
  if(!update && oldPortal)
    oldPortal.setStyle({color: oldPortal.options.fillColor});

  selectedPortal = guid;

  if(portals[guid])
    portals[guid].bringToFront().setStyle({color: COLOR_SELECTED_PORTAL});

  return update;
}




// REDEEMING /////////////////////////////////////////////////////////

window.handleRedeemResponse = function(data, textStatus, jqXHR) {
  if(data.error) {
    alert('Couldn’t redeem code. It may be used up, invalid or you have redeemed it already. (Code: '+data.error+')');
    return;
  }

  var text = 'Success! However, pretty display is not implemented.\nMaybe you can make sense of the following:\n';
  alert(text + JSON.stringify(data));
}

window.setupRedeem = function() {
  $("#redeem").keypress(function(e) {
    if((e.keyCode ? e.keyCode : e.which) != 13) return;
    var data = {passcode: $(this).val()};
    window.postAjax('redeemReward', data, window.handleRedeemResponse,
      function() { alert('HTTP request failed. Maybe try again?'); });
  });
}


// PLAYER NAMES //////////////////////////////////////////////////////
// Player names are cached in local storage forever. There is no GUI
// element from within the total conversion to clean them, but you
// can run localStorage.clean() to reset it.


// retrieves player name by GUID. If the name is not yet available, it
// will be added to a global list of GUIDs that need to be resolved.
// The resolve method is not called automatically.
window.getPlayerName = function(guid) {
  if(localStorage[guid]) return localStorage[guid];
  // only add to queue if it isn’t already
  if(playersToResolve.indexOf(guid) === -1 && playersInResolving.indexOf(guid) === -1) {
    console.log('resolving player guid=' + guid);
    playersToResolve.push(guid);
  }
  return '{'+guid.slice(0, 12)+'}';
}

// resolves all player GUIDs that have been added to the list. Reruns
// renderPortalDetails when finished, so that then-unresolved names
// get replaced by their correct versions.
window.resolvePlayerNames = function() {
  if(window.playersToResolve.length === 0) return;
  var p = window.playersToResolve;
  var d = {guids: p};
  playersInResolving = window.playersInResolving.concat(p);
  playersToResolve = [];
  postAjax('getPlayersByGuids', d, function(dat) {
    $.each(dat.result, function(ind, player) {
      window.setPlayerName(player.guid, player.nickname);
      // remove from array
      window.playersInResolving.splice(window.playersInResolving.indexOf(player.guid), 1);
    });
    if(window.selectedPortal)
      window.renderPortalDetails(window.selectedPortal);
  },
  function() {
    // append failed resolves to the list again
    console.warn('resolving player guids failed: ' + p.join(', '));
    window.playersToResolve.concat(p);
  });
}


window.setPlayerName = function(guid, nick) {
  localStorage[guid] = nick;
}



// DEBUGGING TOOLS ///////////////////////////////////////////////////
// meant to be used from browser debugger tools and the like.

window.debug = function() {}

window.debug.renderDetails = function() {
  console.log('portals: ' + Object.keys(portals).length);
  console.log('links:   ' + Object.keys(links).length);
  console.log('fields:  ' + Object.keys(fields).length);
}

window.debug.printStackTrace = function() {
  var e = new Error('dummy');
  console.log(e.stack);
}

window.debug.clearPortals = function() {
  portalsLayer.clearLayers();
}

window.debug.clearLinks = function() {
  linksLayer.clearLayers();
}

window.debug.clearFields = function() {
  fieldsLayer.clearLayers();
}

window.debug.getFields = function() {
  return fields;
}

window.debug.forceSync = function() {
  localStorage.clear();
  window.playersToResolve = [];
  window.playersInResolving = [];
  debug.clearFields();
  debug.clearLinks();
  debug.clearPortals();
  updateGameScore();
  requestData();
}



// GEOSEARCH /////////////////////////////////////////////////////////

window.setupGeosearch = function() {
  $('#geosearch').keypress(function(e) {
    if((e.keyCode ? e.keyCode : e.which) != 13) return;
    $.getJSON(NOMINATIM + escape($(this).val()), function(data) {
      if(!data || !data[0]) return;
      var b = data[0].boundingbox;
      if(!b) return;
      var southWest = new L.LatLng(b[0], b[2]),
          northEast = new L.LatLng(b[1], b[3]),
          bounds = new L.LatLngBounds(southWest, northEast);
      window.map.fitBounds(bounds);
    });
    e.preventDefault();
  });
}




// PORTAL DETAILS TOOLS //////////////////////////////////////////////
// hand any of these functions the details-hash of a portal, and they
// will return useful, but raw data.

// returns a float. Displayed portal level is always rounded down from
// that value.
window.getPortalLevel = function(d) {
  var lvl = 0;
  $.each(d.resonatorArray.resonators, function(ind, reso) {
    if(!reso) return true;
    lvl += parseInt(reso.level);
  });
  return lvl/8;
}

window.getPortalEnergy = function(d) {
  var nrg = 0;
  $.each(d.resonatorArray.resonators, function(ind, reso) {
    if(!reso) return true;
    nrg += parseInt(reso.energyTotal);
  });
  return nrg;
}

window.getPortalRange = function(d) {
  // formula by the great gals and guys at
  // http://decodeingress.me/2012/11/18/ingress-portal-levels-and-link-range/
  return 160*Math.pow(getPortalLevel(d), 4);
}

window.getAvgResoDist = function(d) {
  var sum = 0, resos = 0;
  $.each(d.resonatorArray.resonators, function(ind, reso) {
    if(!reso) return true;
    sum += parseInt(reso.distanceToPortal);
    resos++;
  });
  return sum/resos;
}





} // end of wrapper

// inject code into site context
var script = document.createElement('script');
script.appendChild(document.createTextNode('('+ wrapper +')();'));
(document.body || document.head || document.documentElement).appendChild(script);
