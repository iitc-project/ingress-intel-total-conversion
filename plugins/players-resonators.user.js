// ==UserScript==
// @id             iitc-plugin-players-resonators@rbino
// @name           IITC plugin: Player's Resonators
// @version        0.1.3.20130505.233200
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      http://ingress.rbino.com/iitc-plugin-players-resonators.user.js
// @downloadURL    http://ingress.rbino.com/iitc-plugin-players-resonators.user.js
// @description    The plugins finds the resonators of a given player. The input is in the sidebar. Useful for revenge.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// ==/UserScript==

// Changelog:
//
// 0.1.3 Effective player name (with wrong capitalization) if it finds some reso
// 0.1.2 Made nickname case insensitive
// 0.1.1 Added mouseover for portal location. Dirty hack to not show mousehover when the alert is fired.
// 0.1.0 First public release

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.playersResonators = function() {};

window.plugin.playersResonators.findReso = function(playername) {
  var s = "";
  var portalSet = {};
  var effectiveName = "";
  var nickFind = playername.toLowerCase();
  $.each(window.portals, function(ind, portal){
      var r = portal.options.details.resonatorArray.resonators;
      $.each(r, function(ind, reso) {
          if (!reso) return true; 
          var nick = getPlayerName(reso.ownerGuid);
          if (nick.toLowerCase() === nickFind){
              if (!effectiveName) {
                effectiveName = nick;              
              }
              if (!portalSet.hasOwnProperty(portal.options.guid)){
                  portalSet[portal.options.guid] = true;
                  console.log(portalSet);                
                  var latlng = [portal.options.details.locationE6.latE6/1E6, portal.options.details.locationE6.lngE6/1E6].join();
                  var guid = portal.options.guid;
                  var jsDoubleClick = 'window.zoomToAndShowPortal(\''+guid+'\', ['+latlng+']);return false';
                  var perma = '/intel?latE6='+portal.options.details.locationE6.latE6+'&lngE6='+portal.options.details.locationE6.lngE6+'&z=17&pguid='+guid;
                  var a = $('<a>',{
                      "class": 'help',
                      text: portal.options.details.portalV2.descriptiveText.TITLE,
                      title: portal.options.details.portalV2.descriptiveText.ADDRESS,
                      href: perma,
                      onClick: jsDoubleClick
                  })[0].outerHTML;
                  s += a + "\n";
              }
          }
      });
  });
  if (s) {
    fakeLinkPlayer = '<a href="#" onClick="return false;">' + effectiveName + '</a>'
    s = fakeLinkPlayer + " has resonators on these portals:\n\n" + s;  
  } else {
    fakeLinkPlayer = '<a href="#" onClick="return false;">' + playername + '</a>'
    s = fakeLinkPlayer + " has no resonators in this range\n";  
  }
  alert(s);
}

var setup = function() {
  var content = '<div id="player-reso">' + '<input id="playerReso" placeholder="Type player name to find resonators..." type="text" style="width:300px;"/>';
  $('#sidebar').append(content);
  $("#playerReso").keypress(function(e) {
    if((e.keyCode ? e.keyCode : e.which) !== 13) return;
    var data = $(this).val();
    window.plugin.playersResonators.findReso(data);
  });
}

// PLUGIN END //////////////////////////////////////////////////////////

if(window.iitcLoaded && typeof setup === 'function') {
  setup();
} else {
  if(window.bootPlugins)
    window.bootPlugins.push(setup);
  else
    window.bootPlugins = [setup];
}
} // wrapper end
// inject code into site context
var script = document.createElement('script');
script.appendChild(document.createTextNode('('+ wrapper +')();'));
(document.body || document.head || document.documentElement).appendChild(script);
