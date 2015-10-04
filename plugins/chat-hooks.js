// ==UserScript==
// @id             iitc-plugin-guess-player-levels@breunigs
// @name           IITC plugin: guess player level
// @category       Info
// @version        0.5.7.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Try to determine player levels from the data available in the current view.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @include        https://www.ingress.com/mission/*
// @include        http://www.ingress.com/mission/*
// @match          https://www.ingress.com/mission/*
// @match          http://www.ingress.com/mission/*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.chatHooks = function() {};

// we prepend a hash sign (#) in front of the player name in storage in order to prevent accessing a pre-defined property
// (like constructor, __defineGetter__, etc.

/* 
window.plugin.chatHooks.setupCallback = function() {
  $('#toolbox').append(' <a onclick="window.plugin.guessPlayerLevels.guess()" title="Show player level guesses based on resonator placement in displayed portals">Guess player levels</a>');
  addHook('portalDetailLoaded', window.plugin.guessPlayerLevels.extractPortalData);
  addHook('publicChatDataAvailable', window.plugin.guessPlayerLevels.extractChatData);
}
*/


/*
window.plugin.guessPlayerLevels.extractChatData = function(data) {
  var attackData = {};
  function addAttackMessage(nick, timestamp, portal) {
    var details = window.plugin.guessPlayerLevels.fetchLevelDetailsByPlayer(nick);
    if(details.guessed == 8 || details.min == 8) return; // we wouldn't get better results, so skip the calcula
    if(!attackData[nick]) attackData[nick] = {};
    if(!attackData[nick][timestamp]) attackData[nick][timestamp] = [];
    attackData[nick][timestamp].push(portal);
  }

  data.result.forEach(function(msg) {
    var plext = msg[2].plext;

    // search for "x deployed an Ly Resonator on z"
    if(plext.plextType == 'SYSTEM_BROADCAST'
    && plext.markup.length==5
    && plext.markup[0][0] == 'PLAYER'
    && plext.markup[1][0] == 'TEXT'
    && plext.markup[1][1].plain == ' deployed an '
    && plext.markup[2][0] == 'TEXT'
    && plext.markup[3][0] == 'TEXT'
    && plext.markup[3][1].plain == ' Resonator on ') {
      var nick = plext.markup[0][1].plain;
      var lvl = parseInt(plext.markup[2][1].plain.substr(1));
      window.plugin.guessPlayerLevels.savePlayerLevel(nick, lvl, true);
    }

    // search for "x destroyed an Ly Resonator on z"
    if(plext.plextType == 'SYSTEM_BROADCAST'
    && plext.markup.length==5
    && plext.markup[0][0] == 'PLAYER'
    && plext.markup[1][0] == 'TEXT'
    && plext.markup[1][1].plain == ' destroyed an '
    && plext.markup[2][0] == 'TEXT'
    && plext.markup[3][0] == 'TEXT'
    && plext.markup[3][1].plain == ' Resonator on ') {
      var nick = plext.markup[0][1].plain;
      var portal = plext.markup[4][1];
      addAttackMessage(nick, msg[1], portal)
    }

    // search for "Your Lx Resonator on y was destroyed by z"
    if(plext.plextType == 'SYSTEM_NARROWCAST'
    && plext.markup.length==6
    && plext.markup[0][0] == 'TEXT'
    && plext.markup[0][1].plain == 'Your '
    && plext.markup[1][0] == 'TEXT'
    && plext.markup[2][0] == 'TEXT'
    && plext.markup[2][1].plain == ' Resonator on '
    && plext.markup[3][0] == 'PORTAL'
    && plext.markup[4][0] == 'TEXT'
    && plext.markup[4][1].plain == ' was destroyed by '
    && plext.markup[5][0] == 'PLAYER') {
      var nick = plext.markup[5][1].plain;
      var portal = plext.markup[3][1];
      addAttackMessage(nick, msg[1], portal)
    }

    // search for "Your Portal x neutralized by y"
    // search for "Your Portal x is under attack by y"
    if(plext.plextType == 'SYSTEM_NARROWCAST'
    && plext.markup.length==4
    && plext.markup[0][0] == 'TEXT'
    && plext.markup[0][1].plain == 'Your Portal '
    && plext.markup[1][0] == 'PORTAL'
    && plext.markup[2][0] == 'TEXT'
    && (plext.markup[2][1].plain == ' neutralized by ' || plext.markup[2][1].plain == ' is under attack by ')
    && plext.markup[3][0] == 'PLAYER') {
      var nick = plext.markup[3][1].plain;
      var portal = plext.markup[1][1];
      addAttackMessage(nick, msg[1], portal)
    }
  });

  for(nick in attackData) {
    for(timestamp in attackData[nick]) {
      // remove duplicates
      var latlngs = [];
      var portals = {};
      attackData[nick][timestamp].forEach(function(portal) {
        // no GUID in the data any more - but we need some unique string. use the latE6,lngE6
        var id = portal.latE6+","+portal.lngE6;
        if(portals.hasOwnProperty(id))
          return;
        portals[id] = 1;
        latlngs.push({x: portal.lngE6/1E6, y:portal.latE6/1E6});
      });
      if(latlngs.length < 2) // we need at least 2 portals to calculate burster range
        continue;

      window.plugin.guessPlayerLevels.handleAttackData(nick, latlngs);
    }
  }
};
*/

