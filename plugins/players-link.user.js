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

// Use portal add and remove event to control render of portal level numbers
window.plugin.linksPlayerName.linkAdded = function(data) {

  data.link.on('add', function() {
    plugin.linksPlayerName.renderLink(this.options.guid);
  });

  data.link.on('remove', function() {
    plugin.linksPlayerName.removeLink(this.options.guid);
  });
  
}

window.plugin.linksPlayerName.renderLink = function(guid) {
  plugin.linksPlayerName.removeLink(guid);

  var link = window.links[guid];
  
  var player = '?';
  if(link.options.data.creator !== undefined) {
    player = window.getPlayerName(link.options.data.creator.creatorGuid);
	var time = link.options.data.creator.creationTime;
    var cssClass = link.options.data.controllingTeam.team === 'ALIENS' ? 'enl' : 'res';
    var title = '<span class="nickname '+ cssClass+'" style="font-weight:bold;">' + player + '</span>';
          
		
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
	
	title += '<br />' + unixTimeToDateTimeString(time);
	
    var popup = L.popup({className: 'plugin-players-link-popup', closeButton: false}).setContent(title);
    link.bindPopup(popup);
    link.options.clickable = true; // Change NOT possible after consturctor L.polyline called? --> Workaround in window.renderLink
    link.setStyle();

    link.on('mouseover', function(e) {  this.openPopup(e.latlng); });
    link.on('mouseout', function() { _self = this; setTimeout( function() { _self.closePopup(); }, 1000) });
  }
}

window.plugin.linksPlayerName.removeLink = function(guid) {
	/* currently nothing todo */
}

var setup =  function() {
 
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


