// ==UserScript==
// @id             ingress-intel-total-conversion@breunigs
// @name           intel map total conversion
// @version        0.8.1-@@BUILDDATE@@
// @namespace      https://github.com/breunigs/ingress-intel-total-conversion
// @updateURL      https://iitcserv.appspot.com/dist/total-conversion-build.user.js
// @downloadURL    https://iitcserv.appspot.com/dist/total-conversion-build.user.js
// @description    total conversion for the ingress intel map.
// @include        http://www.ingress.com/intel*
// @include        https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// ==/UserScript==


// REPLACE ORIG SITE ///////////////////////////////////////////////////
if(document.getElementsByTagName('html')[0].getAttribute('itemscope') != null)
  throw('Ingress Intel Website is down, not a userscript issue.');
window.iitcBuildDate = '@@BUILDDATE@@';

// disable vanilla JS
window.onload = function() {};

if(window.location.protocol !== 'https:') {
  var redir = window.location.href.replace(/^http:/, 'https:');
  window.location = redir;
  throw('Need to load HTTPS version.');
}

// rescue user data from original page
var scr = document.getElementsByTagName('script');
for(var x in scr) {
  var s = scr[x];
  if(s.src) continue;
  if(s.type !== 'text/javascript') continue;
  var d = s.innerHTML.split('\n');
  break;
}


