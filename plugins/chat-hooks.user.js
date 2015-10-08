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
      this._root = makeNode(key, data);
      this._length++;
    } else {
      // Find place to insert based on key
      node = this._root;
      while (node !== null) {
        var next_node = null;
        if (key <= node.key) {
          next_node = node.left;
          if (next_node===null) {
            node.left = makeNode(key, data);
            this._length++;
            return node.left;
          }
        } else if (key > node.key) {
          next_node = node.right;
          if (next_node===null) {
            node.right = makeNode(key, data);
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
/*
          case 'TEXT':
            if(markup[1].plain.indexOf('destroyed the Link') !== -1) {
              type = "CHAT_DESTROYLINK";
            } else if (markup[1].plain.indexOf('destroyed a Control Field') !== -1) {
              type = "CHAT_DESTROYFIELD";
            } else if (markup[1].plain.indexOf('Your Link') !== -1) {
              type = "CHAT_DESTROYLINK_OWN";
            }
            break;
*/
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
        var newEvent = {
                        time: json[1],
                        type: type
        };
        if (lat && lng) {
          newEvent[latlngs] = [[lat, lng]];
        }
        if (name) {
          newEvent[name] = name;
        }
        if (address) {
          newEvent[address] = address;
        }

        if (plrname) {
          var playerData = window.plugin.chatHooks.stored[plrname];
          // Insert new event into list
          if(!playerData || !playerData.events || playerData.events._length === 0) {
            plugin.chatHooks.stored[plrname] = {
              nick: plrname,
              team: json[2].plext.team,
              events: window.plugin.chatHooks.LinkedList()
            };
          }
        }
    });
    if (type && newEvent) {
      playerData.events.add(newEvent.time, newEvent);
      runChatHooks(type, newEvent);
    }
  });
};

window.plugin.chatHooks.handleFactionData = function(data) {

};

var setup =  function() {
  addHook('publicChatDataAvailable', window.plugin.chatHooks.handlePublicData);
  addHook('factionChatDataAvailable', window.plugin.chatHooks.handleFactionData);
};

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
