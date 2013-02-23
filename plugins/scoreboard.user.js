// ==UserScript==
// @id             iitc-plugin-scoreboard@vita10gy
// @name           iitc: show a localized scoreboard.
// @version        0.1
// @namespace      https://github.com/breunigs/ingress-intel-total-conversion
// @updateURL      https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/scoreboard.user.js
// @downloadURL    https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/scoreboard.user.js
// @description    A localized scoreboard.
// @include        http://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// ==/UserScript==

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.scoreboard = function() {};


window.plugin.scoreboard.compileStats = function(){
   window.plugin.scoreboard.scores = {};
   $.each(window.fields, function(qk, val) {
    console.log(val);
    var team = val.options.data.controllingTeam.team;
    if(window.plugin.scoreboard.scores[team]==undefined)
    {
      window.plugin.scoreboard.scores[team] = {};
    }
    if(window.plugin.scoreboard.scores[team]['mu']==undefined)
    {
      window.plugin.scoreboard.scores[team]['mu'] = 0;
    }
    if(window.portals[val.options.vertices.vertexA.guid]!==undefined ||
       window.portals[val.options.vertices.vertexB.guid]!==undefined ||
       window.portals[val.options.vertices.vertexC.guid]!==undefined ) {
      window.plugin.scoreboard.scores[team]['mu']+=parseInt(val.options.data.entityScore.entityScore);
      
      //console.log(val.options.data.controllingTeam.team);
      //console.log(val.options.data.entityScore.entityScore);
      //console.log(window.plugin.muTotal.portalAddress(window.portals[val.options.vertices.vertexA.guid]));
      //console.log(window.plugin.muTotal.portalAddress(window.portals[val.options.vertices.vertexB.guid]));
      //console.log(window.plugin.muTotal.portalAddress(window.portals[val.options.vertices.vertexC.guid]));
    }
  });
};

window.plugin.scoreboard.display = function() {
  window.plugin.scoreboard.compileStats();
  $('body').append('<div id="scoreboard">' +
                   '<p>This is the default dialog which is useful for displaying information. The dialog window can be moved,</p>' +
                   window.plugin.scoreboard.scores +
                   '</div>');
  console.log(window.plugin.scoreboard.scores);
  $( "#scoreboard" ).dialog({ autoOpen: true,
                              modal: true,
                              buttons: [ { text: "Close", click: function() { $( this ).dialog( "close" ); } } ]});
}

var setup =  function() {
  //window.addHook('portalDetailsUpdated', window.plugin.portalAddress.portalDetail);
  $('head').append('<style>' +
    '</style>');
  
  $('#toolbox').append('<a onclick="window.plugin.scoreboard.display()">scoreboard</a> ');
  
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
