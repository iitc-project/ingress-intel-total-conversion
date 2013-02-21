// ==UserScript==
// @id             iitc-plugin-player-tracker@breunigs
// @name           iitc: player tracker
// @version        0.3
// @namespace      https://github.com/breunigs/ingress-intel-total-conversion
// @updateURL      https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/player-tracker.user.js
// @downloadURL    https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/player-tracker.user.js
// @description    draws trails for the path a user went onto the map. Only draws the last hour. Does not request chat data on its own, even if that would be useful.
// @include        http://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// ==/UserScript==

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////
window.PLAYER_TRACKER_MAX_TIME = 60*60*1000; // in milliseconds


// use own namespace for plugin
window.plugin.playerTracker = function() {};

window.plugin.playerTracker.setup = function() {
  if(!window.iconRes) {
    alert('Player Tracker requires at least IITC v0.7+. Please update your script or build the latest version yourself.');
    return;
  }
  plugin.playerTracker.drawnTraces = new L.LayerGroup();
  window.layerChooser.addOverlay(plugin.playerTracker.drawnTraces, 'Player Tracker');
  map.addLayer(plugin.playerTracker.drawnTraces);
  addHook('publicChatDataAvailable', window.plugin.playerTracker.handleData);
}

window.plugin.playerTracker.stored = {};

window.plugin.playerTracker.getLimit = function() {
 return new Date().getTime() - window.PLAYER_TRACKER_MAX_TIME;
}

window.plugin.playerTracker.discardOldData = function() {
  var limit = plugin.playerTracker.getLimit();
  $.each(plugin.playerTracker.stored, function(pguid, player) {
    var i;
    var ev = player.events;
    for(i = 0; i < ev.length; i++) {
      if(ev[i].time >= limit) break;
    }
    if(i === 0) return true;
    if(i === ev.length) return delete plugin.playerTracker.stored[pguid];
    plugin.playerTracker.stored[pguid].events.splice(0, i);
  });
}

window.plugin.playerTracker.eventHasLatLng = function(ev, lat, lng) {
  var hasLatLng = false;
  $.each(ev.latlngs, function(ind, ll) {
    if(ll[0] === lat && ll[1] === lng) {
      hasLatLng = true;
      return false;
    }
  });
  return hasLatLng;
}

window.plugin.playerTracker.processNewData = function(data) {
  var limit = plugin.playerTracker.getLimit();
  $.each(data.raw.result, function(ind, json) {
    // skip old data
    if(json[1] < limit) return true;

    // find player and portal information
    var pguid, lat, lng, name;
    var skipThisMessage = false;
    $.each(json[2].plext.markup, function(ind, markup) {
      switch(markup[0]) {
      case 'TEXT':
        // Destroy link messages depend on how the link was originally
        // created. Therefore it’s not clear which portal the player is
        // at, so ignore it.
        if(markup[1].plain.indexOf('destroyed the Link') !== -1) {
          skipThisMessage = true;
          return false;
        }
        break;
      case 'PLAYER':
        pguid = markup[1].guid;
        break;
      case 'PORTAL':
        // link messages are “player linked X to Y” and the player is at
        // X.
        lat = lat ? lat : markup[1].latE6/1E6;
        lng = lng ? lng : markup[1].lngE6/1E6;
        name = name ? name : markup[1].name;
        break;
      }
    });

    // skip unusable events
    if(!pguid || !lat || !lng || skipThisMessage) return true;

    var newEvent = {
      latlngs: [[lat, lng]],
      time: json[1],
      name: name
    };

    var playerData = window.plugin.playerTracker.stored[pguid];

    // short-path if this is a new player
    if(!playerData || playerData.events.length === 0) {
      plugin.playerTracker.stored[pguid] = {
         // this always resolves, as the chat delivers this data
        nick: window.getPlayerName(pguid),
        team: json[2].plext.team,
        events: [newEvent]
      };
      return true;
    }

    var evts = playerData.events;
    // there’s some data already. Need to find correct place to insert.
    var i;
    for(i = 0; i < evts.length; i++) {
      if(evts[i].time > json[1]) break;
    }

    var cmp = Math.max(i-1, 0);

    // so we have an event that happened at the same time. Most likely
    // this is multiple resos destroyed at the same time.
    if(evts[cmp].time === json[1]) {
      evts[cmp].latlngs.push([lat, lng]);
      plugin.playerTracker.stored[pguid].events = evts;
      return true;
    }

    // the time changed. Is the player still at the same location?

    // assume this is an older event at the same location. Then we need
    // to look at the next item in the event list. If this event is the
    // newest one, there may not be a newer event so check for that. If
    // it really is an older event at the same location, then skip it.
    if(evts[cmp+1] && plugin.playerTracker.eventHasLatLng(evts[cmp+1], lat, lng))
      return true;

    // if this event is newer, need to look at the previous one
    var sameLocation = plugin.playerTracker.eventHasLatLng(evts[cmp], lat, lng);

    // if it’s the same location, just update the timestamp. Otherwise
    // push as new event.
    if(sameLocation) {
      evts[cmp].time = json[1];
    } else {
      evts.splice(i, 0,  newEvent);
    }

    // update player data
    plugin.playerTracker.stored[pguid].events = evts;
  });
}

