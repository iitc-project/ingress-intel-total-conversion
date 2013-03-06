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
   window.plugin.scoreboard.scores['team'][team]['count_fields'] = 0;
   window.plugin.scoreboard.scores['team'][team]['count_links'] = 0;
   window.plugin.scoreboard.scores['team'][team]['count_portals'] = 0;
   window.plugin.scoreboard.scores['team'][team]['count_resonators'] = 0;
   window.plugin.scoreboard.scores['team'][team]['largest'] = {};   
};

window.plugin.scoreboard.initPlayer = function(player,team) {
   //Init Player info
   if(window.plugin.scoreboard.scores['player'][player] === undefined) {
     window.plugin.scoreboard.scores['player'][player] = {};
     window.plugin.scoreboard.scores['player'][player]['team'] = team;
   }
   if(window.plugin.scoreboard.scores['player'][player]['mu'] === undefined) {
     window.plugin.scoreboard.scores['player'][player]['mu'] = 0;
   }
   if(window.plugin.scoreboard.scores['player'][player]['count_fields'] === undefined) {
     window.plugin.scoreboard.scores['player'][player]['count_fields'] = 0;
   }
   if(window.plugin.scoreboard.scores['player'][player]['count_links'] === undefined) {
     window.plugin.scoreboard.scores['player'][player]['count_links'] = 0;
   }
   if(window.plugin.scoreboard.scores['player'][player]['count_portals'] === undefined) {
     window.plugin.scoreboard.scores['player'][player]['count_portals'] = 0;
   }
   if(window.plugin.scoreboard.scores['player'][player]['count_resonators'] === undefined) {
     window.plugin.scoreboard.scores['player'][player]['count_resonators'] = 0;
   }
   if(window.plugin.scoreboard.scores['player'][player]['largest'] === undefined) {
     window.plugin.scoreboard.scores['player'][player]['largest'] = {};
   }
}

window.plugin.scoreboard.compileStats = function() {
  window.plugin.scoreboard.scores = {"team": {}, "player": {}};
  window.plugin.scoreboard.resetTeam(TEAM_RES);
  window.plugin.scoreboard.resetTeam(TEAM_ENL);
   
  $.each(window.fields, function(qk, val) {
    var team = getTeam(val.options.data);
    var player = val.options.data.creator.creatorGuid;
     
    window.plugin.scoreboard.initPlayer(player,team);
 
    if(window.portals[val.options.vertices.vertexA.guid] !== undefined ||
       window.portals[val.options.vertices.vertexB.guid] !== undefined ||
       window.portals[val.options.vertices.vertexC.guid] !== undefined ) {
    
      window.plugin.scoreboard.scores['team'][team]['mu'] += parseInt(val.options.data.entityScore.entityScore);
      window.plugin.scoreboard.scores['player'][player]['mu'] += parseInt(val.options.data.entityScore.entityScore);
      window.plugin.scoreboard.scores['team'][team]['count_fields']++;
      window.plugin.scoreboard.scores['player'][player]['count_fields']++;
      
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
    }
  });
  $.each(window.links, function(qk, link) {
    var team = getTeam(link.options.data);
    var player = link.options.data.creator.creatorGuid;
    window.plugin.scoreboard.initPlayer(player,team);
    window.plugin.scoreboard.scores['team'][team]['count_links']++;
    window.plugin.scoreboard.scores['player'][player]['count_links']++;
  });
  $.each(window.portals, function(qk, portal) {
    var team = getTeam(portal.options.details);
    var player = portal.options.details.captured.capturingPlayerId;
    window.plugin.scoreboard.initPlayer(player,team);
    window.plugin.scoreboard.scores['team'][team]['count_portals']++;
    window.plugin.scoreboard.scores['player'][player]['count_portals']++;
    
    $.each(portal.options.details.portalV2.linkedModArray, function(ind, mod) {
      if(mod !== null) {
        window.plugin.scoreboard.scores['team'][team]['count_resonators']++;
        window.plugin.scoreboard.scores['player'][player]['count_resonators']++;
      }
    });
  });
 
};

window.plugin.scoreboard.percentSpan = function(percent,css_class) {
   var retVal = '';
   if(percent > 0) {
      retVal += '<span class="' + css_class + '" style="width:' + percent +'%;">';
      if(percent >= 7) { //anything less than this and the text doesnt fit in the span.
        retVal += percent;
      }
      retVal += '%</span>';   
   }
   return(retVal);
};

