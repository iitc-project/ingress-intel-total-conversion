// ==UserScript==
// @id             iitc-plugin-players-resonators@rbino
// @name           IITC plugin: Player's Resonators
// @version        0.1.4.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] The plugins finds the resonators of a given player. The input is in the sidebar. Useful for revenge.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// ==/UserScript==

/*********************************************************************************************************
* Changelog:
*
* 0.1.4 Added focus link in the toolbox. Some renaming. Removed div to use sidebar style.
* 0.1.3 Effective player name (with wrong capitalization) if it finds some reso
* 0.1.2 Made nickname case insensitive
* 0.1.1 Added mouseover for portal location. Dirty hack to not show mousehover when the alert is fired.
* 0.1.0 First public release
*********************************************************************************************************/

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.playersResonators = function() {};

window.plugin.playersResonators.findReso = function(playername) {
  var s = "";
  var portalSet = {};
  var effectiveNick = "";
  // Assuming there can be no agents with same nick with different lower/uppercase
  var nickToFind = playername.toLowerCase();
  $.each(window.portals, function(ind, portal){
      var r = portal.options.details.resonatorArray.resonators;
      $.each(r, function(ind, reso) {
          if (!reso) return true; 
          var nick = getPlayerName(reso.ownerGuid);
          if (nick.toLowerCase() === nickToFind){
              if (!effectiveNick) {
                effectiveNick = nick;              
              }
              if (!portalSet.hasOwnProperty(portal.options.guid)){
                  portalSet[portal.options.guid] = true;
                  console.log(portalSet);                
                  var latlng = [portal.options.details.locationE6.latE6/1E6, portal.options.details.locationE6.lngE6/1E6].join();
                  var guid = portal.options.guid;
                  var zoomPortal = 'window.zoomToAndShowPortal(\''+guid+'\', ['+latlng+']);return false';
                  var perma = '/intel?latE6='+portal.options.details.locationE6.latE6+'&lngE6='+portal.options.details.locationE6.lngE6+'&z=17&pguid='+guid;
                  var a = $('<a>',{
                      "class": 'help',
                      text: portal.options.details.portalV2.descriptiveText.TITLE,
                      title: portal.options.details.portalV2.descriptiveText.ADDRESS,
                      href: perma,
                      onClick: zoomPortal
                  })[0].outerHTML;
                  s += a + "\n";
              }
          }
      });
  });
  if (s) {
    // Showing the playername as a "fake" link to avoid the auto-mouseover effect on the first portal
    fakeLinkPlayer = '<a href="#" onClick="return false;">' + effectiveNick + '</a>'
    s = fakeLinkPlayer + " has resonators on these portals:\n\n" + s;  
  } else {
    s = playername + " has no resonators in this range\n";  
  }
  alert(s);
}

var setup = function() {
  var content = '<input id="playerReso" placeholder="Type player name to find resonators..." type="text">';
  $('#sidebar').append(content);
  $('#toolbox').append('  <a onclick=$("#playerReso").focus() title="Find all portals with resonators of a certain player">Player\'s Reso</a>');
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
