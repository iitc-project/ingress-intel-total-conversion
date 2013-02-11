

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
    [ 'body:after { display: none } ',
      '#largepreview.enl img { border:2px solid '+COLORS[TEAM_ENL]+'; } ',
      '#largepreview.res img { border:2px solid '+COLORS[TEAM_RES]+'; } ',
      '#largepreview.none img { border:2px solid '+COLORS[TEAM_NONE]+'; } ',
      '#chatcontrols { bottom: '+(CHAT_SHRINKED+24)+'px; }',
      '#chat { height: '+CHAT_SHRINKED+'px; } ',
      '.leaflet-right { margin-right: '+(SIDEBAR_WIDTH+1)+'px } ',
      '#updatestatus { width:'+(SIDEBAR_WIDTH-2*4+1)+'px;  } ',
      '#sidebar { width:'+(SIDEBAR_WIDTH + HIDDEN_SCROLLBAR_ASSUMED_WIDTH + 1 /*border*/)+'px;  } ',
      '#sidebartoggle { right:'+SIDEBAR_WIDTH+'px;  } ',
      '#scrollwrapper  { width:'+(SIDEBAR_WIDTH + 2*HIDDEN_SCROLLBAR_ASSUMED_WIDTH)+'px; right:-'+(2*HIDDEN_SCROLLBAR_ASSUMED_WIDTH-2)+'px } ',
      '#sidebar input, h2  { width:'+(SIDEBAR_WIDTH - 2*4)+'px !important } ',
      '#sidebar > *, #gamestat span, .imgpreview img { width:'+SIDEBAR_WIDTH+'px;  }'].join("\n")
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


  window.map = new L.Map('map', $.extend(getPosition(),
    {zoomControl: !(localStorage['iitc.zoom.buttons'] === 'false')}
  ));

  try {
    map.addLayer(views[readCookie('ingress.intelmap.type')]);
  } catch(e) { map.addLayer(views[0]); }

  var addLayers = {};

  portalsLayers = [];
  for(var i = 0; i <= 8; i++) {
    portalsLayers[i] = L.layerGroup([]);
    map.addLayer(portalsLayers[i]);
    var t = (i === 0 ? 'Unclaimed' : 'Level ' + i) + ' Portals';
    addLayers[t] = portalsLayers[i];
  }

  fieldsLayer = L.layerGroup([]);
  map.addLayer(fieldsLayer, true);
  addLayers['Fields'] = fieldsLayer;

  linksLayer = L.layerGroup([]);
  map.addLayer(linksLayer, true);
  addLayers['Links'] = linksLayer;

  map.addControl(new L.Control.Layers({
    'OSM Cloudmade Midnight': views[0],
    'OSM Cloudmade Minimal': views[1],
    'OSM Mapnik': views[2],
    'Google Roads Ingress Style': views[3],
    'Google Roads':  views[4],
    'Google Satellite':  views[5],
    'Google Hybrid':  views[6]
    }, addLayers));
  map.attributionControl.setPrefix('');
  // listen for changes and store them in cookies
  map.on('moveend', window.storeMapPosition);
  map.on('zoomend', function() {
    window.storeMapPosition;

    // remove all resonators if zoom out to < RESONATOR_DISPLAY_ZOOM_LEVEL
    if(isResonatorsShow()) return;
    for(var i = 1; i < portalsLayers.length; i++) {
      portalsLayers[i].eachLayer(function(item) {
        var itemGuid = item.options.guid;
        // check if 'item' is a resonator
        if(getTypeByGuid(itemGuid) != TYPE_RESONATOR) return true;
        portalsLayers[i].removeLayer(item);
      });
    }

    console.log('Remove all resonators');
  });
  $("[name='leaflet-base-layers']").change(function () {
    writeCookie('ingress.intelmap.type', $(this).parent().index());
  });

  // map update status handling
  map.on('movestart zoomstart', function() { window.mapRunsUserAction = true });
  map.on('moveend zoomend', function() { window.mapRunsUserAction = false });

  // update map hooks
  map.on('movestart zoomstart', window.requests.abort);
  map.on('moveend zoomend', function() { window.startRefreshTimeout(500) });

  // run once on init
  window.requestData();
  window.startRefreshTimeout();

  window.addResumeFunction(window.requestData);
  window.requests.addRefreshFunction(window.requestData);
};