window.plugin.scoreboard.teamTableRow = function(field,title) {
   var retVal = '<tr><td>'
    + title
    + '</td><td>'
    + window.plugin.scoreboard.scores['team'][TEAM_RES][field]
    + '</td><td>'
    + window.plugin.scoreboard.scores['team'][TEAM_ENL][field]
    + '</td></tr>';
   return(retVal);
};

window.plugin.scoreboard.playerTableRow = function(player_guid) {
   
  var retVal = '<tr class="'
    + (window.plugin.scoreboard.scores['player'][player_guid]['team'] === TEAM_RES?"res":"enl")
    +'"><td>'
    + window.getPlayerName(player_guid);
    + '</td>';
              
  $.each(['mu','count_fields','count_links','count_portals','count_resonators'], function(i,field) {
    retVal += '<td>'
      + window.plugin.scoreboard.scores['player'][player_guid][field]
      + '</td>';
  });
  retVal += '</tr>';
  return(retVal);
};

window.plugin.scoreboard.display = function() {
   window.plugin.scoreboard.compileStats();
   
   var res_mu = window.plugin.scoreboard.scores['team'][TEAM_RES]['mu'];
   var enl_mu = window.plugin.scoreboard.scores['team'][TEAM_ENL]['mu'];

   var score_html = '';
   if(res_mu + enl_mu > 0) {
      var res_mu_percent = Math.round((res_mu / (res_mu + enl_mu)) * 100);
      score_html += '<div id="gamestat" title="Resistance:	' + res_mu + ' MU Enlightenment:	' + enl_mu + ' MU">'
        + window.plugin.scoreboard.percentSpan(res_mu_percent,'res')
        + window.plugin.scoreboard.percentSpan(100-res_mu_percent,'enl')
        + '</div>';

      score_html += '<table width="100%">'
                 + '<tr><th></th><th>Resistance</th><th>Enlightened</th></tr>';
      score_html += window.plugin.scoreboard.teamTableRow('mu','Mu');
      score_html += window.plugin.scoreboard.teamTableRow('count_fields','Fields');
      score_html += window.plugin.scoreboard.teamTableRow('count_links','Links');
      score_html += window.plugin.scoreboard.teamTableRow('count_portals','Portals');
      score_html += window.plugin.scoreboard.teamTableRow('count_resonators','Resonators');
      score_html += '</table>';
      
      score_html += '<table width="100%">'
                 + '<tr><th>Player</th><th>Mu</th><th>Fields</th><th>Links</th><th>Portals</th><th>Resonators</th></tr>';
      $.each(window.plugin.scoreboard.scores['player'], function(guid, player_data) {
        score_html += window.plugin.scoreboard.playerTableRow(guid);
      });
      score_html += '</table>';
      
   }
  
   score_html += '<div class="disclaimer">Score is subject to portals available based on zoom level. If names are unresolved try again. For best results wait until updates are fully loaded.</div>';
   $('#scoreboard').html(score_html);
   $( "#scoreboard" ).dialog({autoOpen: true,
      modal: true,
      width: 500,
      buttons: [ { text: "Close", click: function() { $( this ).dialog( "close" ); } } ]});
}

var setup =  function() {
  //window.addHook('portalDetailsUpdated', window.plugin.portalAddress.portalDetail);
  
  $('body').append('<div id="scoreboard" style="display:none;"></div>');
  $('#toolbox').append('<a onclick="window.plugin.scoreboard.display()">scoreboard</a>');
  $('head').append('<style>' +
    '.ui-tooltip, .ui-dialog {max-width:500px !important;}' +
    '#scoreboard table {margin-top:10px; border: 1px solid #cccccc;	border-collapse: collapse; empty-cells: show;}' +
    '#scoreboard table td, #scoreboard table th {border: 1px solid #cccccc; padding:3px; color:white; background-color:#1b415e}' +
    '#scoreboard table tr.res td { background-color: #005684; }' +
    '#scoreboard table tr.enl td { background-color: #017f01; }' +
    '#scoreboard .disclaimer { margin-top:10px; font-size:10px; }' +
    '</style>');
  
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
