// ==UserScript==
// @id             iitc-plugin-data-freeze@zaso
// @name           IITC plugin: Data Freeze
// @category       Tweaks
// @version        0.1.0.@@DATETIMEVERSION@@
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
  window.plugin.dataFreeze = function() {};

  window.plugin.dataFreeze.noMoreData = 1000000;
  window.plugin.dataFreeze.defaultVal = 1.25;

  window.plugin.dataFreeze.status = true;
  window.ON_MOVE_REFRESH = window.plugin.dataFreeze.noMoreData;

  window.plugin.dataFreeze.toggle = function() {
    if(!window.plugin.dataFreeze.status) {
      window.plugin.dataFreeze.status = true;
      window.ON_MOVE_REFRESH = window.plugin.dataFreeze.noMoreData;
    } else {
      window.plugin.dataFreeze.status = false;
      window.ON_MOVE_REFRESH = window.plugin.dataFreeze.defaultVal;
    }

    window.plugin.dataFreeze.setupCSS();
    map.zoomOut(1, {animate:false});
    map.zoomIn(1, {animate:false});
  }

  window.plugin.dataFreeze.setupCSS = function() {
    if(window.plugin.dataFreeze.status === true) {
      $('a.dataFreeze').css('background','#f66');
    } else {
      $('a.dataFreeze').css('background','#03DC03');
    }
  }

  var setup =  function() {
    L.Control.Command = L.Control.extend({
      options:{position: 'topleft'},

      onAdd:function(map){
        var controlDiv = L.DomUtil.create('div', 'leaflet-control');
        var controlSubDIV = L.DomUtil.create('div', 'leaflet-bar', controlDiv);
        var butt = L.DomUtil.create('a', 'dataFreeze', controlSubDIV);
        butt.title = 'Enable/Disable data refresh';

        L.DomEvent
          .addListener(butt, 'click', L.DomEvent.stopPropagation)
          .addListener(butt, 'click', L.DomEvent.preventDefault)
          .addListener(butt, 'click', function(){
            window.plugin.dataFreeze.toggle();
          })
          .addListener(butt, 'dblclick', L.DomEvent.stopPropagation)
          .addListener(butt, 'dblclick', L.DomEvent.preventDefault)
        ;
        return controlDiv;
      }
    });
    L.control.command = function(options){ return new L.Control.Command(options); };

    map.addControl(new L.control.command());
    window.plugin.dataFreeze.setupCSS();
  }

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
