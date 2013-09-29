// ==UserScript==
// @id             iitc-plugin-data-freezer@zaso
// @name           IITC plugin: Data Freezer
// @category       Tweaks
// @version        0.1.5.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Disables map data refresh.
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

  window.plugin.dataFreezer.toggle = function() {
    if(window.mapDataRequest.MAP_DATA_ENABLED) {
      // Stop map data refresh
      window.mapDataRequest.MAP_DATA_ENABLED = false;
      localStorage[window.plugin.dataFreezer.storageKEY] = 0;
      $('a.dataFreezerBtn').addClass('noData');
      $('#updatestatus #innerstatus').hide();
      $('#updatestatus #datafreezer').show();
    } else {
      // Start map data refresh
      window.mapDataRequest.MAP_DATA_ENABLED = true;
      localStorage[window.plugin.dataFreezer.storageKEY] = 1;
      $('a.dataFreezerBtn').removeClass('noData');
      $('#updatestatus #innerstatus').show();
      $('#updatestatus #datafreezer').hide();
    }

    window.mapDataRequest.setStatus('refreshing');
    window.mapDataRequest.refreshOnTimeout(this.MOVE_REFRESH);
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
    if(!localStorage[window.plugin.dataFreezer.storageKEY]){
      localStorage[window.plugin.dataFreezer.storageKEY] = 1;
    }

    window.plugin.dataFreezer.setupCSS();
    $('#updatestatus #datafreezer').hide();
    if(localStorage[window.plugin.dataFreezer.storageKEY] === '0'){
      window.mapDataRequest.MAP_DATA_ENABLED = true;
      window.plugin.dataFreezer.toggle();
    }
  }

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@