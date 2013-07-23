// ==UserScript==
// @id             iitc-plugin-player-range@zaso
// @name           IITC plugin: Player Range (hack and XMP)
// @category       Layer
// @version        0.1.3.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Add one or more player markers and his ranges (hack range and xmp range) on the map.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

  // use own namespace for plugin
  window.plugin.playerRange = function() {};

  window.plugin.playerRange.locStore = 'pluginPlayerRange';

  window.plugin.playerRange.setupCSS = function() {
    var colorFaction;
    switch(window.PLAYER.team) {
      case('ALIENS'): colorFaction = 'left top'; break;
      case('RESISTANCE'): colorFaction = 'right top'; break;
      default:colorFaction = 'left bottom'; break;
    }

    $("<style>").prop("type", "text/css").html(
      '.playerIcon,.playerRangeButton,.setRangeButton{background-position:'+colorFaction+';background-repeat:no-repeat;background-image:url(@@INCLUDEIMAGE:plugins/player-range.png@@);}'
      +'.playerRangeButton{background-position:6px -25px !important;}'
      +'.setRangeButton{background-position:-18px -25px !important;border-radius:0 0 4px 4px;}'
      +'.rangeList{display:none;position:absolute;background:#fff;padding:7px;left:35px;top:27px;width:70px;}'
      +'.rangeList input{height:auto}'
    ).appendTo("head");
  };

  window.plugin.playerRange.drawMarker = function() {
    var latlng = map.getCenter();
    var icc = new L.divIcon({
      iconSize: new L.Point(19, 25),
      className:'playerIcon',
    });

    var arrowMark = new L.Marker(latlng, {icon:icc, draggable:true});
    var circleHack = new L.circle(latlng, 40, {color:"#eb0",fill:false,weight:1,clickable:false,opacity:0.7});
    var circleL1 = new L.circle(latlng, 42, {color:"#FECE5A",fill:false,weight:1,clickable:false,opacity:0.7});
    var circleL2 = new L.circle(latlng, 48, {color:"#FFA630",fill:false,weight:1,clickable:false,opacity:0.7});
    var circleL3 = new L.circle(latlng, 58, {color:"#FF7315",fill:false,weight:1,clickable:false,opacity:0.7});
    var circleL4 = new L.circle(latlng, 72, {color:"#E40000",fill:false,weight:1,clickable:false,opacity:0.7});
    var circleL5 = new L.circle(latlng, 90, {color:"#FD2992",fill:false,weight:1,clickable:false,opacity:0.7});
    var circleL6 = new L.circle(latlng, 112, {color:"#EB26CD",fill:false,weight:1,clickable:false,opacity:0.7});
    var circleL7 = new L.circle(latlng, 138, {color:"#C124E0",fill:false,weight:1,clickable:false,opacity:0.7});
    var circleL8 = new L.circle(latlng, 168, {color:"#9627F4",fill:false,weight:1,clickable:false,opacity:0.7});

    arrowMark.addTo(window.plugin.playerRange.mark);
    circleHack.addTo(window.plugin.playerRange.hack);
    circleL1.addTo(window.plugin.playerRange.L1);
    circleL2.addTo(window.plugin.playerRange.L2);
    circleL3.addTo(window.plugin.playerRange.L3);
    circleL4.addTo(window.plugin.playerRange.L4);
    circleL5.addTo(window.plugin.playerRange.L5);
    circleL6.addTo(window.plugin.playerRange.L6);
    circleL7.addTo(window.plugin.playerRange.L7);
    circleL8.addTo(window.plugin.playerRange.L8);

    arrowMark.on('drag', function(e) {
      circleHack.setLatLng(arrowMark.getLatLng());
      circleL1.setLatLng(arrowMark.getLatLng());
      circleL2.setLatLng(arrowMark.getLatLng());
      circleL3.setLatLng(arrowMark.getLatLng());
      circleL4.setLatLng(arrowMark.getLatLng());
      circleL5.setLatLng(arrowMark.getLatLng());
      circleL6.setLatLng(arrowMark.getLatLng());
      circleL7.setLatLng(arrowMark.getLatLng());
      circleL8.setLatLng(arrowMark.getLatLng());
    });

    arrowMark.on('dblclick', function(e) {
      map.removeLayer(circleHack);
      map.removeLayer(circleL1);
      map.removeLayer(circleL2);
      map.removeLayer(circleL3);
      map.removeLayer(circleL4);
      map.removeLayer(circleL5);
      map.removeLayer(circleL6);
      map.removeLayer(circleL7);
      map.removeLayer(circleL8);
      map.removeLayer(arrowMark);
    });

    arrowMark.on('remove', function(e) {
      arrowMark.off('drag');
      arrowMark.off('dblclick');
      arrowMark.off('remove');
    });

    map.on('zoomend', function(e) {
      arrowMark.setLatLng(circleHack.getLatLng());
    });
  }

  window.plugin.playerRange.setRange = function(el) {
    var range = el.data('range');
    var ls = JSON.parse(localStorage[window.plugin.playerRange.locStore]);

    if(el.is(':checked')) {
      window.plugin.playerRange.pLayerGroup.addLayer(window.plugin.playerRange[range]);
      ls[range] = 1;
    }else{
      window.plugin.playerRange.pLayerGroup.removeLayer(window.plugin.playerRange[range]);
      ls[range] = 0;
    }
    localStorage[window.plugin.playerRange.locStore] = JSON.stringify(ls);
  }

  window.plugin.playerRange.setupHTML = ''
    +'<div class="leaflet-playerrange leaflet-control">'
      +'<div class="leaflet-bar">'
        +'<a class="playerRangeButton" onclick="window.plugin.playerRange.drawMarker();return false;" title="Add a player marker.\n\nDoubleClick on a marker to remove it."></a>'
        +'<a class="setRangeButton" onclick="$(\'.rangeList\').toggle();return false;" title="Click to set the ranges."></a>'
        +'<div class="rangeList leaflet-bar">'
          +'<label><input type="checkbox" checked name="xmpRange" data-range="hack" /> Hack</label><br/>'
          +'<label><input type="checkbox" checked name="xmpRange" data-range="L1" /> XMP L1</label><br/>'
          +'<label><input type="checkbox" checked name="xmpRange" data-range="L2" /> XMP L2</label><br/>'
          +'<label><input type="checkbox" checked name="xmpRange" data-range="L3" /> XMP L3</label><br/>'
          +'<label><input type="checkbox" checked name="xmpRange" data-range="L4" /> XMP L4</label><br/>'
          +'<label><input type="checkbox" checked name="xmpRange" data-range="L5" /> XMP L5</label><br/>'
          +'<label><input type="checkbox" checked name="xmpRange" data-range="L6" /> XMP L6</label><br/>'
          +'<label><input type="checkbox" checked name="xmpRange" data-range="L7" /> XMP L7</label><br/>'
          +'<label><input type="checkbox" checked name="xmpRange" data-range="L8" /> XMP L8</label><br/>'
        +'</div>'
      +'</div>'
    +'</div>';

  var setup = function() {
    window.plugin.playerRange.setupCSS();

    window.plugin.playerRange.pLayerGroup = new L.LayerGroup();

    window.plugin.playerRange.mark = new L.LayerGroup();
    window.plugin.playerRange.hack = new L.LayerGroup();
    window.plugin.playerRange.L1 = new L.LayerGroup();
    window.plugin.playerRange.L2 = new L.LayerGroup();
    window.plugin.playerRange.L3 = new L.LayerGroup();
    window.plugin.playerRange.L4 = new L.LayerGroup();
    window.plugin.playerRange.L5 = new L.LayerGroup();
    window.plugin.playerRange.L6 = new L.LayerGroup();
    window.plugin.playerRange.L7 = new L.LayerGroup();
    window.plugin.playerRange.L8 = new L.LayerGroup();

    window.plugin.playerRange.pLayerGroup.addLayer(window.plugin.playerRange.mark);
    window.plugin.playerRange.pLayerGroup.addLayer(window.plugin.playerRange.hack);
    window.plugin.playerRange.pLayerGroup.addLayer(window.plugin.playerRange.L1);
    window.plugin.playerRange.pLayerGroup.addLayer(window.plugin.playerRange.L2);
    window.plugin.playerRange.pLayerGroup.addLayer(window.plugin.playerRange.L3);
    window.plugin.playerRange.pLayerGroup.addLayer(window.plugin.playerRange.L4);
    window.plugin.playerRange.pLayerGroup.addLayer(window.plugin.playerRange.L5);
    window.plugin.playerRange.pLayerGroup.addLayer(window.plugin.playerRange.L6);
    window.plugin.playerRange.pLayerGroup.addLayer(window.plugin.playerRange.L7);
    window.plugin.playerRange.pLayerGroup.addLayer(window.plugin.playerRange.L8);

    window.addLayerGroup('Player Range', window.plugin.playerRange.pLayerGroup, true);

    $('.leaflet-control-container .leaflet-top.leaflet-left').append(window.plugin.playerRange.setupHTML);

    $('.rangeList input[name=xmpRange]').change(function() {
      window.plugin.playerRange.setRange($(this));
    });

    //hide the controls when the layer is off, show it when on
    map.on('layeradd', function(obj) {
      if(obj.layer === window.plugin.playerRange.pLayerGroup) {
        $('.leaflet-playerrange').show();
      }
    });
    map.on('layerremove', function(obj) {
      if(obj.layer === window.plugin.playerRange.pLayerGroup) {
        $('.leaflet-playerrange').hide();
      }
    });
    if(!map.hasLayer(window.plugin.playerRange.pLayerGroup)) {
      $('.leaflet-playerrange').hide();
    }

    if(!localStorage[window.plugin.playerRange.locStore]) {
      localStorage[window.plugin.playerRange.locStore] = '{"hack":1,"L1":1,"L2":1,"L3":1,"L4":1,"L5":1,"L6":1,"L7":1,"L8":1}'
    } else {
      var rangeList = JSON.parse(localStorage[window.plugin.playerRange.locStore]);
      for(var key in rangeList) {
        if(rangeList[key] === 1) {
          $('.rangeList input[data-range='+key+']').attr('checked', true);
          window.plugin.playerRange.pLayerGroup.addLayer(window.plugin.playerRange[key]);
        } else {
          $('.rangeList input[data-range='+key+']').attr('checked', false);
          window.plugin.playerRange.pLayerGroup.removeLayer(window.plugin.playerRange[key]);
        }
      }
    }
  }


// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@