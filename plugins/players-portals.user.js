// ==UserScript==
// @id                      players-portals@fedepupo.it
// @name                    IITC plugin: Player's Portals
// @version                 0.1.0.20130607.174800
// @description             The plugins finds the portals of a given player.  
// @updateURL               http://www.fedepupo.it/ingress/players-portals.user.js
// @downloadURL             http://www.fedepupo.it/ingress/players-portals.user.js
// @include                 https://www.ingress.com/intel*
// @include                 http://www.ingress.com/intel*
// @match                   https://www.ingress.com/intel*
// @match                   http://www.ingress.com/intel*
// ==/UserScript==

/*********************************************************************************************************
* Changelog:
*
* 0.1.0 First public release
*********************************************************************************************************/

function wrapper(){
    if(typeof window.plugin !== 'function') window.plugin = function() {};
    
    window.plugin.playersPortals = function() {}
    window.plugin.playersPortals.findPortals = function(playername) {
        var nickToFind = playername.toLowerCase();
        $.each(window.portals, function(ind, portal){
            
            portal.setStyle({color:  COLORS[getTeam(portal.options.details)], fillColor: COLORS[getTeam(portal.options.details)], fillOpacity: 0.5});
            var r = portal.options.details.resonatorArray.resonators;
            $.each(r, function(ind, reso){
                if (!reso) return true;
                var nick = getPlayerName(reso.ownerGuid);
                if (nick.toLowerCase() === nickToFind){
                    portal.setStyle({color: '#FF00E1', fillColor: '#FFB7F5', fillOpacity: 1});
                }
            });
        });
    }
    var setup_playersportals = function() {     
      var content = '<input id="playerPortals" placeholder="Insert player name to find his portals" type="text">';
      $('#sidebar').append(content);
      $("#playerPortals").keypress(function(e) {
        if((e.keyCode ? e.keyCode : e.which) !== 13) return;
        var data = $(this).val();
        window.plugin.playersPortals.findPortals(data);
      });
    }

    if(window.iitcLoaded && typeof setup_playersportals === 'function') {
        setup_playersportals();
    } else {
        if(window.bootPlugins)
            window.bootPlugins.push(setup_playersportals);
        else
            window.bootPlugins = [setup_playersportals];
    }
}
var script = document.createElement('script');
script.appendChild(document.createTextNode('('+ wrapper +')();'));
(document.body || document.head || document.documentElement).appendChild(script);
