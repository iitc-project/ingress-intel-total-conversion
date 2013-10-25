// ==UserScript==
// @id             iitc-plugin-highlight-portals-make8s-portals@bdh
// @name           IITC plugin: highlight portals a group of 8s can make 8
// @category       Highlighter
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Uses the fill color of the portals to denote portals a group of hard coded level 8 players can make 8s.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighlighterMake8resPortals = function() {

};
window.plugin.portalHighlighterMake8resPortals.updateGroup = function(data) {
    window.plugin.portalHighlighterMake8resPortals.eights_core_group = data.replace(' ','').toLowerCase().split(",");
    window.changePortalHighlights('Make group L8s');
};

window.plugin.portalHighlighterMake8resPortals.highlight = function(data) {
  var d = data.portal.options.details;
  var eights_core ={};

  
  var i;
  for(i in window.plugin.portalHighlighterMake8resPortals.eights_core_group) {
      eights_core[window.plugin.portalHighlighterMake8resPortals.eights_core_group[i]]=1;
  }

  if((getTeam(d) !== 0) && (PLAYER.team === d.controllingTeam.team)) {
    var color = '';
    var opacity = .7;
    
    
    var foundCount = 0;
    var resCount=0;
    var l8ResCount=0;
    var resPlayerName;

    $.each(d.resonatorArray.resonators, function(ind, reso) {
      if(reso != null && reso.level == 8) {
          resPlayerName=window.getPlayerName(reso.ownerGuid).toLowerCase();
          if(eights_core[resPlayerName]==1) {
            foundCount++;
          }
          l8ResCount++;
      }
    });
    if( (l8ResCount!=8) && (l8ResCount + window.plugin.portalHighlighterMake8resPortals.eights_core_group.length - foundCount) >=8)
    {
        color = 'red';
        resCount=8;
    }

    if(resCount > 0) {
      opacity = resCount*.125*.7 + .3;
    }
    
    if(color !== '') {
      data.portal.setStyle({fillColor: color, fillOpacity: opacity});
    } else {
      data.portal.setStyle({color:  COLORS[getTeam(data.portal.options.details)],
                            fillOpacity: 0.5});
    }
  }
  window.COLOR_SELECTED_PORTAL = '#f0f';
    
}

var setup =  function() {
  window.plugin.portalHighlighterMake8resPortals.eights_core_group = []
  window.plugin.portalHighlighterMake8resPortals.eights_core_group=window.PLAYER.nickname.toLowerCase().split(",");
  window.addPortalHighlighter('Make group L8s', window.plugin.portalHighlighterMake8resPortals.highlight);
  var content = '<input id="group8s" placeholder="' + window.plugin.portalHighlighterMake8resPortals.eights_core_group + ' comma separated player list to make 8s" type="text">';
  $('#sidebar').append(content);
  $("#group8s").keypress(function(e) {
    if((e.keyCode ? e.keyCode : e.which) !== 13) return;
    var data = $(this).val();
    window.plugin.portalHighlighterMake8resPortals.updateGroup(data);
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
