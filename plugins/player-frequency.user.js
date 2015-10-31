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
        RESISTANCE: { color: this.FACTION_COLOURS.RESISTANCE }
      };
      this.userfilter = new userfilter();
    var self = this;
  };
  PlayerFrequency.prototype = {
    
    // Member functions
    resonator: function(data) {
      portal = data.portals[0];
      //console.log("resonator event @ " + portal.latE6/1E6 + "," + portal.lngE6/1E6);
      lat = portal.latE6/1E6;
      lng = portal.lngE6/1E6;
      style = data.team;
      this.addCircle(lat, lng, this.styles[style]);
      this.userfilter.setfilter(data.nick);
    },
    portal: function(data) {
      portal = data.portals[0];
      //console.log("resonator event @ " + portal.latE6/1E6 + "," + portal.lngE6/1E6);
      lat = portal.latE6/1E6;
      lng = portal.lngE6/1E6;
      style = data.team;
      this.addCircle(lat, lng, this.styles[style]);
      this.userfilter.setfilter(data.nick);
    },
    linked_portal: function(data) {
      portal = data.portals[0];
      str = data.time + ": from " + portal.name + " to " + data.portals[1].name;
      str += " linked by " + data.nick;
      //console.log(str);
      //L.circle(L.latLng(portal.latE6/1E6, portal.lngE6/1E6), 40, fill=true).addTo(plugin.PlayerFrequency.layer)
      lat = portal.latE6/1E6;
      lng = portal.lngE6/1E6;
      style = data.team;
      this.addCircle(lat, lng, this.styles[style]);
      this.userfilter.setfilter(data.nick);
    },
    addCircle: function(lat, lng, style) {
      console.log("Adding circle at " + lat + ", " + lng);

      style.fill = true;

      L.circle(L.latLng(lat, lng), 40, style).addTo(this.layer);
      // plugin.PlayerFrequency.showUsers();
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

    update_cb: function(nick) {
      var userfilter = this.userfilter;
      // find dom for this cb
      cb = $('input[name="players"][value=nick]');
      // find state of checkbox
      cb_state = cb.prop("checked");
      // update filter and update cb state to match filter
      if (userfilter.filters[nick] === "on") {
        userfilter.unsetfilter(nick);
        cb.prop("checked", false);
      } else {
        userfilter.setfilter(nick);
        cb.prop("checked", true);
      }
    },

    filterUsers: function() {
      var userfilter = this.userfilter.filters;
      var names = this.userfilter.names;
      var names_checkboxes = "<fieldset>";
      names_checkboxes += "<legend>Players with current frequency data:</legend>";

      console.log("filterUsers 1");
      for (var nick in names) {
        checked = userfilter[nick] === "on" ? "checked" : "";
        var value = 'value="' + nick + '"';
        var checked_opt = checked ? 'checked' : '';
        var onclick_opt = 'onchange="pf.update_cb(\'' + nick + '\')"';
        console.log("value: " + value);
        console.log("checked: " + checked);
        console.log("onclick: " + onclick);
        names_checkboxes += '<input type="checkbox" name="players" ' + value + ' ' + checked_opt + ' ' + onclick_opt + ' />' + nick + '<br/>';

      }
      console.log("filterUsers 2");
      names_checkboxes += "</fieldset>";

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
      self.enabled = true;
    },
    disable: function() {
      self.enabled = false;
    },
  };

  var userfilter = function() {
    this.filters = {};
    this.names = [];
  };
  userfilter.prototype = {
      setfilter: function(nick) {
        console.log("Setting filters[" + nick + "] = 'on'");
        this.filters[nick] = "on";
        this.names[nick] = true;
      },
      unsetfilter: function(nick) {
        console.log("Setting filters[" + nick + "] = 'off'");
        this.filters[nick] = "off";
        this.names[nick] = true;
      },
  };

  return {
   PlayerFrequency: PlayerFrequency, 
   Filter: Filter,
  };
})();

window.plugin.PlayerFrequency.Classes = {
  // Member functions

};

var setup = function() {
  pf = new window.plugin.PlayerFrequency.PlayerFrequency();
  if (!window.plugin.chatHooks) {

  }
  pf.layer = new L.LayerGroup();
  window.addLayerGroup('player-frequency', pf.layer, true);

  window.plugin.chatHooks.addChatHook('CH_PORTAL_LINKED', function (data) { return pf.linked_portal(data); });
  window.plugin.chatHooks.addChatHook('CH_RESO_DESTROYED', function (data) { return pf.resonator(data); }); // :     "destroyed a Resonator",
  window.plugin.chatHooks.addChatHook('CH_RESO_DEPLOYED', function (data) { return pf.resonator(data); }); // :      "deployed a Resonator",
  window.plugin.chatHooks.addChatHook('CH_PORTAL_CAPTURED', function (data) { return pf.portal(data); }); // :    "captured",
  window.plugin.chatHooks.addChatHook('CH_PORTAL_ATTACKED', function (data) { return pf.portal(data); }); // :    "is under attack",
  window.plugin.chatHooks.addChatHook('CH_PORTAL_NEUTRALISED', function (data) { return pf.portal(data); }); // : "neutralized",
  window.plugin.chatHooks.addChatHook('CH_LINK_DESTROYED', function (data) { return pf.portal(data); }); //:     "destroyed the Link",
  window.plugin.chatHooks.addChatHook('CH_LINK_DESTROYED_OWN', function (data) { return pf.portal(data); }); //: "Your Link",
  window.plugin.chatHooks.addChatHook('CH_FIELD_CREATED', function (data) { return pf.portal(data); }); //:      "created a Control Field",
  window.plugin.chatHooks.addChatHook('CH_FIELD_DESTROYED', function (data) { return pf.portal(data); }); //:    "destroyed a Control Field"
  //addHook('factionChatDataAvailable', window.plugin.chatHooks.handleFactionData);

  pf.setup();
  $('#toolbox').append(' <a onclick="pf.filterUsers()" title="Display users recorded for Frequency stats">Frequency player list</a>');
};

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
