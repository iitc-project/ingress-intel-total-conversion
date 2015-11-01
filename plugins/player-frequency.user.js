// ==UserScript==
// @id             iitc-plugin-player-frequency
// @name           IITC plugin: Player Frequency
// @category       Info
// @version        0.0.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/mnoeljones/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Player Frequency Display Layer
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
window.plugin.PlayerFrequency = (function() {

  var PlayerFrequency = function () {
      // Member variables
      this.CHATHOOKS = window.plugin.chatHooks;
      this.FACTION_COLOURS = {
        ENLIGHTENED: "#00FF00",
        RESISTANCE:  "#0000FF"
      };
      this.usercount = 0;
      this.styles = {
        ENLIGHTENED: { color: this.FACTION_COLOURS.ENLIGHTENED },
        RESISTANCE: { color: this.FACTION_COLOURS.RESISTANCE },
        KEY_COLLECTION: { color: "gray" }
      };
      this.userfilter = new userfilter();
      this.stored = {};
  };
  PlayerFrequency.prototype = {
    // Member functions
    stored_append: function(nick, portal, lat, lng, style) {
      if (!this.stored[nick]) {
        this.stored[nick] = [];
      }
      this.stored[nick].push({portal: portal, lat: lat, lng: lng, style: style});
      if (!this.userfilter.hasrecord(nick)) {
        this.userfilter.setfilter(nick);
      }
    },
    resonator: function(data) {
      portal = data.portals[0];
      lat = portal.latE6;
      lng = portal.lngE6;
      style = data.team;
      this.stored_append(data.nick, portal, lat, lng, style);
    },
    portal: function(data) {
      portal = data.portals[0];
      lat = portal.latE6;
      lng = portal.lngE6;
      style = data.team;
      this.stored_append(data.nick, portal, lat, lng, style);
    },
    linked_portal: function(data) {
      portal = data.portals[0];
      lat = portal.latE6;
      lng = portal.lngE6;
      style = data.team;
      this.stored_append(data.nick, portal, lat, lng, style);
      this.stored_append(data.nick, data.portals[1], data.portals[1].latE6, data.portals[1].lngE6, "KEY_COLLECTION");
    },
    addCircle: function(lat, lng, style) {
      console.log("Adding circle at " + lat + ", " + lng);

      style.fill = true;

      L.circle(L.latLng(lat, lng), 40, style).addTo(this.layer);
    },
    addUserDataToLayer: function(nick) {
      var self = this;
      this.stored[nick].forEach(function(entry, id, arr) {
        self.addCircle(entry.lat/1E6, entry.lng/1E6, self.styles[entry.style]);
      });
    },
    showUsers: function() {
      var stored = window.plugin.chatHooks.stored;
      if (stored) {
        console.log(Object.keys(stored).length + "<->" + this.usercount);
        if (Object.keys(stored).length > this.usercount) {
          var names = "";
          var first = true;
          for (var user in stored) {
            if (first) {
              first = false;
            } else {
              names = names + "\n";
            }
            names = names + user;
          }
          console.log(names);
          this.usercount = Object.keys(stored).length;
        }
      }
    },
    showSelectedUsers: function() {
      this.layer.clearLayers();
      var self = this;
      Object.getOwnPropertyNames(this.userfilter.filters).forEach(
        function(nick, id, arr) {
          if (self.userfilter.filters[nick].enabled) {
            self.addUserDataToLayer(nick);
          }
        }
      );
    },
    update_cb: function(nick) {
      var userfilter = this.userfilter.filters[nick];
      // find dom for this cb
      cb = $('input[name="players"][value=nick]');
      // find state of checkbox
      cb_state = cb.prop("checked");
      // update filter and update cb state to match filter
      console.log(nick + ": " + userfilter.enabled);
      userfilter.toggle();
      console.log(nick + ": " + userfilter.enabled);
      cb.prop("checked", userfilter.enabled);
    },

    filterUsers: function() {
      var userfilter = this.userfilter.filters;
      var names = Object.getOwnPropertyNames(this.userfilter.filters);
      var names_checkboxes = "<fieldset>";
      names_checkboxes += "<legend>Players with current frequency data:</legend>";

      names.forEach(function(nick, id, arr) {
        checked = userfilter[nick].enabled ? "checked" : "";
        var value = 'value="' + nick + '"';
        var checked_opt = checked ? 'checked' : '';
        var onclick_opt = 'onchange="pf.update_cb(\'' + nick + '\')"';
        console.log("value: " + value);
        console.log("checked: " + checked);
        console.log("onclick: " + onclick);
        names_checkboxes += '<input type="checkbox" name="players" ' + value + ' ' + checked_opt + ' ' + onclick_opt + ' />' + nick + '<br/>';
      });
      names_checkboxes += '</fieldset><input type="button" onclick="pf.showSelectedUsers()">OK</input>';

      dialog({
        text: names_checkboxes,
        title: 'Names',
        id: 'player-frequecy-userfilter',
        width: 350,
      });
    },
    setup: function() {
    },
  };
  var Filter = function (){
    this.enabled = false;
  };
  Filter.prototype = {
    enable: function() {
      this.enabled = true;
    },
    disable: function() {
      this.enabled = false;
    },
    toggle: function() {
      if (this.enabled) {
        this.disable();
      } else {
        this.enable();
      }
    },
  };

  var userfilter = function() {
    this.filters = {};
  };
  userfilter.prototype = {
    setfilter: function(nick) {
      console.log("Setting filters[" + nick + "] = 'on'");
      if (!this.filters[nick]) {
        this.filters[nick] = new Filter();
      }
      this.filters[nick].enable;
    },
    unsetfilter: function(nick) {
      console.log("Setting filters[" + nick + "] = 'off'");
      if (!this.filters[nick]) {
        this.filters[nick] = new Filter();
      }
      this.filters[nick].disable;
    },
    toggle: function(nick) {
      this.filters[nick].toggle();
    },
    hasrecord: function(nick) {
      return this.filters.hasOwnProperty(nick);
    }
  };

  return {
   PlayerFrequency: PlayerFrequency, 
   Filter: Filter,
  };
})();

