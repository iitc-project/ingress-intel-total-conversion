// ==UserScript==
// @id             ingress-intel-total-conversion@breunigs
// @name           intel map total conversion
// @version        0.3-@@BUILDDATE@@
// @namespace      https://github.com/breunigs/ingress-intel-total-conversion
// @updateURL      https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/total-conversion-build.user.js
// @downloadURL    https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/total-conversion-build.user.js
// @description    total conversion for the ingress intel map.
// @include        http://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
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
  //~ + '<link rel="stylesheet" type="text/css" href="http://0.0.0.0:8000/style.css"/>'
  + '<link rel="stylesheet" type="text/css" href="http://breunigs.github.com/ingress-intel-total-conversion/style.css?@@BUILDDATE@@"/>'
  + '<link rel="stylesheet" type="text/css" href="http://cdn.leafletjs.com/leaflet-0.5/leaflet.css"/>'
  + '<link rel="stylesheet" type="text/css" href="http://fonts.googleapis.com/css?family=Coda"/>';

document.getElementsByTagName('body')[0].innerHTML = ''
  + '<div id="map">Loading, please wait</div>'
  + '<div id="chatcontrols" style="display:none">'
  + '  <a>expand</a><a>automated</a><a>public</a><a class="active">faction</a>'
  + '</div>'
  + '<div id="chat" style="display:none">'
  + '  <div id="chatfaction"></div>'
  + '  <div id="chatpublic"></div>'
  + '  <div id="chatautomated"></div>'
  + '</div>'
  + '<form id="chatinput" style="display:none"><time></time><span>tell faction:</span><input type="text"/></form>'
  + '<div id="scrollwrapper">' // enable scrolling for small screens
  + '  <div id="sidebar" style="display: none">'
  + '    <div id="playerstat">t</div>'
  + '    <div id="gamestat">&nbsp;loading global control stats</div>'
  + '    <input id="geosearch" placeholder="Search location…" type="text"/>'
  + '    <div id="portaldetails"></div>'
  + '    <input id="redeem" placeholder="Redeem code…" type="text"/>'
  + '    <div id="updatestatus"></div>'
  + '  </div>';
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
var HIDDEN_SCROLLBAR_ASSUMED_WIDTH = 20;
var SIDEBAR_WIDTH = 300;
// chat messages are requested for the visible viewport. On high zoom
// levels this gets pretty pointless, so request messages in at least a
// X km radius.
var CHAT_MIN_RANGE = 6;
// this controls how far data is being drawn outside the viewport. Set
// it 0 to only draw entities that intersect the current view. A value
// of one will render an area twice the size of the viewport (or some-
// thing like that, Leaflet doc isn’t too specific). Setting it too low
// makes the missing data on move/zoom out more obvious. Setting it too
// high causes too many items to be drawn, making drag&drop sluggish.
var VIEWPORT_PAD_RATIO = 0.3;

// how many items to request each query
var CHAT_PUBLIC_ITEMS = 200
var CHAT_FACTION_ITEMS = 50

// Leaflet will get very slow for MANY items. It’s better to display
// only some instead of crashing the browser.
var MAX_DRAWN_PORTALS = 1000;
var MAX_DRAWN_LINKS = 400;
var MAX_DRAWN_FIELDS = 200;


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
var OCTANTS = ['E', 'NE', 'N', 'NW', 'W', 'SW', 'S', 'SE'];
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
var portalsLayers, linksLayer, fieldsLayer;

// contain references to all entities shown on the map. These are
// automatically kept in sync with the items on *sLayer, so never ever
// write to them.
window.portals = {};
window.links = {};
window.fields = {};



@@INJECTHERE@@


} // end of wrapper

// inject code into site context
var script = document.createElement('script');
script.appendChild(document.createTextNode('('+ wrapper +')();'));
(document.body || document.head || document.documentElement).appendChild(script);