window.plugin.chatHooks._chathooks = {}
window.plugin.chatHooks._history = {faction: {}, public: {}}
window.plugin.chatHooks.VALID_CHATHOOKS = [
  'CHAT_DEPLOYRESO',
  'CHAT_LINK_PORTALS',
  'CHAT_FIELDFROM',
  'CHAT_CAPTUREPORTAL',
  'CHAT_PORTALUNDERATTACK',
  'CHAT_PORTALNEUTRALISED',
  'CHAT_LINKDESTROYED',
  'CHAT_LINKDESTROYED_OWN',
  'CHAT_FIELDDESTROYED',
];

window.plugin.chatHooks.runHooks = function(event, data) {
  if(VALID_HOOKS.indexOf(event) === -1) throw('Unknown event type: ' + event);

  if(!_chathooks[event]) return true;
  var interrupted = false;
  $.each(_chathooks[event], function(ind, callback) {
    try {
      if (callback(data) === false) {
        interrupted = true;
        return false;  //break from $.each
      }
    } catch(err) {
      console.error('error running chat hook '+event+', error: '+err);
      debugger;
    }
  });
  return !interrupted;
}

window.plugin.chatHooks.LinkedList = function() {
  this._root = null
  this.makeNode = function(key, data) {
    var node = {
      key: typeof key !== 'undefined' ? key : null,
      item: typeof data !== 'undefined' ? data : null
      left: null,
      right: null
    }
    return node
  }
  this.add = function(key, data) {
    if (this._root === null) {
      this._root = makeNode(key, data)
    } else {
      // Find place to insert based on key
      node = this._root
      while (node !== null) {
        var next_node = null
        if (key <= node.key) {
          next_node = node.left
          if (next_node===null) {
            node.left = makeNode(key, data)
            return node.left
          }
        } else if (key > node.key) {
          next_node = node.right
          if (next_node===null) {
            node.right = makeNode(key, data)
            return node.right
          }
        }
        node = next_node
      }
    }
    return null
  }
  this.get = function(key) {
    // Find node based on key
    node = this._root
    while (node !== null) {
      if (node.key === key) {
        return node
      }
      if (key <= node.key) {
        node = node.left
      } else if (key > node.key) {
        node = node.right
      }
    }
  }
}

window.plugin.playerTracker.stored = {};

window.plugin.chatHooks.handlePublicData = function(data) {
    var type
    var id = ""
    // TODO : Design GUID to identify event - time + type + (each portals lat_lng) ?
    $.each(json[2].plext.markup, function(ind, markup) {
      switch(markup[0]) {
      case 'TEXT':
        if(markup[1].plain.indexOf('destroyed the Link') !== -1) {
          type = "CHAT_DESTROYLINK"    
        } else if (markup[1].plain.indexOf('destroyed a Control Field') !== -1) {
          type = "CHAT_DESTROYFIELD"    
        } else if (markup[1].plain.indexOf('Your Link') !== -1) {
          type = "CHAT_DESTROYLINK_OWN"    
        }
        break;
      case 'PLAYER':
        plrname = markup[1].plain;
        break;
      case 'PORTAL':
        lat = lat ? lat : markup[1].latE6/1E6;
        lng = lng ? lng : markup[1].lngE6/1E6;

        name = name ? name : markup[1].name;
        address = address ? address : markup[1].address;
        break;
      }
    var newEvent = {
      time: json[1],
      type: type,
      latlngs: [[lat, lng]],
      name: name,
      address: address
    };


    var playerData = window.plugin.chatHooks.stored[plrname];
    // Insert new event into list
    if(!playerData || playerData.events.length === 0) {
      plugin.chatHooks.stored[plrname] = {
        nick: plrname,
        team: json[2].plext.team,
        events: LinkedList()
      };
      plugin.chatHooks.stored[plrname].events.add(time, newevent)  
    }

// TODO : Update for chatHooks
    var evts = playerData.events;
    // there's some data already. Need to find correct place to insert.
    var i;
    for(i = 0; i < evts.length; i++) {
      if(evts[i].time > json[1]) break;
    }

    var cmp = Math.max(i-1, 0);

    // We have an event that happened at the same time.
    if(evts[cmp].time === json[1]) {
      evts[cmp].latlngs.push([lat, lng]);
      evts[cmp].ids.push(id);
      plugin.playerTracker.stored[plrname].events = evts;
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
    plugin.playerTracker.stored[plrname].events = evts;
  });

    
}

window.plugin.chatHooks.handleFactionData = function(data) {

}

var setup =  function() {
  addHook('publicChatDataAvailable', window.plugin.chatHooks.handlePublicData);
  addHook('factionChatDataAvailable', window.plugin.chatHooks.handleFactionData);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
