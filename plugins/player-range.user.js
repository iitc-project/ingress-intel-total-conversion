// ==UserScript==
// @id             iitc-plugin-player-range@zaso
// @name           IITC plugin: Player Range
// @category       Layer
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Add one or more player markers and his range on the map.
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

  window.plugin.playerRange.pLayerGroup = new L.LayerGroup();

  window.plugin.playerRange.setupCSS = function() {
    var colorFaction;
    switch(window.PLAYER.team) {
      case('ALIENS'): colorFaction = 'left bottom'; break;
      case('RESISTANCE'): colorFaction = '-19px bottom'; break;
      default:colorFaction = 'left bottom'; break;
    }

    $("<style>").prop("type", "text/css").html(''
      +'.playerIcon,.playerRangeButton{'
        +'background-position:'+colorFaction+';'
        +'background-repeat:no-repeat;'
        +'background-image:url(@@INCLUDEIMAGE:plugins/player-range.png@@);'
      +'}'
      +'.playerRangeButton{background-position:-36px center !important;}'
    ).appendTo("head");
  };

  window.plugin.playerRange.myDraw = function() {
    var latlng = map.getCenter();
    var icc = new L.divIcon({
      iconSize: new L.Point(19, 25),
      className:'playerIcon',
    });

    var mar = new L.Marker(latlng, {icon:icc, draggable:true});
    var circle = new L.circle(latlng, 40, {color:"#eb0",fill:false,weight:2,clickable:false});

    mar.addTo(window.plugin.playerRange.pLayerGroup);
    circle.addTo(window.plugin.playerRange.pLayerGroup);

    mar.on('drag', function(e) {
      circle.setLatLng(mar.getLatLng());
    });

    mar.on('dblclick', function(e) {
      map.removeLayer(circle);
      map.removeLayer(mar);
    });

    mar.on('remove', function(e) {
      mar.off('drag');
      mar.off('dblclick');
      mar.off('remove');
    });

    map.on('zoomend', function(e) {
      mar.setLatLng(circle.getLatLng());
    });
  }

  var setup = function() {
    window.plugin.playerRange.setupCSS();
    window.addLayerGroup('Player Range', window.plugin.playerRange.pLayerGroup, true);

    L.Control.Command = L.Control.extend({
      options:{position: 'topleft'},

      onAdd:function(map) {
        var controlDiv = L.DomUtil.create('div', 'leaflet-control-player-range');
        var controlSubDIV = L.DomUtil.create('div','leaflet-bar', controlDiv);
        var controlButton = L.DomUtil.create('a', 'playerRangeButton', controlSubDIV);
        controlButton.title = 'Add a Player Marker.\n\nDoubleClick on a marker to remove it.';

        L.DomEvent
          .addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
          .addListener(controlDiv, 'click', L.DomEvent.preventDefault)
          .addListener(controlDiv, 'click', function() { window.plugin.playerRange.myDraw(); });
        return controlDiv;
      }
    });
    L.control.command = function(options) { return new L.Control.Command(options); };

    map.addControl(new L.control.command());
  }


// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@