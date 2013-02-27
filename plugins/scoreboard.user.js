// ==UserScript==
// @id             iitc-plugin-scoreboard@vita10gy
// @name           iitc: show a localized scoreboard.
// @version        0.1
// @namespace      https://github.com/breunigs/ingress-intel-total-conversion
// @updateURL      https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/scoreboard.user.js
// @downloadURL    https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/scoreboard.user.js
// @description    A localized scoreboard.
// @include        https://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// ==/UserScript==

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.scoreboard = function() {};

window.plugin.scoreboard.resetTeam = function(team) {
   window.plugin.scoreboard.scores['team'][team] = {};
   window.plugin.scoreboard.scores['team'][team]['mu'] = 0;
   window.plugin.scoreboard.scores['team'][team]['count'] = {};
   window.plugin.scoreboard.scores['team'][team]['count']['fields'] = 0;
   window.plugin.scoreboard.scores['team'][team]['largest'] = {};   
};

window.plugin.scoreboard.compileStats = function(){
   window.plugin.scoreboard.scores = {"team": {}, "player": {}};
   window.plugin.scoreboard.resetTeam(TEAM_RES);
   window.plugin.scoreboard.resetTeam(TEAM_ENL);
   
   $.each(window.fields, function(qk, val) {
      var team = getTeam(val.options.data);
      var player = val.options.data.creator.creatorGuid;
      //Init Team info
       
      //Init Player info
      if(window.plugin.scoreboard.scores['player'][player] === undefined) {
        window.plugin.scoreboard.scores['player'][player] = {};
      }
      if(window.plugin.scoreboard.scores['player'][player]['mu'] === undefined) {
        window.plugin.scoreboard.scores['player'][player]['mu'] = 0;
      }
      if(window.plugin.scoreboard.scores['player'][player]['count'] === undefined) {
        window.plugin.scoreboard.scores['player'][player]['count'] = {};
      }
      if(window.plugin.scoreboard.scores['player'][player]['count']['fields'] === undefined) {
        window.plugin.scoreboard.scores['player'][player]['count']['fields'] = 0;
      }
      if(window.plugin.scoreboard.scores['player'][player]['largest'] === undefined) {
        window.plugin.scoreboard.scores['player'][player]['largest'] = {};
      }
   

      if(window.portals[val.options.vertices.vertexA.guid] !== undefined ||
         window.portals[val.options.vertices.vertexB.guid] !== undefined ||
         window.portals[val.options.vertices.vertexC.guid] !== undefined ) {
      
         window.plugin.scoreboard.scores['team'][team]['mu'] += parseInt(val.options.data.entityScore.entityScore);
         window.plugin.scoreboard.scores['player'][player]['mu'] += parseInt(val.options.data.entityScore.entityScore);
         window.plugin.scoreboard.scores['team'][team]['count']['fields']++;
         window.plugin.scoreboard.scores['player'][player]['count']['fields']++;
         
         if(window.plugin.scoreboard.scores['team'][team]['largest']['mu'] === undefined) {
            window.plugin.scoreboard.scores['team'][team]['largest']['mu'] = val;
         }
         else if(window.plugin.scoreboard.scores['team'][team]['largest']['mu'].options.data.entityScore.entityScore < val.options.data.entityScore.entityScore) {
            window.plugin.scoreboard.scores['team'][team]['largest']['mu'] = val;
         }         
         if(window.plugin.scoreboard.scores['player'][player]['largest']['mu'] === undefined) {
            window.plugin.scoreboard.scores['player'][player]['largest']['mu'] = val;
         }
         else if(window.plugin.scoreboard.scores['player'][player]['largest']['mu'].options.data.entityScore.entityScore < val.options.data.entityScore.entityScore) {
            window.plugin.scoreboard.scores['player'][player]['largest']['mu'] = val;
         }
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
   console.log(window.plugin.scoreboard.scores);
   var res_mu = window.plugin.scoreboard.scores['team'][TEAM_RES]['mu'];
   var enl_mu = window.plugin.scoreboard.scores['team'][TEAM_ENL]['mu'];

   var score_html = '';
   if(res_mu + enl_mu > 0) {
      var res_mu_percent = Math.round((res_mu / (res_mu + enl_mu)) * 100);
      score_html += '<div id="gamestat" title="Resistance:	' + res_mu + ' MU Enlightenment:	' + enl_mu + ' MU">';
      if(res_mu_percent > 0) {
         score_html += '<span class="res" style="width:' + res_mu_percent +'%;">' + res_mu_percent +'%</span>';   
      }
      if(res_mu_percent < 100) {
         score_html += '<span class="enl" style="width:' + (100 - res_mu_percent) +'%;">&nbsp;' + (100 - res_mu_percent) +'%</span>';
      }
      score_html += '</div>'
   }
  
   $('#scoreboard').html(score_html);
   $( "#scoreboard" ).dialog({ autoOpen: true,
                               modal: true,
                               buttons: [ { text: "Close", click: function() { $( this ).dialog( "close" ); } } ]});
}

var setup =  function() {
  //window.addHook('portalDetailsUpdated', window.plugin.portalAddress.portalDetail);
  
  $('body').append('<div id="scoreboard" style="display:none;"></div>');
  $('#toolbox').append('<a onclick="window.plugin.scoreboard.display()">scoreboard</a>');
  
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
