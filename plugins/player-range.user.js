// ==UserScript==
// @id             iitc-plugin-player-range@zaso
// @name           IITC plugin: Player Range (hack and XMP)
// @category       Layer
// @version        0.1.45.@@DATETIMEVERSION@@
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
  window.plugin.playerRange.rangeVal = [window.HACK_RANGE, 42, 48, 58, 72, 90, 112, 138, 168];
  window.plugin.playerRange.keyGroup = ['hack', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'mark'];

  window.plugin.playerRange.setupCSS = function() {
    var colorFaction;
    switch(window.PLAYER.team) {
      case('ALIENS'): colorFaction = 'left top'; break;
      case('RESISTANCE'): colorFaction = 'right top'; break;
      default:colorFaction = 'left bottom'; break;
    }

    var mobileStyle;
    if(typeof android !== 'undefined' && android) {
      mobileStyle = ''
        +'.rangeList{top:34px;left:45px;}'
        +'.rangeList label{padding:3px 2px;border-bottom:1px solid #ccc;color:#aaa;}'
        +'.rangeList label.check{color:#000;}'
        +'.rangeList input{display:none;}';
    }

    $("<style>").prop("type", "text/css").html(''
      +'.playerIcon,.playerRangeButton,.setRangeButton{'
        +'background-image:url(@@INCLUDEIMAGE:plugins/player-range.png@@);'
        +'background-position:'+colorFaction+';'
        +'background-repeat:no-repeat;'
      +'}'
      +'.playerRangeButton{background-position:6px -25px !important;}'
      +'.setRangeButton{background-position:-18px -25px !important;border-radius:0 0 4px 4px;}'
      +'.rangeList{display:none;position:absolute;background:#fff;padding:7px;left:35px;top:27px;width:75px !important;}'
      +'.rangeList label{width:70px !important;display:inline-block !important;color:#000;}'
      +'.rangeList input{height:auto}'
      +mobileStyle
    ).appendTo("head");
  };

  window.plugin.playerRange.drawMarker = function() {
    var latlng = map.getCenter();
    var icc = new L.divIcon({
      iconSize: new L.Point(19, 25),
      className:'playerIcon',
    });

    var pLayer_range = new Array();

    // Hack Range
    pLayer_range[0] = new L.circle(latlng, window.plugin.playerRange.rangeVal[0], {color:window.ACCESS_INDICATOR_COLOR,fill:false,weight:1,clickable:false,opacity:0.7});
    // XMP Range
    for(var i=1;i<=8;i++) {
      pLayer_range[i] = new L.circle(latlng, window.plugin.playerRange.rangeVal[i], {color:window.COLORS_LVL[i],fill:false,weight:1,clickable:false,opacity:0.7});
    }
    // Arrow
    pLayer_range[9] = new L.Marker(latlng, {icon:icc, draggable:true});

    // Add elements to the layers
    for(var i=0;i<=9;i++) {
      pLayer_range[i].addTo(window.plugin.playerRange[window.plugin.playerRange.keyGroup[i]]);
    }

    // Repositions the ranges when the arrow is dragged
    pLayer_range[9].on('drag', function(e) {
      for(var i=0;i<=8;i++) {
        pLayer_range[i].setLatLng(pLayer_range[9].getLatLng());
      }
    });

    // Remove the elements fron the layers
    pLayer_range[9].on('dblclick', function(e) {
      for(var i=0;i<=9;i++) {
        window.plugin.playerRange[window.plugin.playerRange.keyGroup[i]].removeLayer(pLayer_range[i]);
      }
    });

    // Repositions the arrow when the map is zoomed
    map.on('zoomend', function(e) {
      pLayer_range[9].setLatLng(pLayer_range[0].getLatLng());
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
    el.parent('label').toggleClass('check');
    localStorage[window.plugin.playerRange.locStore] = JSON.stringify(ls);
  }

  window.plugin.playerRange.hideControls = function() {
    // Hide the controls when the layer is off, show it when on
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
  }

  window.plugin.playerRange.manageStorage = function() {
    if(!localStorage[window.plugin.playerRange.locStore]) {
      localStorage[window.plugin.playerRange.locStore] = '{"hack":1,"L1":1,"L2":1,"L3":1,"L4":1,"L5":1,"L6":1,"L7":1,"L8":1}'
    } else {
      var rangeList = JSON.parse(localStorage[window.plugin.playerRange.locStore]);
      for(var key in rangeList) {
        if(rangeList[key] === 0) {
          $('.rangeList input[data-range='+key+']').attr('checked', false).parent('label').removeClass('check');
          window.plugin.playerRange.pLayerGroup.removeLayer(window.plugin.playerRange[key]);
        }
      }
    }
  }

  window.plugin.playerRange.setupHTML = ''
    +'<div class="rangeList leaflet-bar">'
      +'<label class="check"><input type="checkbox" checked name="xmpRange" data-range="hack" /> Hack</label>'
      +'<label class="check"><input type="checkbox" checked name="xmpRange" data-range="L1" /> XMP L1</label>'
      +'<label class="check"><input type="checkbox" checked name="xmpRange" data-range="L2" /> XMP L2</label>'
      +'<label class="check"><input type="checkbox" checked name="xmpRange" data-range="L3" /> XMP L3</label>'
      +'<label class="check"><input type="checkbox" checked name="xmpRange" data-range="L4" /> XMP L4</label>'
      +'<label class="check"><input type="checkbox" checked name="xmpRange" data-range="L5" /> XMP L5</label>'
      +'<label class="check"><input type="checkbox" checked name="xmpRange" data-range="L6" /> XMP L6</label>'
      +'<label class="check"><input type="checkbox" checked name="xmpRange" data-range="L7" /> XMP L7</label>'
      +'<label class="check"><input type="checkbox" checked name="xmpRange" data-range="L8" /> XMP L8</label>'
    +'</div>';

  var setup = function() {
    window.plugin.playerRange.setupCSS();

    // Create the main layer
    window.plugin.playerRange.pLayerGroup = new L.LayerGroup();

    // Create the subLayers and append the subLayers to the main layer
    for(var i=0;i<=9;i++) {
      window.plugin.playerRange[window.plugin.playerRange.keyGroup[i]] = new L.LayerGroup();
      window.plugin.playerRange.pLayerGroup.addLayer(window.plugin.playerRange[window.plugin.playerRange.keyGroup[i]]);
    }

    // Append the main layer to the map
    window.addLayerGroup('Player Range', window.plugin.playerRange.pLayerGroup, true);

    L.Control.PlayerRangeControl = L.Control.extend({
      options:{position: 'topleft'},

      onAdd:function(map) {
        var controlDiv = L.DomUtil.create('div', 'leaflet-playerrange');
        var controlSubDIV = L.DomUtil.create('div', 'leaflet-bar', controlDiv);

        var butt_1 = L.DomUtil.create('a', 'playerRangeButton', controlSubDIV);
        butt_1.title = 'Add a player marker.\n\nDoubleClick on a marker to remove it.';

        var butt_2 = L.DomUtil.create('a', 'setRangeButton', controlSubDIV);
        butt_2.title = 'Click to set the ranges.';

        L.DomEvent
          .addListener(butt_1, 'click', L.DomEvent.stopPropagation)
          .addListener(butt_1, 'click', L.DomEvent.preventDefault)
          .addListener(butt_1, 'click', function() {
            window.plugin.playerRange.drawMarker();
          })
          .addListener(butt_2, 'click', L.DomEvent.stopPropagation)
          .addListener(butt_2, 'click', L.DomEvent.preventDefault)
          .addListener(butt_2, 'click', function() {
            $('.rangeList').toggle();
          })
        ;
        return controlDiv;
      }
    });
    L.control.playerRangeControl = function(options) { return new L.Control.PlayerRangeControl(options); };
    map.addControl(new L.control.playerRangeControl());

    $('.leaflet-playerrange').append(window.plugin.playerRange.setupHTML);

    $('.rangeList input[name=xmpRange]').change(function() {
      window.plugin.playerRange.setRange($(this));
    });

    window.plugin.playerRange.manageStorage();
    window.plugin.playerRange.hideControls();
  }

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@