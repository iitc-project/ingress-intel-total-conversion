// ==UserScript==
// @id             iitc-plugin-data-freeze@zaso
// @name           IITC plugin: Data Freeze
// @category       Tweaks
// @version        0.0.9.@@DATETIMEVERSION@@
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

  window.plugin.dataFreeze.storageKEY = 'plugin-data-freeze-stastu';
  window.plugin.dataFreeze.noMoreData = 1000000;
  window.plugin.dataFreeze.defaultVal = 1.25;
  window.plugin.dataFreeze.status;

  if(!localStorage[window.plugin.dataFreeze.storageKEY]) {
    localStorage[window.plugin.dataFreeze.storageKEY] = 1;
  }
  if(localStorage[window.plugin.dataFreeze.storageKEY] === '1') {
    window.plugin.dataFreeze.status = true;
    window.ON_MOVE_REFRESH = window.plugin.dataFreeze.noMoreData;
  } else {
    window.plugin.dataFreeze.status = false;
  }

  window.plugin.dataFreeze.toggle = function() {
    if(!window.plugin.dataFreeze.status) {
      window.plugin.dataFreeze.status = true;
      window.ON_MOVE_REFRESH = window.plugin.dataFreeze.noMoreData;
      localStorage[window.plugin.dataFreeze.storageKEY] = 1;
    } else {
      window.plugin.dataFreeze.status = false;
      window.ON_MOVE_REFRESH = window.plugin.dataFreeze.defaultVal;
      localStorage[window.plugin.dataFreeze.storageKEY] = 0;
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

  window.plugin.dataFreeze.setupHTML = ''
    +'<div class="leaflet-control">'
      +'<div class="leaflet-bar">'
        +'<a class="dataFreeze" onclick="window.plugin.dataFreeze.toggle();return false;" title="Enable/Disable data refresh"></a>'
      +'</div>'
    +'</div>';

  var setup =  function() {
    $('.leaflet-control-container .leaflet-top.leaflet-left').append(window.plugin.dataFreeze.setupHTML);
    window.plugin.dataFreeze.setupCSS();
  }

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
