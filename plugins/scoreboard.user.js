// ==UserScript==
// @id             iitc-plugin-scoreboard@vita10gy
// @name           iitc: show a localized scoreboard.
// @version        0.1.1
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

window.plugin.scoreboard.scores = {};
window.plugin.scoreboard.playerGuids = new Array();

window.plugin.scoreboard.resetTeam = function(team) {
  var scores = window.plugin.scoreboard.scores['team'];
  scores[team] = {};
  scores[team]['mu'] = 0;
  scores[team]['count_fields'] = 0;
  scores[team]['count_links'] = 0;
  scores[team]['count_portals'] = 0;
  scores[team]['count_resonators'] = 0;
  scores[team]['largest'] = {};   
};

window.plugin.scoreboard.initPlayer = function(player, team) {
  var scores = window.plugin.scoreboard.scores['player'];
  if(scores[player] === undefined) {
    scores[player] = {};
    scores[player]['team'] = team;
    scores[player]['mu'] = 0;
    scores[player]['count_fields'] = 0;
    scores[player]['count_links'] = 0;
    scores[player]['count_portals'] = 0;
    scores[player]['count_resonators'] = 0;
    //  scores[player]['count_shields'] = 0;
    scores[player]['largest'] = {};
    window.plugin.scoreboard.playerGuids.push(player);
  }
}

window.plugin.scoreboard.compileStats = function() {
  var somethingInView = false;  
  window.plugin.scoreboard.playerGuids = new Array();
  window.plugin.scoreboard.scores = {'team': {}, 'player': {}};
  var scores = window.plugin.scoreboard.scores;
  window.plugin.scoreboard.resetTeam(TEAM_RES);
  window.plugin.scoreboard.resetTeam(TEAM_ENL);
   
  $.each(window.fields, function(qk, val) {
    var team = getTeam(val.options.data);
    var player = val.options.data.creator.creatorGuid;
     
    window.plugin.scoreboard.initPlayer(player,team);
 
    if(window.portals[val.options.vertices.vertexA.guid] !== undefined ||
       window.portals[val.options.vertices.vertexB.guid] !== undefined ||
       window.portals[val.options.vertices.vertexC.guid] !== undefined ) {
      
      somethingInView = true;
      scores['team'][team]['mu'] += parseInt(val.options.data.entityScore.entityScore);
      scores['player'][player]['mu'] += parseInt(val.options.data.entityScore.entityScore);
      scores['team'][team]['count_fields']++;
      scores['player'][player]['count_fields']++;
      
      if(scores['team'][team]['largest']['mu'] === undefined) {
        scores['team'][team]['largest']['mu'] = val;
      }
      else if(scores['team'][team]['largest']['mu'].options.data.entityScore.entityScore < val.options.data.entityScore.entityScore) {
        scores['team'][team]['largest']['mu'] = val;
      }         
      if(scores['player'][player]['largest']['mu'] === undefined) {
        scores['player'][player]['largest']['mu'] = val;
      }
      else if(scores['player'][player]['largest']['mu'].options.data.entityScore.entityScore < val.options.data.entityScore.entityScore) {
        scores['player'][player]['largest']['mu'] = val;
      }
    }
  });
  $.each(window.links, function(qk, link) {
    somethingInView = true;
    var team = getTeam(link.options.data);
    var player = link.options.data.creator.creatorGuid;
    window.plugin.scoreboard.initPlayer(player, team);
    scores['team'][team]['count_links']++;
    scores['player'][player]['count_links']++;
  });
  $.each(window.portals, function(qk, portal) {
    somethingInView = true;
    var team = getTeam(portal.options.details);
    var player = portal.options.details.captured.capturingPlayerId;
    window.plugin.scoreboard.initPlayer(player, team);
    scores['team'][team]['count_portals']++;
    scores['player'][player]['count_portals']++;
    
    //$.each(portal.options.details.portalV2.linkedModArray, function(ind, mod) {
    //  if(mod !== null) {
    //    somethingInView = true;
    //    scores['team'][team]['count_shields']++;
    //    scores['player'][mod.installingUser]['count_shields']++;
    //  }
    //});
    
    $.each(portal.options.details.resonatorArray.resonators, function(ind, reso) {
      if(reso !== null) {  
        somethingInView = true;
        window.plugin.scoreboard.initPlayer(reso.ownerGuid, team);
        scores['team'][team]['count_resonators']++;
        scores['player'][reso.ownerGuid]['count_resonators']++;
      }
    });
  });
  window.plugin.scoreboard.playerGuids.sort(window.plugin.scoreboard.sortPlayerList);
  return somethingInView;
};

window.plugin.scoreboard.sortPlayerList = function(a, b) {
  var retVal = 0;
  if(window.getPlayerName(a).toLowerCase() < window.getPlayerName(b).toLowerCase()) {
    retVal = -1;
  } else {
    retVal = 1;
  }
  return retVal;
};

