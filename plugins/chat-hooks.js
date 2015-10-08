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


window.plugin.chatHooks._chathooks = {};
window.plugin.chatHooks._history = {faction: {}, public: {}};
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
};

window.plugin.chatHooks.LinkedList = function() {
  this._root = null
  this.makeNode = function(key, data) {
    var node = {
      key: typeof key !== 'undefined' ? key : null,
      item: typeof data !== 'undefined' ? data : null,
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
};

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
    }

    playerData.events.add(newEvent.time, newEvent)  
  });
  runChatHooks(type, newEvent)
};

window.plugin.chatHooks.handleFactionData = function(data) {

};

var setup =  function() {
  addHook('publicChatDataAvailable', window.plugin.chatHooks.handlePublicData);
  addHook('factionChatDataAvailable', window.plugin.chatHooks.handleFactionData);
};

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