// renders player details into the website. Since the player info is
// included as inline script in the original site, the data is static
// and cannot be updated.
window.setupPlayerStat = function() {
  var level;
  var ap = parseInt(PLAYER.ap);
  for(level = 0; level < MIN_AP_FOR_LEVEL.length; level++) {
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

window.setupSidebarToggle = function() {
  $('#sidebartoggle').on('click', function() {
    var toggle = $('#sidebartoggle');
    var sidebar = $('#scrollwrapper');
    if(sidebar.is(':visible')) {
      sidebar.hide().css('z-index', 1);
      $('.leaflet-right').css('margin-right','0');
      toggle.html('<span class="toggle open"></span>');
      toggle.css('right', '0');
    } else {
      sidebar.css('z-index', 1001).show();
      $('.leaflet-right').css('margin-right', SIDEBAR_WIDTH+1+'px');
      toggle.html('<span class="toggle close"></span>');
      toggle.css('right', SIDEBAR_WIDTH+1+'px');
    }
  });
}


// BOOTING ///////////////////////////////////////////////////////////

function boot() {
  console.log('loading done, booting');
  window.setupStyles();
  window.setupMap();
  window.setupGeosearch();
  window.setupRedeem();
  window.setupLargeImagePreview();
  window.setupSidebarToggle();
  window.updateGameScore();
  window.setupPlayerStat();
  window.chat.setup();
  // read here ONCE, so the URL is only evaluated one time after the
  // necessary data has been loaded.
  urlPortal = getURLParam('pguid');

  // load only once
  var n = window.PLAYER['nickname'];
  window.PLAYER['nickMatcher'] = new RegExp('\\b('+n+')\\b', 'ig');

  $('#sidebar').show();

  if(window.bootPlugins)
    $.each(window.bootPlugins, function(ind, ref) { ref(); });

  window.iitcLoaded = true;
}

// this is the minified load.js script that allows us to easily load
// further javascript files async as well as in order.
// https://github.com/chriso/load.js
// Copyright (c) 2010 Chris O'Hara <cohara87@gmail.com>. MIT Licensed
function asyncLoadScript(a){return function(b,c){var d=document.createElement("script");d.type="text/javascript",d.src=a,d.onload=b,d.onerror=c,d.onreadystatechange=function(){var a=this.readyState;if(a==="loaded"||a==="complete")d.onreadystatechange=null,b()},head.insertBefore(d,head.firstChild)}}(function(a){a=a||{};var b={},c,d;c=function(a,d,e){var f=a.halt=!1;a.error=function(a){throw a},a.next=function(c){c&&(f=!1);if(!a.halt&&d&&d.length){var e=d.shift(),g=e.shift();f=!0;try{b[g].apply(a,[e,e.length,g])}catch(h){a.error(h)}}return a};for(var g in b){if(typeof a[g]=="function")continue;(function(e){a[e]=function(){var g=Array.prototype.slice.call(arguments);if(e==="onError"){if(d)return b.onError.apply(a,[g,g.length]),a;var h={};return b.onError.apply(h,[g,g.length]),c(h,null,"onError")}return g.unshift(e),d?(a.then=a[e],d.push(g),f?a:a.next()):c({},[g],e)}})(g)}return e&&(a.then=a[e]),a.call=function(b,c){c.unshift(b),d.unshift(c),a.next(!0)},a.next()},d=a.addMethod=function(d){var e=Array.prototype.slice.call(arguments),f=e.pop();for(var g=0,h=e.length;g<h;g++)typeof e[g]=="string"&&(b[e[g]]=f);--h||(b["then"+d.substr(0,1).toUpperCase()+d.substr(1)]=f),c(a)},d("chain",function(a){var b=this,c=function(){if(!b.halt){if(!a.length)return b.next(!0);try{null!=a.shift().call(b,c,b.error)&&c()}catch(d){b.error(d)}}};c()}),d("run",function(a,b){var c=this,d=function(){c.halt||--b||c.next(!0)},e=function(a){c.error(a)};for(var f=0,g=b;!c.halt&&f<g;f++)null!=a[f].call(c,d,e)&&d()}),d("defer",function(a){var b=this;setTimeout(function(){b.next(!0)},a.shift())}),d("onError",function(a,b){var c=this;this.error=function(d){c.halt=!0;for(var e=0;e<b;e++)a[e].call(c,d)}})})(this);var head=document.getElementsByTagName("head")[0]||document.documentElement;addMethod("load",function(a,b){for(var c=[],d=0;d<b;d++)(function(b){c.push(asyncLoadScript(a[b]))})(d);this.call("run",c)})


// modified version of https://github.com/shramov/leaflet-plugins. Also
// contains the default Ingress map style.
var LLGMAPS = 'http://breunigs.github.com/ingress-intel-total-conversion/dist/leaflet_google.js';
var JQUERY = 'https://ajax.googleapis.com/ajax/libs/jquery/1.9.0/jquery.min.js';
var LEAFLET = 'http://cdn.leafletjs.com/leaflet-0.5/leaflet.js';
var AUTOLINK = 'http://breunigs.github.com/ingress-intel-total-conversion/dist/autolink.js';

// after all scripts have loaded, boot the actual app
load(JQUERY, LEAFLET, AUTOLINK).then(LLGMAPS).onError(function (err) {
  alert('Could not all resources, the script likely won’t work.\n\nIf this happend the first time for you, it’s probably a temporary issue. Just wait a bit and try again.\n\nIf you installed the script for the first time and this happens:\n– try disabling NoScript if you have it installed\n– press CTRL+SHIFT+K in Firefox or CTRL+SHIFT+I in Chrome/Opera and reload the page. Additional info may be available in the console.\n– Open an issue at https://github.com/breunigs/ingress-intel-total-conversion/issues');
}).thenRun(boot);
