// ==UserScript==
// @id             iitc-plugin-chat-hoosk
// @name           IITC plugin: chat hooks
// @category       Info
// @version        0.0.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/mnoeljones/ingress-intel-total-conversion
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

window.plugin.chatHooks._chathooks = {};
window.plugin.chatHooks._history = {factionevents: {}, publicevents: {}};
window.plugin.chatHooks.VALID_CHATHOOKS = [
  'CHAT_DEPLOYRESO',
  'CHAT_LINK_PORTALS',
  'CHAT_FIELDFROM',
  'CHAT_CAPTUREPORTAL',
  'CHAT_PORTALUNDERATTACK',
  'CHAT_PORTALNEUTRALISED',
  'CHAT_LINKDESTROYED',
  'CHAT_LINKDESTROYED_OWN',
  'CHAT_FIELDDESTROYED'
];

window.plugin.chatHooks.CHATHOOK_MSG = {
  CHAT_DESTROYRESO:       "destroyed a Resonator",
  CHAT_DEPLOYRESO:        "deployed a Resonator",
  CHAT_LINK_PORTALS:      "linked",
  CHAT_FIELDFROM:         "created a Control Field",
  CHAT_CAPTUREPORTAL:     "captured",
  CHAT_PORTALUNDERATTACK: "is under attack",
  CHAT_PORTALNEUTRALISED: "neutralized",
  CHAT_LINKDESTROYED:     "destroyed the Link",
  CHAT_LINKDESTROYED_OWN: "Your Link",
  CHAT_FIELDDESTROYED:    "destroyed a Control Field"
}

window.plugin.chatHooks.runChatHooks = function(event, data) {
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
      return false;  //break from $.each
    }
  });
  return !interrupted;
};

window.plugin.chatHooks.LinkedList = function() {
  this._root = null;
  this._length = 0;
  this.makeNode = function(key, data) {
    var node = {
      key: typeof key !== 'undefined' ? key : null,
      item: typeof data !== 'undefined' ? data : null,
      left: null,
      right: null
    };
    return node;
  };
  this.add = function(key, data) {
    if (this._root === null) {
      this._root = this.makeNode(key, data);
      this._length++;
      return this._root;
    } else {
      // Find place to insert based on key
      node = this._root;
      while (node !== null) {
        var next_node = null;
        if (key < node.key) {
          next_node = node.left;
          if (next_node===null) {
            node.left = this.makeNode(key, data);
            this._length++;
            return node.left;
          }
        } else if (key > node.key) {
          next_node = node.right;
          if (next_node===null) {
            node.right = this.makeNode(key, data);
            this._length++;
            return node.right;
          }
        }
        node = next_node;
      }
    }
    return null;
  };
  this.get = function(key) {
    // Find node based on key
    node = this._root;
    while (node !== null) {
      if (node.key === key) {
        return node;
      }
      if (key <= node.key) {
        node = node.left;
      } else if (key > node.key) {
        node = node.right;
      }
    }
    return null;
  };

  this.length = function() {
    return this._length;
  };
};

window.plugin.chatHooks.stored = {};

window.plugin.chatHooks.handlePublicData = function(data) {
    // TODO : Design GUID to identify event - time + type + (each portals lat_lng) ?
    $.each(data.result, function(ind, json) {
      var type, newEvent;
      var plrname, lat, lng, id=null, name, address;
      $.each(json[2].plext.markup, function(ind, markup) {
        switch(markup[0]) {
          case 'TEXT':
            for (var key in window.plugin.chatHooks.CHATHOOK_MSG) {
              if(markup[1].plain.indexOf(window.plugin.chatHooks.CHATHOOK_MSG[key]) !== -1) {
                type = key;
              };
            };
            break;
          case 'PLAYER':
            plrname = markup[1].plain;
            break;
/*
          case 'PORTAL':
            lat = lat ? lat : markup[1].latE6/1E6;
            lng = lng ? lng : markup[1].lngE6/1E6;

            name = name ? name : markup[1].name;
            address = address ? address : markup[1].address;
            break;
*/
          default:
            break;
        }
    });
    var newEvent = {
                    id:   json[0],
                    time: json[1],
                    type: type
    };
    if (lat && lng) {
      newEvent.latlngs = [[lat, lng]];
    }
    if (name) {
      newEvent.name = name;
    }
    if (address) {
      newEvent.address = address;
    }

    if (plrname) {
      var playerData = window.plugin.chatHooks.stored[plrname];
      // Insert new event into list
      if(!playerData) {
        plugin.chatHooks.stored[plrname] = {
          nick: plrname,
          team: json[2].plext.team,
        }
        playerData = plugin.chatHooks.stored[plrname]
      }
      if (!playerData.events) {
        playerData.events = new window.plugin.chatHooks.LinkedList()
      }
      if (type && newEvent) {
        var test  = playerData.events.add(newEvent.id, newEvent);
        if (test) {
          console.log("Added chat event for " + playerData.nick + ": " + newEvent.type + "(" + newEvent.id + ")")
          window.plugin.chatHooks.runChatHooks(type, newEvent);
          return true;
        }
      }
    }
  });
};

window.plugin.chatHooks.handleFactionData = function(data) {

};

var setup =  function() {
  addHook('publicChatDataAvailable', window.plugin.chatHooks.handlePublicData);
  //addHook('factionChatDataAvailable', window.plugin.chatHooks.handleFactionData);
};

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
