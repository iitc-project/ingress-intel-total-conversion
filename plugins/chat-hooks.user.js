// ==UserScript==
// @id             iitc-plugin-chat-hooks
// @name           IITC plugin: chat hooks
// @category       Info
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/mnoeljones/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Provide specific hooks for events detected in chat
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
  'CH_RESO_DESTROYED',
  'CH_RESO_DEPLOYED',
  'CH_PORTAL_LINKED',
  'CH_PORTAL_CAPTURED',
  'CH_PORTAL_ATTACKED',
  'CH_PORTAL_NEUTRALISED',
  'CH_LINK_DESTROYED',
  'CH_LINK_DESTROYED_OWN',
  'CH_FIELD_CREATED',
  'CH_FIELD_DESTROYED'
];

window.plugin.chatHooks.CHATHOOK_MSG_TRIGGERS = {
  CH_RESO_DESTROYED:     "destroyed a Resonator",
  CH_RESO_DEPLOYED:      "deployed a Resonator",
  CH_PORTAL_LINKED:      "linked",
  CH_PORTAL_CAPTURED:    "captured",
  CH_PORTAL_ATTACKED:    "is under attack",
  CH_PORTAL_NEUTRALISED: "neutralized",
  CH_LINK_DESTROYED:     "destroyed the Link",
  CH_LINK_DESTROYED_OWN: "Your Link",
  CH_FIELD_CREATED:      "created a Control Field",
  CH_FIELD_DESTROYED:    "destroyed a Control Field"
};

window.plugin.chatHooks.runChatHooks = function(event, data) {
  if(plugin.chatHooks.VALID_CHATHOOKS.indexOf(event) === -1) throw('Unknown event type: ' + event);

  if(!plugin.chatHooks._chathooks[event]) return true;
  var interrupted = false;
  $.each(plugin.chatHooks._chathooks[event], function(ind, callback) {
    try {
      if (callback(data) === false) {
        interrupted = true;
        return false;  //break from $.each
      }
    } catch(err) {
      console.error('@@BUILDDATE@@' + 'error running chat hook '+event+', error: '+err);
      debugger;
      return false;  //break from $.each
    }
  });
  return !interrupted;
};

window.plugin.chatHooks.addChatHook = function(event, callback) {
  if(plugin.chatHooks.VALID_CHATHOOKS.indexOf(event) === -1) {
    console.error('addChatHook: Unknown event type: ' + event + ' - ignoring');
    debugger;
    return;
  }

  if(typeof callback !== 'function') throw('Callback must be a function.');

  if(!plugin.chatHooks._chathooks[event])
    plugin.chatHooks._chathooks[event] = [callback];
  else
    plugin.chatHooks._chathooks[event].push(callback);
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

// function traverse_do(obj) { if (obj.type == "CH_PORTAL_CAPTURED" || obj.type == "CH_PORTAL_ATTACKED" || obj.type == "CH_PORTAL_LINKED") { var type_s = obj.type == "CH_PORTAL_CAPTURED" ? "CAP" : obj.type == "CH_PORTAL_LINKED" ? "LNK" : "ATT"; d = new Date(); d.setTime(obj.time); var dt = Intl.DateTimeFormat("en-GB", {weekday: "short", hour: "2-digit", minute: "2-digit"}).format; console.log(dt(d) + ": " + type_s + " " + obj.portals[0].name); } }

// traverse(window.plugin.chatHooks.stored.DragonJD.events._root, traverse_do);
function traverse(root, fn) {
  var obj = root;
  if (obj.left !== null) {
    traverse(obj.left, fn);
  } 
  if (obj.right !== null) {
    traverse(obj.right, fn);
  }
  fn(obj.item);
}

window.plugin.chatHooks.stored = {};


window.plugin.chatHooks.handlePublicData = function(data) {
  $.each(data.result, function(ind, json) {
    var type;
    var playername, lat, lng, id=null, name, address;
    var newEvent = {
                    id:   json[0],
                    time: json[1],
                    team: json[2].plext.team,
                    text: json[2].plext.text,
    };
    $.each(json[2].plext.markup, function(ind, markup) {
      switch(markup[0]) {
        case 'TEXT':
          for (var key in window.plugin.chatHooks.CHATHOOK_MSG_TRIGGERS) {
            if(markup[1].plain.indexOf(window.plugin.chatHooks.CHATHOOK_MSG_TRIGGERS[key]) !== -1) {
              newEvent.type = key;
            }
          }
          break;
        case 'PLAYER':
          playername = markup[1].plain;
          newEvent.nick = playername;
          break;
        case 'PORTAL':
          portal = markup[1];
          if (!newEvent.portals) {
            newEvent.portals = [portal];
          } else {
            newEvent.portals.push(portal);
          }
          break;
        default:
          break;
      }
    });

    if (playername) {
      var playerData = window.plugin.chatHooks.stored[playername];
      // Insert new event into list
      if(!playerData) {
        plugin.chatHooks.stored[playername] = {
          nick: playername,
          team: json[2].plext.team
        };
        playerData = plugin.chatHooks.stored[playername];
      }
      if (!playerData.events) {
        playerData.events = new window.plugin.chatHooks.LinkedList();
      }
      if (newEvent.type) {
        var test  = playerData.events.add(newEvent.id, newEvent);
        if (test) {
          // console.log("Added chat event for " + newEvent.nick + ": " + newEvent.type + "(" + newEvent.id + ")");
          window.plugin.chatHooks.runChatHooks(newEvent.type, newEvent);
          return true;
        }
      }
    }
  });
};

window.plugin.chatHooks.handleFactionData = function(data) {

};

/*
// Is sync useful? It would provide cross-session information, but that's not the purpose of chat-hooks.
window.plugin.chatHooks.syncCallback = function(pluginName, fieldName, e, fullUpdate) {
  
}

window.plugin.chatHooks.syncInitialised = function(pluginName, fieldName) {
  
}

// Call after IITC and all other plugins have loaded
window.plugin.chatHooks.registerFieldForSyncing = function() {
  if(!window.plugin.sync) return;
  window.plugin.sync.registerMapForSync('bookmarks', 'chatHookHistory', window.plugin.chatHooks.syncCallback, window.plugin.chatHooks.syncInitialised);
}
*/

var setup =  function() {
  addHook('publicChatDataAvailable', window.plugin.chatHooks.handlePublicData);
  //addHook('factionChatDataAvailable', window.plugin.chatHooks.handleFactionData);

  //addHook('iitcLoaded', window.plugin.bookmarks.registerFieldForSyncing);
};

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
