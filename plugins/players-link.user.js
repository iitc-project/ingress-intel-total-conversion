// ==UserScript==
// @id             iitc-plugin-links-player-name@vooba
// @name           IITC plugin: Show Link's Player Name
// @category       Misc
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Show Link's Player Name
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==


@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.linksPlayerName = function() {};

// Use link add and remove event to control render of link popup
window.plugin.linksPlayerName.linkAdded = function(data) {

  data.link.on('add', function() {
    plugin.linksPlayerName.renderLink(this.options.guid);
  });
  
}

window.plugin.linksPlayerName.generatePopupContent = function(link) {
  
  var player = '?';
  var title = "";
  if(link.options.data.creator !== undefined) {
    player = window.getPlayerName(link.options.data.creator.creatorGuid);
    var time = link.options.data.creator.creationTime;
    var cssClass = link.options.data.controllingTeam.team === 'RESISTANCE' ? 'res' : 'enl';
    title = '<span class="nickname '+ cssClass+'" style="font-weight:bold;">' + player + '</span>';
    
    if(window.plugin.guessPlayerLevels !== undefined &&
       window.plugin.guessPlayerLevels.fetchLevelByPlayer !== undefined) {
      var playerLevel = window.plugin.guessPlayerLevels.fetchLevelByPlayer(link.options.data.creator.creatorGuid);
      if(playerLevel !== undefined) {
        title += '<span style="font-weight:bold;margin-left:10px;">Level '
          + playerLevel
          + (playerLevel < (window.MAX_XM_PER_LEVEL.length - 1) ? ' (guessed)' : '')
          + '</span>';
      } else {
        title += '<span style="font-weight:bold;margin-left:10px;">Level unknown</span>'
      }
    }
    
    title += '<br /><em>' + unixTimeToDateTimeString(time) + '</em>';
    
    if(portals[link.options.data.edge.originPortalGuid] !== undefined) {
        title += '<br /> From: <em>' + portals[link.options.data.edge.originPortalGuid].options.details.portalV2.descriptiveText.TITLE + '</em>';
    } else {
        title += '<br /> From: <em>Zoom out</em>';
    }
    
    if(portals[link.options.data.edge.destinationPortalGuid] !== undefined) {
        title += '<br /> To: <em>' + portals[link.options.data.edge.destinationPortalGuid].options.details.portalV2.descriptiveText.TITLE + '</em>';
    } else {
        title += '<br /> To: <em>Zoom out</em>';
    }
    var latlngs = link.getLatLngs();
    title += '<br /> Length: <em>' + Math.round(latlngs[0].distanceTo(latlngs[1])) / 1000 + ' km</em>';
  }
  return title;
}

window.plugin.linksPlayerName.updatePopupContent = function(link) {
    var title = window.plugin.linksPlayerName.generatePopupContent(link);
    link._popup.setContent(title);
}

window.plugin.linksPlayerName.renderLink = function(guid) {

  var link = window.links[guid];
    
  if(link.options.data.creator !== undefined) {
    var title = window.plugin.linksPlayerName.generatePopupContent(link);
    var popup = L.popup({className: 'plugin-players-link-popup', closeButton: false}).setContent(title);
    link.bindPopup(popup);
    
    link.on('mouseover', function(e) {  window.plugin.linksPlayerName.updatePopupContent(this); this.openPopup(e.latlng); });
    link.on('mouseout', function() { _self = this; setTimeout( function() { _self.closePopup(); }, 1000) });
  }
}

var setup =  function() {
 
  // Add init hook to override clickable option
  L.Polyline.addInitHook(function () {
    if(this.options !== undefined &&
       this.options.data !== undefined &&
       this.options.data.edge !== undefined &&
       this.options.data.edge.originPortalGuid !== undefined &&
       this.options.data.edge.destinationPortalGuid !== undefined) {
       this.options.clickable = true;
    }
  });
  
  $("<style>")
    .prop("type", "text/css")
    .html(".plugin-players-link-popup .leaflet-popup-content-wrapper {\
             border-radius: 0px 0px 0px 0px;\
             padding: 1px;\
             text-align: left;\
           }\
           .plugin-players-link-popup .leaflet-popup-content {\
             line-height: 1.4;\
             margin: 0px 5px;\
           }\
           .plugin-players-link-popup .leaflet-popup-content p {\
             margin: 18px 0px;\
           }\
           .plugin-players-link-popup .leaflet-popup-tip-container {\
             height: 20px;\
             margin: 0 auto;\
             overflow: hidden;\
             position: relative;\
             width: 40px;\
           }\
           .plugin-players-link-popup .leaflet-popup-tip {\
             height: 15px;\
             margin: -8px auto 0;\
             padding: 1px;\
             transform: rotate(45deg);\
             width: 15px;\
           }\
           .plugin-players-link-popup .leaflet-popup-content-wrapper, .leaflet-popup-tip {\
             background: none repeat scroll 0 0 rgba(8, 48, 78, 0.9);\
             box-shadow: 0 3px 14px rgba(0, 0, 0, 0.4);\
             color: yellow;\
             border: 1px solid #20A8B1;\
           }\
        ")
  .appendTo("head");


  window.addHook('linkAdded', window.plugin.linksPlayerName.linkAdded);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@


