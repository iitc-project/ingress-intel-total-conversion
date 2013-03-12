// ==UserScript==
// @id             iitc-plugin-scoreboard@vita10gy
// @name           iitc: show a localized scoreboard.
// @version        0.1.3
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
    
    // Google sends fields long since dead in the data. This makes sure it's still actually up.
    if(window.portals[val.options.vertices.vertexA.guid] !== undefined ||
       window.portals[val.options.vertices.vertexB.guid] !== undefined ||
       window.portals[val.options.vertices.vertexC.guid] !== undefined ) {
      
      somethingInView = true;
      scores['team'][team]['mu'] += parseInt(val.options.data.entityScore.entityScore);
      scores['player'][player]['mu'] += parseInt(val.options.data.entityScore.entityScore);
      scores['team'][team]['count_fields']++;
      scores['player'][player]['count_fields']++;
      
      var largestMu = scores['team'][team]['largest']['mu'];
      if(largestMu === undefined || parseInt(largestMu.options.data.entityScore.entityScore) < parseInt(val.options.data.entityScore.entityScore)) {
        largestMu = val;
      }
      scores['team'][team]['largest']['mu'] = largestMu;
      
      var largestMu = scores['player'][player]['largest']['mu'];
      if(largestMu === undefined || parseInt(largestMu.options.data.entityScore.entityScore) < parseInt(val.options.data.entityScore.entityScore)) {
        largestMu = val;
      }
      scores['player'][player]['largest']['mu'] = largestMu;
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
    if(team !== TEAM_NONE) {
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
    }
  });
  return somethingInView;
};

window.plugin.scoreboard.percentSpan = function(percent, cssClass) {
   var retVal = '';
   if(percent > 0) {
      retVal += '<span class="' + cssClass + ' mu_score" style="width:' + percent +'%;">' + percent;
      if(percent >= 7) { // anything less than this and the text doesnt fit in the span.
        retVal += '%';
      }
      retVal += '</span>';   
   }
   return retVal;
};

window.plugin.scoreboard.teamTableRow = function(field,title) {
  var scores = window.plugin.scoreboard.scores['team'];
  var retVal = '<tr><td>'
   + title
   + '</td><td class="number">'
   + window.digits(scores[TEAM_RES][field])
   + '</td><td class="number">'
   + window.digits(scores[TEAM_ENL][field])
   + '</td><td class="number">'
   + window.digits(scores[TEAM_RES][field] + scores[TEAM_ENL][field])
   + '</td></tr>';
  return retVal;
};

window.plugin.scoreboard.fieldInfo = function(field) {
  var title = '';
  var retVal = '';
  
  if(field !== undefined) {
    var portal = window.portals[field.options.vertices.vertexA.guid];
    if(portal !== undefined) {
      title = ' @' + portal.options.details.portalV2.descriptiveText.TITLE;
    }
    
    retVal = '<div title="' + title + '">'
      + field.options.data.entityScore.entityScore
      + ' - ' + window.getPlayerName(field.options.data.creator.creatorGuid)
      + '</div>';
  }  else {
    retVal = 'N/A';
  }
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
      + window.digits(scores[playerGuid][field])
      + '</td>';
  });
  retVal += '</tr>';
  return retVal;
};

window.plugin.scoreboard.playerTable = function(sortBy) {
  
  // Sort the playerGuid array by sortBy
  window.plugin.scoreboard.playerGuids.sort(function(a, b) {
    var playerA = window.plugin.scoreboard.scores['player'][a];
    var playerB = window.plugin.scoreboard.scores['player'][b];
    var retVal = 0;
    if(sortBy === 'names') {
      retVal = window.getPlayerName(a).toLowerCase() < window.getPlayerName(b).toLowerCase() ? -1 : 1;
    } else {
      retVal = playerB[sortBy] - playerA[sortBy];
    }
    return retVal;
  });
  
  var sort = window.plugin.scoreboard.playerTableSort;
  var scoreHtml = '<table>'
    + '<tr><th ' + sort('names', sortBy) + '>Player</th>' 
    + '<th ' + sort('mu', sortBy) + '>Mu</th>'
    + '<th ' + sort('count_fields', sortBy) + '>Fields</th>'
    + '<th ' + sort('count_links', sortBy) + '>Links</th>'
    + '<th ' + sort('count_portals', sortBy) + '>Portals</th>'
    + '<th ' + sort('count_resonators', sortBy) + '>Resonators</th></tr>';
  $.each(window.plugin.scoreboard.playerGuids, function(index, guid) {
    scoreHtml += window.plugin.scoreboard.playerTableRow(guid);
  });
  scoreHtml += '</table>';
  
  return scoreHtml;
}

