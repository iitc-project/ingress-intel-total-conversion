// ==UserScript==
// @id             iitc-plugin-data-freezer@zaso
// @name           IITC plugin: Data Freezer
// @category       Tweaks
// @version        0.1.2.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Disable automatic portal data refresh.
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

  window.plugin.dataFreezer.noMoreData = 1000000;
  window.plugin.dataFreezer.defaultVal = 1.25;
  window.plugin.dataFreezer.storageKEY = 'plugin-data-freezer-status';
  window.plugin.dataFreezer.status;

  if(!localStorage[window.plugin.dataFreezer.storageKEY]) {
    localStorage[window.plugin.dataFreezer.storageKEY] = 1;
  }
  if(localStorage[window.plugin.dataFreezer.storageKEY] === '1') {
    window.plugin.dataFreezer.status = true;
    window.ON_MOVE_REFRESH = window.plugin.dataFreezer.noMoreData;
    window.mapRunsUserAction = true;
  } else {
    window.plugin.dataFreezer.status = false;
  }

  window.plugin.dataFreezer.toggle = function() {
    if(!window.plugin.dataFreezer.status) {
      window.plugin.dataFreezer.status = true;
      window.ON_MOVE_REFRESH = window.plugin.dataFreezer.noMoreData;
      localStorage[window.plugin.dataFreezer.storageKEY] = 1;
    } else {
      window.plugin.dataFreezer.status = false;
      window.ON_MOVE_REFRESH = window.plugin.dataFreezer.defaultVal;
      localStorage[window.plugin.dataFreezer.storageKEY] = 0;
    }

    window.plugin.dataFreezer.setupCSS();
    map.zoomOut(1, {animate:false});
    map.zoomIn(1, {animate:false});
  }

  window.plugin.dataFreezer.setupCSS = function() {
    if(window.plugin.dataFreezer.status === true) {
      $('a.dataFreezer').css({'background':'#f66','outline':'none'});
    } else {
      $('a.dataFreezer').css({'background':'#03DC03','outline':'none'});
    }
  }

  var setup =  function() {
    L.Control.Command = L.Control.extend({
      options:{position: 'topleft'},

      onAdd:function(map) {
        var controlDiv = L.DomUtil.create('div', 'leaflet-dataFreezer leaflet-control');
        var controlSubDIV = L.DomUtil.create('div', 'leaflet-bar', controlDiv);
        var butt = L.DomUtil.create('a', 'dataFreezer', controlSubDIV);
        butt.title = 'Enable/Disable data refresh';

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
    window.plugin.dataFreezer.setupCSS();

    window.addHook('checkRenderLimit', function() {
      if(window.plugin.dataFreezer.status) {
        window.mapRunsUserAction = true;
      }
    });
  }

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