window.plugin.scoreboard.percentSpan = function(percent, cssClass) {
   var retVal = '';
   if(percent > 0) {
      retVal += '<span class="' + cssClass + '" style="width:' + percent +'%;">';
      if(percent >= 7) { //anything less than this and the text doesnt fit in the span.
        retVal += percent;
      }
      retVal += '%</span>';   
   }
   return retVal;
};

window.plugin.scoreboard.teamTableRow = function(field,title) {
  var scores = window.plugin.scoreboard.scores['team'];
  var retVal = '<tr><td>'
   + title
   + '</td><td class="number">'
   + scores[TEAM_RES][field]
   + '</td><td class="number">'
   + scores[TEAM_ENL][field]
   + '</td><td class="number">'
   + (scores[TEAM_RES][field] + scores[TEAM_ENL][field])
   + '</td></tr>';
  return retVal;
};

window.plugin.scoreboard.playerTableRow = function(playerGuid) {
  var scores = window.plugin.scoreboard.scores['player'];
  var retVal = '<tr class="'
    + (scores[playerGuid]['team'] === TEAM_RES ? 'res' : 'enl')
    +'"><td>'
    + window.getPlayerName(playerGuid);
    + '</td>';
              
  $.each(['mu','count_fields','count_links','count_portals','count_resonators'], function(i, field) {
    retVal += '<td class="number">'
      + scores[playerGuid][field]
      + '</td>';
  });
  retVal += '</tr>';
  return retVal;
};

window.plugin.scoreboard.display = function() {
  
  var somethingInView = window.plugin.scoreboard.compileStats();
   
  var resMu = window.plugin.scoreboard.scores['team'][TEAM_RES]['mu'];
  var enlMu = window.plugin.scoreboard.scores['team'][TEAM_ENL]['mu'];

  var scoreHtml = '';
  if(somethingInView) {
  
    if(resMu + enlMu > 0) {
      var resMuPercent = Math.round((resMu / (resMu + enlMu)) * 100);
      scoreHtml += '<div id="gamestat" title="Resistance:	' + resMu + ' MU Enlightenment:	' + enlMu + ' MU">'
        + window.plugin.scoreboard.percentSpan(resMuPercent, 'res')
        + window.plugin.scoreboard.percentSpan(100-resMuPercent, 'enl')
        + '</div>';
    }
    
    scoreHtml += '<table>'
               + '<tr><th></th><th>Resistance</th><th>Enlightened</th><th>Total</th></tr>';
    scoreHtml += window.plugin.scoreboard.teamTableRow('mu','Mu');
    scoreHtml += window.plugin.scoreboard.teamTableRow('count_fields','Fields');
    scoreHtml += window.plugin.scoreboard.teamTableRow('count_links','Links');
    scoreHtml += window.plugin.scoreboard.teamTableRow('count_portals','Portals');
    scoreHtml += window.plugin.scoreboard.teamTableRow('count_resonators','Resonators');
    scoreHtml += '</table>';
    
    scoreHtml += '<table>'
               + '<tr><th>Player</th><th>Mu</th><th>Fields</th><th>Links</th><th>Portals</th><th>Resonators</th></tr>';
    $.each(window.plugin.scoreboard.playerGuids, function(index, guid) {
      scoreHtml += window.plugin.scoreboard.playerTableRow(guid);
    });
    scoreHtml += '</table>';
    
    scoreHtml += '<div class="disclaimer">Score is subject to portals available based on zoom level. If names are unresolved try again. For best results wait until updates are fully loaded.</div>';
  } else {
    scoreHtml += 'You need something in view.';  
  }
  
  alert('<div id="scoreboard">' + scoreHtml + '</div>');
  $(".ui-dialog").addClass('ui-dialog-scoreboard');
}

var setup =  function() {
  //window.addHook('portalDetailsUpdated', window.plugin.portalAddress.portalDetail);
  
  $('body').append('<div id="scoreboard" style="display:none;"></div>');
  $('#toolbox').append('<a onclick="window.plugin.scoreboard.display()">scoreboard</a>');
  $('head').append('<style>' +
    '.ui-dialog-scoreboard {max-width:500px !important; width:500px !important;}' +
    '#scoreboard table {margin-top:10px;	border-collapse: collapse; empty-cells: show; width:100%;}' +
    '#scoreboard table td, #scoreboard table th {border-bottom: 1px solid #0b314e; padding:3px; color:white; background-color:#1b415e}' +
    '#scoreboard table tr.res td { background-color: #005684; }' +
    '#scoreboard table tr.enl td { background-color: #017f01; }' +
    '#scoreboard table tr:nth-child(even) td { opacity: .8 }' +
    '#scoreboard table td.number { text-align:right }' +
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