window.plugin.playerTracker.getLatLngFromEvent = function(ev) {
  var lats = $.map(ev.latlngs, function(ll) { return [ll[0]] });
  var lngs = $.map(ev.latlngs, function(ll) { return [ll[1]] });
  var latmax = Math.max.apply(null, lats);
  var latmin = Math.min.apply(null, lats);
  var lngmax = Math.max.apply(null, lngs);
  var lngmin = Math.min.apply(null, lngs);
  return L.latLng((latmax + latmin) / 2, (lngmax + lngmin) / 2);
}

window.plugin.playerTracker.ago = function(time, now) {
  return parseInt((now-time)/(1000*60));
}

window.plugin.playerTracker.drawData = function() {
  var gllfe = plugin.playerTracker.getLatLngFromEvent;
  var layer = plugin.playerTracker.drawnTraces;

  var polyLineByAge = [[], [], [], []];
  var split = PLAYER_TRACKER_MAX_TIME / 4;
  var now = new Date().getTime();
  $.each(plugin.playerTracker.stored, function(pguid, playerData) {
    if(!playerData || playerData.events.length === 0) {
      console.warn('broken player data for pguid=' + pguid);
      return true;
    }

    // gather line data and put them in buckets so we can color them by
    // their age
    var playerLine = [];
    for(var i = 1; i < playerData.events.length; i++) {
      var p = playerData.events[i];
      var ageBucket = Math.min(parseInt((now - p.time) / split), 4-1);
      var line = [gllfe(p), gllfe(playerData.events[i-1])];
      polyLineByAge[ageBucket].push(line);
    }

    // tooltip for marker
    var evtsLength = playerData.events.length;
    var last = playerData.events[evtsLength-1];
    var ago = plugin.playerTracker.ago;
    var color = playerData.team === 'ALIENS' ? '#029C02' : '#00789C';
    var title =
        '<span style="font-weight:bold; color:'+color+'">' + playerData.nick + '</span>\n'
        + ago(last.time, now) + ' minutes ago\n'
        + last.name;
    // show previous data in tooltip
    var minsAgo = '\t<span style="white-space: nowrap;">mins ago</span>\t';
    if(evtsLength >= 2)
      title += '\n&nbsp;\nprevious locations:\n';
    for(var i = evtsLength - 2; i >= 0 && i >= evtsLength - 10; i--) {
      var ev = playerData.events[i];
      title += ago(ev.time, now) + minsAgo + ev.name + '\n';
    }

    // marker itself
    var icon = playerData.team === 'ALIENS' ?  new window.iconEnl() :  new window.iconRes();
    var m = L.marker(gllfe(last), {title: title, clickable: false, icon: icon});
    // ensure tooltips are closed, sometimes they linger
    m.on('mouseout', function() { $(this._icon).tooltip('close'); });
    m.addTo(layer);
    // jQueryUI doesn’t automatically notice the new markers
    window.setupTooltips($(m._icon));
  });

  // draw the poly lines to the map
  $.each(polyLineByAge, function(i, polyLine) {
    if(polyLine.length === 0) return true;

    var opts = {
      weight: 2-0.25*i,
      color: '#FF00FD',
      clickable: false,
      opacity: 1-0.2*i
    };

    L.multiPolyline(polyLine, opts).addTo(layer);
  });
}

window.plugin.playerTracker.handleData = function(data) {
  plugin.playerTracker.discardOldData();
  plugin.playerTracker.processNewData(data);
  // remove old popups
  plugin.playerTracker.drawnTraces.eachLayer(function(layer) {
    if(layer._icon) $(layer._icon).tooltip('destroy');
  });
  plugin.playerTracker.drawnTraces.clearLayers();
  plugin.playerTracker.drawData();
}





var setup = plugin.playerTracker.setup;

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