if(!d) {
  // page doesn’t have a script tag with player information.
  if(document.getElementById('header_email')) {
    // however, we are logged in.
    setTimeout('location.reload();', 3*1000);
    throw('Page doesn’t have player data, but you are logged in. Reloading in 3s.');
  }
  // FIXME: handle nia takedown in progress
  throw('Couldn’t retrieve player data. Are you logged in?');
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
  + '<title>Ingress Intel Map</title>'
  + '<style>@@INCLUDESTRING:style.css@@</style>'
  + '<style>@@INCLUDESTRING:external/leaflet.css@@</style>'
  // this navigator check is also used in code/smartphone.js
  + (navigator.userAgent.match(/Android.*Mobile/)
      ? '<style>@@INCLUDESTRING:mobile/smartphone.css@@</style>'
      : '')
  + '<link rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/css?family=Coda"/>';

document.getElementsByTagName('body')[0].innerHTML = ''
  + '<div id="map">Loading, please wait</div>'
  + '<div id="chatcontrols" style="display:none">'
  + '  <a><span class="toggle expand"></span></a>'
  +   '<a>full</a><a>compact</a><a>public</a><a class="active">faction</a>'
  + '</div>'
  + '<div id="chat" style="display:none">'
  + '  <div id="chatfaction"></div>'
  + '  <div id="chatpublic"></div>'
  + '  <div id="chatcompact"></div>'
  + '  <div id="chatfull"></div>'
  + '</div>'
  + '<form id="chatinput" style="display:none"><table><tr>'
  + '  <td><time></time></td>'
  + '  <td><mark>tell faction:</mark></td>'
  + '  <td><input type="text"/></td>'
  + '</tr></table></form>'
  + '<a id="sidebartoggle"><span class="toggle close"></span></a>'
  + '<div id="scrollwrapper">' // enable scrolling for small screens
  + '  <div id="sidebar" style="display: none">'
  + '    <div id="playerstat">t</div>'
  + '    <div id="gamestat">&nbsp;loading global control stats</div>'
  + '    <input id="geosearch" placeholder="Search location…" type="text"/>'
  + '    <div id="portaldetails"></div>'
  + '    <input id="redeem" placeholder="Redeem code…" type="text"/>'
  + '    <div id="toolbox">'
  + '      <a onmouseover="setPermaLink(this)" onclick="setPermaLink(this);return androidCopy(this.href)" >permalink</a>'
  + '      <a href="https://github.com/breunigs/ingress-intel-total-conversion#readme" title="IITC = Ingress Intel Total Conversion.\n\nOn the script’s homepage you can:\n– find updates\n– get plugins\n– report bugs\n– and contribute." style="cursor: help">IITC’s page</a></div>'
  + '  </div>'
  + '</div>'
  + '<div id="updatestatus"></div>'
  + '<div id="dialog"></div>';

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
window.REFRESH = 30; // refresh view every 30s (base time)
window.ZOOM_LEVEL_ADJ = 5; // add 5 seconds per zoom level
window.REFRESH_GAME_SCORE = 5*60; // refresh game score every 5 minutes
window.MAX_IDLE_TIME = 4; // stop updating map after 4min idling
window.PRECACHE_PLAYER_NAMES_ZOOM = 17; // zoom level to start pre-resolving player names
window.HIDDEN_SCROLLBAR_ASSUMED_WIDTH = 20;
window.SIDEBAR_WIDTH = 300;
// chat messages are requested for the visible viewport. On high zoom
// levels this gets pretty pointless, so request messages in at least a
// X km radius.
window.CHAT_MIN_RANGE = 6;
// this controls how far data is being drawn outside the viewport. Set
// it 0 to only draw entities that intersect the current view. A value
// of one will render an area twice the size of the viewport (or some-
// thing like that, Leaflet doc isn’t too specific). Setting it too low
// makes the missing data on move/zoom out more obvious. Setting it too
// high causes too many items to be drawn, making drag&drop sluggish.
window.VIEWPORT_PAD_RATIO = 0.3;

// how many items to request each query
window.CHAT_PUBLIC_ITEMS = 200;
window.CHAT_FACTION_ITEMS = 50;
// how many pixels to the top before requesting new data
window.CHAT_REQUEST_SCROLL_TOP = 200;
window.CHAT_SHRINKED = 60;

// Leaflet will get very slow for MANY items. It’s better to display
// only some instead of crashing the browser.
window.MAX_DRAWN_PORTALS = 1000;
window.MAX_DRAWN_LINKS = 400;
window.MAX_DRAWN_FIELDS = 200;
// Minimum zoom level resonator will display
window.RESONATOR_DISPLAY_ZOOM_LEVEL = 17;
// Minimum area to zoom ratio that field MU's will display
window.FIELD_MU_DISPLAY_AREA_ZOOM_RATIO = 0.001;
// Point tolerance for displaying MU's
window.FIELD_MU_DISPLAY_POINT_TOLERANCE = 60

window.COLOR_SELECTED_PORTAL = '#f00';
window.COLORS = ['#FFCE00', '#0088FF', '#03DC03']; // none, res, enl
window.COLORS_LVL = ['#000', '#FECE5A', '#FFA630', '#FF7315', '#E40000', '#FD2992', '#EB26CD', '#C124E0', '#9627F4'];
window.COLORS_MOD = {VERY_RARE: '#F78AF6', RARE: '#AD8AFF', COMMON: '#84FBBD'};

window.OPTIONS_RESONATOR_SELECTED = { color: '#fff', weight: 2, radius: 4};
window.OPTIONS_RESONATOR_NON_SELECTED = { color: '#aaa', weight: 1, radius: 3};

window.OPTIONS_RESONATOR_LINE_SELECTED = {opacity: 0.7, weight: 3};
window.OPTIONS_RESONATOR_LINE_NON_SELECTED = {opacity: 0.25, weight: 2};

// circles around a selected portal that show from where you can hack
// it and how far the portal reaches (i.e. how far links may be made
// from this portal)
window.ACCESS_INDICATOR_COLOR = 'orange';
window.RANGE_INDICATOR_COLOR = 'red'

// by how much pixels should the portal range be expanded on mobile
// devices. This should make clicking them easier.
window.PORTAL_RADIUS_ENLARGE_MOBILE = 5;


window.DEFAULT_PORTAL_IMG = 'https://commondatastorage.googleapis.com/ingress/img/default-portal-image.png';
window.NOMINATIM = 'http://nominatim.openstreetmap.org/search?format=json&limit=1&q=';

// INGRESS CONSTANTS /////////////////////////////////////////////////
// http://decodeingress.me/2012/11/18/ingress-portal-levels-and-link-range/
window.RESO_NRG = [0, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000];
window.MAX_XM_PER_LEVEL = [0, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000];
window.MIN_AP_FOR_LEVEL = [0, 10000, 30000, 70000, 150000, 300000, 600000, 1200000];
window.HACK_RANGE = 40; // in meters, max. distance from portal to be able to access it
window.OCTANTS = ['E', 'NE', 'N', 'NW', 'W', 'SW', 'S', 'SE'];
window.DESTROY_RESONATOR = 75; //AP for destroying portal
window.DESTROY_LINK = 187; //AP for destroying link
window.DESTROY_FIELD = 750; //AP for destroying field
window.CAPTURE_PORTAL = 500; //AP for capturing a portal
window.DEPLOY_RESONATOR = 125; //AP for deploying a resonator
window.COMPLETION_BONUS = 250; //AP for deploying all resonators on portal
window.UPGRADE_ANOTHERS_RESONATOR = 65; //AP for upgrading another's resonator
window.MAX_PORTAL_LEVEL = 8;
window.MAX_RESO_PER_PLAYER = [0, 8, 4, 4, 4, 2, 2, 1, 1];

// OTHER MORE-OR-LESS CONSTANTS //////////////////////////////////////
window.TEAM_NONE = 0;
window.TEAM_RES = 1;
window.TEAM_ENL = 2;
window.TEAM_TO_CSS = ['none', 'res', 'enl'];
window.TYPE_UNKNOWN = 0;
window.TYPE_PORTAL = 1;
window.TYPE_LINK = 2;
window.TYPE_FIELD = 3;
window.TYPE_PLAYER = 4;
window.TYPE_CHAT = 5;
window.TYPE_RESONATOR = 6;

window.SLOT_TO_LAT = [0, Math.sqrt(2)/2, 1, Math.sqrt(2)/2, 0, -Math.sqrt(2)/2, -1, -Math.sqrt(2)/2];
window.SLOT_TO_LNG = [1, Math.sqrt(2)/2, 0, -Math.sqrt(2)/2, -1, -Math.sqrt(2)/2, 0, Math.sqrt(2)/2];
window.EARTH_RADIUS=6378137;
window.DEG2RAD = Math.PI / 180;

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
window.resonators = {};

// plugin framework. Plugins may load earlier than iitc, so don’t
// overwrite data
if(typeof window.plugin !== 'function') window.plugin = function() {};


@@INJECTHERE@@


} // end of wrapper

// inject code into site context
var script = document.createElement('script');
script.appendChild(document.createTextNode('('+ wrapper +')();'));
(document.body || document.head || document.documentElement).appendChild(script);