/*
window.plugin.PlayerFrequency.Classes = {
  // Member functions

};
*/

var setup = function() {
  pf = new window.plugin.PlayerFrequency.PlayerFrequency();
  if (!window.plugin.chatHooks) {
    debugger;
  }
  pf.layer = new L.LayerGroup();
  window.addLayerGroup('player-frequency', pf.layer, true);

  window.plugin.chatHooks.addChatHook('CH_PORTAL_LINKED', function (data) { return pf.linked_portal(data); });
  window.plugin.chatHooks.addChatHook('CH_RESO_DESTROYED', function (data) { return pf.resonator(data); }); // :     "destroyed a Resonator",
  window.plugin.chatHooks.addChatHook('CH_RESO_DEPLOYED', function (data) { return pf.resonator(data); }); // :      "deployed a Resonator",
  window.plugin.chatHooks.addChatHook('CH_PORTAL_CAPTURED', function (data) { return pf.portal(data); }); // :    "captured",
  window.plugin.chatHooks.addChatHook('CH_PORTAL_ATTACKED', function (data) { return pf.portal(data); }); // :    "is under attack",
  window.plugin.chatHooks.addChatHook('CH_PORTAL_NEUTRALISED', function (data) { return pf.portal(data); }); // : "neutralized",
  window.plugin.chatHooks.addChatHook('CH_LINK_DESTROYED', function (data) { return pf.linked_portal(data); }); //:     "destroyed the Link",
  window.plugin.chatHooks.addChatHook('CH_LINK_DESTROYED_OWN', function (data) { return pf.linked_portal(data); }); //: "Your Link",
  window.plugin.chatHooks.addChatHook('CH_FIELD_CREATED', function (data) { return pf.portal(data); }); //:      "created a Control Field",
  window.plugin.chatHooks.addChatHook('CH_FIELD_DESTROYED', function (data) { return pf.portal(data); }); //:    "destroyed a Control Field"
  //addHook('factionChatDataAvailable', window.plugin.chatHooks.handleFactionData);

  pf.setup();
  $('#toolbox').append(' <a onclick="pf.filterUsers()" title="Display users recorded for Frequency stats">Frequency player list</a>');
};

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
