// ==UserScript==
// @id             iitc-plugin-player-ranges@zaso
// @name           IITC plugin: Player Ranges
// @category       Layer
// @version        0.1.51.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Add one or more player markers and his ranges (hack/deploy range and xmp ranges) on the map.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

  // use own namespace for plugin
  window.plugin.playerRanges = function() {};

  window.plugin.playerRanges.locStore = 'plugin-playerRanges';
  window.plugin.playerRanges.rangeVal = [window.HACK_RANGE, 42, 48, 58, 72, 90, 112, 138, 168];
  window.plugin.playerRanges.keyGroup = ['hack', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'mark'];

  window.plugin.playerRanges.setupCSS = function() {
    var colorTeam;
    switch(window.PLAYER.team) {
      case('ENLIGHTENED'): colorTeam = 'left top'; break;
      case('RESISTANCE'): colorTeam = 'right top'; break;
      default:colorTeam = 'left bottom'; break;
    }

    var mobileStyle = '';
    if(typeof android !== 'undefined' && android) {
      mobileStyle = ''
        +'.rangesList{top:34px;left:45px;}'
        +'.rangesList label{padding:3px 2px;border-bottom:1px solid #ccc;color:#aaa;}'
        +'.rangesList label.check{color:#000;}'
        +'.rangesList input{display:none;}';
    }

    $("<style>").prop("type", "text/css").html(''
      +'.playerIcon,.playerRangesButton,.setRangesButton{'
        +'background-image:url(@@INCLUDEIMAGE:plugins/player-ranges.png@@);'
        +'background-position:'+colorTeam+';'
        +'background-repeat:no-repeat;'
        +'outline:none !important;'
      +'}'
      +'.playerRangesButton{background-position:6px -25px !important;}'
      +'.setRangesButton{background-position:-18px -25px !important;border-radius:0 0 4px 4px;}'
      +'.rangesList{display:none;position:absolute;background:#fff;padding:7px;left:35px;top:27px;width:98px !important;z-index:1000;}'
      +'.rangesList label{width:98px !important;display:inline-block !important;color:#000;font-size:12px;}'
      +'.rangesList input{height:auto}'
      +mobileStyle
    ).appendTo("head");
  }

  window.plugin.playerRanges.drawMarker = function() {
    var latlng = map.getCenter();
    var icc = new L.divIcon({
      iconSize: new L.Point(19, 25),
      className:'playerIcon',
    });

    var pLayer_range = new Array();

    // Hack Range
    pLayer_range[0] = new L.circle(latlng, window.plugin.playerRanges.rangeVal[0], {color:window.ACCESS_INDICATOR_COLOR,fill:false,weight:1,clickable:false,opacity:0.7});
    // XMP Range
    for(var i=1;i<=8;i++) {
      pLayer_range[i] = new L.circle(latlng, window.plugin.playerRanges.rangeVal[i], {color:window.COLORS_LVL[i],fill:false,weight:1,clickable:false,opacity:0.7,dashArray: [10,6]});
    }
    // Arrow
    pLayer_range[9] = new L.Marker(latlng, {icon:icc, draggable:true});

    // Add elements to the layers
    for(var i=0;i<=9;i++) {
      pLayer_range[i].addTo(window.plugin.playerRanges[window.plugin.playerRanges.keyGroup[i]]);
    }

    // Repositions the ranges when the arrow is dragged
    pLayer_range[9].on('drag', function(e) {
      for(var i=0;i<=8;i++) {
        pLayer_range[i].setLatLng(pLayer_range[9].getLatLng());
      }
    });

    // Remove the elements from the layers
    pLayer_range[9].on('dblclick', function(e) {
      for(var i=0;i<=9;i++) {
        window.plugin.playerRanges[window.plugin.playerRanges.keyGroup[i]].removeLayer(pLayer_range[i]);
      }
    });

    // Repositions the arrow when the map is zoomed
    map.on('zoomend', function(e) {
      pLayer_range[9].setLatLng(pLayer_range[0].getLatLng());
    });
  }

  window.plugin.playerRanges.setRange = function(el) {
    var range = el.data('range');
    var ls = JSON.parse(localStorage[window.plugin.playerRanges.locStore]);

    if(el.is(':checked')) {
      window.plugin.playerRanges.pLayerGroup.addLayer(window.plugin.playerRanges[range]);
      ls[range] = 1;
    }else{
      window.plugin.playerRanges.pLayerGroup.removeLayer(window.plugin.playerRanges[range]);
      ls[range] = 0;
    }
    el.parent('label').toggleClass('check');
    localStorage[window.plugin.playerRanges.locStore] = JSON.stringify(ls);
  }

  window.plugin.playerRanges.hideControls = function() {
    //hide the controls when the layer is off, show it when on
    map.on('layeradd', function(obj) {
      if(obj.layer === window.plugin.playerRanges.pLayerGroup) {
        $('.leaflet-playerranges').show();
      }
    });
    map.on('layerremove', function(obj) {
      if(obj.layer === window.plugin.playerRanges.pLayerGroup) {
        $('.leaflet-playerranges').hide();
      }
    });
    if(!map.hasLayer(window.plugin.playerRanges.pLayerGroup)) {
      $('.leaflet-playerranges').hide();
    }
  }

  window.plugin.playerRanges.manageStorage = function() {
    if(!localStorage[window.plugin.playerRanges.locStore]) {
      localStorage[window.plugin.playerRanges.locStore] = '{"hack":1,"L1":1,"L2":1,"L3":1,"L4":1,"L5":1,"L6":1,"L7":1,"L8":1}'
    } else {
      var rangesList = JSON.parse(localStorage[window.plugin.playerRanges.locStore]);
      for(var key in rangesList) {
        if(rangesList[key] === 0) {
          $('.rangesList input[data-range='+key+']').attr('checked', false).parent('label').removeClass('check');
          window.plugin.playerRanges.pLayerGroup.removeLayer(window.plugin.playerRanges[key]);
        }
      }
    }
  }

  window.plugin.playerRanges.setupHTML = ''
      +'<label class="check"><input type="checkbox" checked data-range="hack" /> Hack/Deploy</label>'
      +'<label class="check"><input type="checkbox" checked data-range="L1" /> XMP L1</label>'
      +'<label class="check"><input type="checkbox" checked data-range="L2" /> XMP L2</label>'
      +'<label class="check"><input type="checkbox" checked data-range="L3" /> XMP L3</label>'
      +'<label class="check"><input type="checkbox" checked data-range="L4" /> XMP L4</label>'
      +'<label class="check"><input type="checkbox" checked data-range="L5" /> XMP L5</label>'
      +'<label class="check"><input type="checkbox" checked data-range="L6" /> XMP L6</label>'
      +'<label class="check"><input type="checkbox" checked data-range="L7" /> XMP L7</label>'
      +'<label class="check" style="border:0 !important;"><input type="checkbox" checked data-range="L8" /> XMP L8</label>';

  var setup = function() {
    window.plugin.playerRanges.setupCSS();

    // Create the main layer
    window.plugin.playerRanges.pLayerGroup = new L.LayerGroup();

    // Create the subLayers and append the subLayers to the main layer
    for(var i=0;i<=9;i++) {
      window.plugin.playerRanges[window.plugin.playerRanges.keyGroup[i]] = new L.LayerGroup();
      window.plugin.playerRanges.pLayerGroup.addLayer(window.plugin.playerRanges[window.plugin.playerRanges.keyGroup[i]]);
    }

    // Append the main layer to the map
    window.addLayerGroup('Player Ranges', window.plugin.playerRanges.pLayerGroup, true);

    L.Control.PlayerRangeControl = L.Control.extend({
      options:{position: 'topleft'},

      onAdd:function(map) {
        var controlDiv = L.DomUtil.create('div', 'leaflet-playerranges');
        var controlSubDIV = L.DomUtil.create('div', 'leaflet-bar', controlDiv);

        var butt_1 = L.DomUtil.create('a', 'playerRangesButton', controlSubDIV);
        butt_1.title = 'Add a player marker.\n\nDoubleClick on a marker to remove it.';

        var butt_2 = L.DomUtil.create('a', 'setRangesButton', controlSubDIV);
        butt_2.title = 'Click to set the ranges.';

        var checkList = L.DomUtil.create('div', 'rangesList leaflet-bar', controlSubDIV);
        checkList.innerHTML = window.plugin.playerRanges.setupHTML

        L.DomEvent
          .addListener(butt_1, 'click', L.DomEvent.stopPropagation)
          .addListener(butt_1, 'click', L.DomEvent.preventDefault)
          .addListener(butt_1, 'dblclick', L.DomEvent.stopPropagation)
          .addListener(butt_1, 'dblclick', L.DomEvent.preventDefault)
          .addListener(butt_2, 'click', L.DomEvent.stopPropagation)
          .addListener(butt_2, 'click', L.DomEvent.preventDefault)
          .addListener(butt_2, 'dblclick', L.DomEvent.stopPropagation)
          .addListener(butt_2, 'dblclick', L.DomEvent.preventDefault)
          .addListener(butt_1, 'click', function() {
            window.plugin.playerRanges.drawMarker();
          })
          .addListener(butt_2, 'click', function() {
            $('.rangesList').toggle();
          })
        ;
        return controlDiv;
      }
    });
    L.control.playerRangesControl = function(options) { return new L.Control.PlayerRangeControl(options); };
    map.addControl(new L.control.playerRangesControl());

    $('.rangesList label input').change(function() {
      window.plugin.playerRanges.setRange($(this));
    });

    window.plugin.playerRanges.manageStorage();
    window.plugin.playerRanges.hideControls();
  }

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@