// ==UserScript==
// @id             iitc-plugin-data-freezer@zaso
// @name           IITC plugin: Data Freezer
// @category       Tweaks
// @version        0.1.4.@@DATETIMEVERSION@@
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

      // Freezes map data refresh
      window.mapDataRequest.MAX_REQUESTS = window.plugin.dataFreezer.noMoreData[0];
      window.mapDataRequest.REFRESH_CLOSE = window.plugin.dataFreezer.noMoreData[1];

      // Freezes chat data refresh
      window.CHAT_PUBLIC_ITEMS = window.plugin.dataFreezer.noMoreData[0];
      window.CHAT_FACTION_ITEMS = window.plugin.dataFreezer.noMoreData[0];

      $('a.dataFreezerBtn').addClass('noData');
      $('#updatestatus #innerstatus').hide();
      $('#updatestatus #datafreezer').show();
    } else {
      window.plugin.dataFreezer.status = false;
      localStorage[window.plugin.dataFreezer.storageKEY] = 0;

      // Re-starts map data refresh
      window.mapDataRequest.MAX_REQUESTS = window.plugin.dataFreezer.defaultVal[0];
      window.mapDataRequest.REFRESH_CLOSE = window.plugin.dataFreezer.defaultVal[1];

      // Re-starts chat data refresh
      window.CHAT_PUBLIC_ITEMS = window.plugin.dataFreezer.defaultVal[2];
      window.CHAT_FACTION_ITEMS = window.plugin.dataFreezer.defaultVal[3];

      $('a.dataFreezerBtn').removeClass('noData');;
      $('#updatestatus #innerstatus').show();
      $('#updatestatus #datafreezer').hide();
    }

    // Creates a movement on the map to refresh it
    map.zoomOut(1, {animate:false});
    map.zoomIn(1, {animate:false});
  }

  window.plugin.dataFreezer.setupCSS = function() {
    $("<style>").prop("type", "text/css").html(''
      +'.leaflet-dataFreezer a.dataFreezerBtn, .leaflet-dataFreezer a.dataFreezerBtn:hover{outline:none;background:#03DC03 url(@@INCLUDEIMAGE:images/refresh-icon.png@@) no-repeat center center;}'
      +'.leaflet-dataFreezer a.dataFreezerBtn.noData, .leaflet-dataFreezer a.dataFreezerBtn.noData:hover{background-color:#f66;}'
    ).appendTo("head");
  }

  var setup = function() {
    L.Control.Command = L.Control.extend({
      options:{position: 'topleft'},

      onAdd:function(map) {
        var controlDiv = L.DomUtil.create('div', 'leaflet-dataFreezer leaflet-control');
        var controlSubDIV = L.DomUtil.create('div', 'leaflet-bar', controlDiv);
        var butt = L.DomUtil.create('a', 'dataFreezerBtn', controlSubDIV);
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

    window.plugin.dataFreezer.setupCSS();

    if(!localStorage[window.plugin.dataFreezer.storageKEY]) {
      localStorage[window.plugin.dataFreezer.storageKEY] = 1;
    }
    if(localStorage[window.plugin.dataFreezer.storageKEY] === '1') {
      // Disables data refresh
      window.plugin.dataFreezer.status = false;
    } else {
      // Enables data refresh
      window.plugin.dataFreezer.status = true;
    }
    window.plugin.dataFreezer.toggle();
  }

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@