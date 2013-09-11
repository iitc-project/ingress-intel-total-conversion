// ==UserScript==
// @id             iitc-plugin-data-freezer@zaso
// @name           IITC plugin: Data Freezer
// @category       Tweaks
// @version        0.1.3.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Disables the data refresh.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

  // use own namespace for plugin
  window.plugin.dataFreezer = function() {};

  window.plugin.dataFreezer.storageKEY = 'plugin-data-freezer';
  window.plugin.dataFreezer.status;
  window.plugin.dataFreezer.defaultVal = [4, 0.5, 200, 100]; // MAX_REQUESTS, REFRESH_CLOSE, CHAT_PUBLIC_ITEMS, CHAT_FACTION_ITEMS
  window.plugin.dataFreezer.noMoreData = [0, 9999999]; // (MAX_REQUESTS, CHAT_PUBLIC_ITEMS, CHAT_FACTION_ITEMS), REFRESH_CLOSE

  window.plugin.dataFreezer.toggle = function() {
    if(window.plugin.dataFreezer.status === false) {
      window.plugin.dataFreezer.status = true;
      localStorage[window.plugin.dataFreezer.storageKEY] = 1;

      // Freezes the data map
      window.mapDataRequest.MAX_REQUESTS = window.plugin.dataFreezer.noMoreData[0];
      window.mapDataRequest.REFRESH_CLOSE = window.plugin.dataFreezer.noMoreData[1];

      // Freezes the chat
      window.CHAT_PUBLIC_ITEMS = window.plugin.dataFreezer.noMoreData[0];
      window.CHAT_FACTION_ITEMS = window.plugin.dataFreezer.noMoreData[0];
      chat.requestFaction(false);
      chat.requestPublic(false);
    } else {
      window.plugin.dataFreezer.status = false;
      localStorage[window.plugin.dataFreezer.storageKEY] = 0;

      // Starts the data map
      window.mapDataRequest.MAX_REQUESTS = window.plugin.dataFreezer.defaultVal[0];
      window.mapDataRequest.REFRESH_CLOSE = window.plugin.dataFreezer.defaultVal[1];

      // Starts the chat
      window.CHAT_PUBLIC_ITEMS = window.plugin.dataFreezer.defaultVal[3];
      window.CHAT_FACTION_ITEMS = window.plugin.dataFreezer.defaultVal[4];
      chat.requestFaction(true);
      chat.requestPublic(true);
    }
    window.plugin.dataFreezer.setupCSS();
    // Creates a movement on the map to refresh it
    map.zoomOut(1, {animate:false});
    map.zoomIn(1, {animate:false});
  }

  window.plugin.dataFreezer.setupCSS = function() {
    if(window.plugin.dataFreezer.status === true) {
      $('a.dataFreezer').css({'background':'#f66','outline':'none'});
      $('#updatestatus #innerstatus').hide();
      $('#updatestatus #datafreezer').show();
    } else {
      $('a.dataFreezer').css({'background':'#03DC03','outline':'none'});
      $('#updatestatus #innerstatus').show();
      $('#updatestatus #datafreezer').hide();
    }
  }

  var setup = function() {
    L.Control.Command = L.Control.extend({
      options:{position: 'topleft'},

      onAdd:function(map) {
        var controlDiv = L.DomUtil.create('div', 'leaflet-dataFreezer leaflet-control');
        var controlSubDIV = L.DomUtil.create('div', 'leaflet-bar', controlDiv);
        var butt = L.DomUtil.create('a', 'dataFreezer', controlSubDIV);
        butt.title = 'Enables/Disables the data refresh';

        L.DomEvent
          .addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
          .addListener(controlDiv, 'click', L.DomEvent.preventDefault)
          .addListener(controlDiv, 'dblclick', L.DomEvent.stopPropagation)
          .addListener(controlDiv, 'dblclick', L.DomEvent.preventDefault)
          .addListener(butt, 'click', function() {
            window.plugin.dataFreezer.toggle();
          });

        return controlDiv;
      }
    });
    L.control.command = function(options) { return new L.Control.Command(options); };
    map.addControl(new L.control.command());

    $('#updatestatus #innerstatus').after('<div id="datafreezer"><b>map</b>: freezed</div>');

    if(!localStorage[window.plugin.dataFreezer.storageKEY]) {
      localStorage[window.plugin.dataFreezer.storageKEY] = 1;
    }
    if(localStorage[window.plugin.dataFreezer.storageKEY] === '1') {
      window.plugin.dataFreezer.status = false;
      window.plugin.dataFreezer.toggle();
    } else {
      window.plugin.dataFreezer.setupCSS();
    }
  }

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@