// A little helper functon so the above isn't so messy
window.plugin.scoreboard.playerTableSort = function(name, by) {
  var retVal = 'data-sort="' + name + '"';
  if(name === by) {
    retVal += ' class="sorted"';
  }
  return retVal;
};

window.plugin.scoreboard.display = function() {
  
  var somethingInView = window.plugin.scoreboard.compileStats();
  var scores = window.plugin.scoreboard.scores;
  var resMu = scores['team'][TEAM_RES]['mu'];
  var enlMu = scores['team'][TEAM_ENL]['mu'];
  var scoreHtml = '';
  
  if(somethingInView) {
  
    if(resMu + enlMu > 0) {
      var resMuPercent = Math.round((resMu / (resMu + enlMu)) * 100);
      scoreHtml += '<div class="mu_score" title="Resistance:	' + resMu + ' MU Enlightenment:	' + enlMu + ' MU">'
        + window.plugin.scoreboard.percentSpan(resMuPercent, 'res')
        + window.plugin.scoreboard.percentSpan(100-resMuPercent, 'enl')
        + '</div>';
    }
    
    scoreHtml += '<table>'
      + '<tr><th></th><th class="number">Resistance</th><th class="number">Enlightened</th><th class="number">Total</th></tr>'
      + window.plugin.scoreboard.teamTableRow('mu','Mu')
      + window.plugin.scoreboard.teamTableRow('count_fields','Fields')
      + window.plugin.scoreboard.teamTableRow('count_links','Links')
      + window.plugin.scoreboard.teamTableRow('count_portals','Portals')
      + window.plugin.scoreboard.teamTableRow('count_resonators','Resonators')
      + '</table>';
      
    scoreHtml += '<table>'
      + '<tr><th></th><th>Resistance</th><th>Enlightened</th></tr>'
      + '<tr><td>Largest Field</td><td>'
      + window.plugin.scoreboard.fieldInfo(scores['team'][TEAM_RES]['largest']['mu'])
      + '</td><td>'
      + window.plugin.scoreboard.fieldInfo(scores['team'][TEAM_ENL]['largest']['mu'])
      + '</td></tr>'
      + '</table>';
    
    scoreHtml += '<div id="players">'
      + window.plugin.scoreboard.playerTable('mu')
      + '</div>';
    
    scoreHtml += '<div class="disclaimer">Click on player table headers to sort by that column. '
      + 'Score is subject to portals available based on zoom level. '
      + 'If names are unresolved try again. For best results wait until updates are fully loaded.</div>';
  } else {
    scoreHtml += 'You need something in view.';  
  }
  
  alert('<div id="scoreboard">' + scoreHtml + '</div>');
  $(".ui-dialog").addClass('ui-dialog-scoreboard');
  
  // Setup sorting
  $(document).on('click', '#players table th', function() {
    $('#players').html(window.plugin.scoreboard.playerTable($(this).data('sort')));
  });
}

var setup =  function() {
  $('body').append('<div id="scoreboard" style="display:none;"></div>');
  $('#toolbox').append('<a onclick="window.plugin.scoreboard.display()">scoreboard</a>');
  $('head').append('<style>' +
    '.ui-dialog-scoreboard {max-width:500px !important; width:500px !important;}' +
    '#scoreboard table {margin-top:10px;	border-collapse: collapse; empty-cells: show; width:100%; clear: both;}' +
    '#scoreboard table td, #scoreboard table th {border-bottom: 1px solid #0b314e; padding:3px; color:white; background-color:#1b415e}' +
    '#scoreboard table tr.res td { background-color: #005684; }' +
    '#scoreboard table tr.enl td { background-color: #017f01; }' +
    '#scoreboard table tr:nth-child(even) td { opacity: .8 }' +
    '#scoreboard table tr:nth-child(odd) td { color: #ddd !important; }' +
    '#scoreboard table th { text-align:left }' +
    '#scoreboard table td.number, #scoreboard table th.number { text-align:right }' +
    '#players table th { cursor:pointer; text-align: right;}' +
    '#players table th:nth-child(1) { text-align: left;}' +
    '#scoreboard table th.sorted { color:#FFCE00; }' +
    '#scoreboard .disclaimer { margin-top:10px; font-size:10px; }' +
    '.mu_score { margin-bottom: 10px; }' +
    '.mu_score span { overflow: hidden; padding-top:2px; padding-bottom: 2px; display: block; font-weight: bold; float: left; box-sizing: border-box; -moz-box-sizing:border-box; -webkit-box-sizing:border-box; }' +
    '.mu_score span.res { background-color: #005684; text-align: right; padding-right:4px; }' +
    '.mu_score span.enl { background-color: #017f01; padding-left: 4px; }' +
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
