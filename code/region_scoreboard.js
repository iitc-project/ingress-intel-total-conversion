

window.regionScoreboard = function() {
  // TODO: rather than just load the region scores for the center of the map, display a list of regions in the current view
  // and let the user select one (with automatic selection when just one region, and limited to close enough zooms so list size is reasonable)
  var latLng = map.getCenter();

  var latE6 = Math.round(latLng.lat*1E6);
  var lngE6 = Math.round(latLng.lng*1E6);

  var dlg = dialog({title:'Region scores',html:'Loading regional scores...',width:450,minHeight:370});

  window.postAjax('getRegionScoreDetails', {latE6:latE6,lngE6:lngE6}, function(res){regionScoreboardSuccess(res,dlg);}, function(){regionScoreboardFailure(dlg);});
}

function regionScoreboardFailure(dlg) {
  dlg.html('Failed to load region scores - try again');
}


function regionScoreboardScoreHistoryChart(result) {
  // svg area 400x130. graph area 350x100, offset to 40,10

  var max = Math.max(result.gameScore[0],result.gameScore[1],10); //NOTE: ensure a min of 10 for the graph
  var items = []; //we'll copy the items to an array indexed by checkpoint number - easier to access!
  for (var i=0; i<result.scoreHistory.length; i++) {
    max = Math.max(max, result.scoreHistory[i][1], result.scoreHistory[i][2]); //note: index 0 is the checkpoint number here
    items[result.scoreHistory[i][0]] = [result.scoreHistory[i][1], result.scoreHistory[i][2]];
  }

  // scale up maximum a little, so graph isn't squashed right against upper edge
  max *= 1.09;

  var scale = function(y) { return 110-y/max*100; };


  var teamPaths = [[],[]];
  var otherSvg = [];

  for (var i=0; i<items.length; i++) {
    var x=i*10+40;
    if (items[i] !== undefined) {
      // paths
      if (i>0 && items[i-1] !== undefined) {
        for (var t=0; t<2; t++) {
          teamPaths[t].push('M'+(x-10)+','+scale(items[i-1][t])+' L'+x+','+scale(items[i][t]));
        }
      }
      // markers
      for (var t=0; t<2; t++) {
        var col = t==0 ? COLORS[TEAM_ENL] : COLORS[TEAM_RES];
        otherSvg.push('<circle cx="'+x+'" cy="'+scale(items[i][t])+'" r="3" stroke-width="1" stroke="'+col+'" fill="'+col+'" fill-opacity="0.5" title="'+(t==0?'Enl':'Res')+' CP #'+i+': '+digits(items[i][t])+'" />');
      }
    }
  }


  var paths = '<path d="M40,110 L40,10 M40,110 L390,110" stroke="#fff" />';

  // graph tickmarks - horizontal
  var ticks = [];
  for (var i=5; i<=35; i+=5) {
    var x=i*10+40;
    ticks.push('M'+x+',10 L'+x+',110');
    otherSvg.push('<text x="'+x+'" y="125" font-size="12" font-family="Roboto, Helvetica, sans-serif" text-anchor="middle" fill="#fff">'+i+'</text>');
  }

  // vertical
  // first we calculate the power of 10 that is smaller than the max limit
  var vtickStep = Math.pow(10,Math.floor(Math.log(max)/Math.log(10)));
  // this could be between 1 and 10 grid lines - so we adjust to give nicer spacings
  if (vtickStep < (max/5)) {
    vtickStep *= 2;
  } else if (vtickStep > (max/2)) {
    vtickStep /= 2;
  }
  for (var i=vtickStep; i<=max; i+=vtickStep) {
    var y = scale(i);

    ticks.push('M40,'+y+' L390,'+y);

    var istr = i>=1000000000 ? i/1000000000+'B' : i>=1000000 ? i/1000000+'M' : i>=1000 ? i/1000+'k' : i;
    otherSvg.push('<text x="35" y="'+y+'" font-size="12" font-family="Roboto, Helvetica, sans-serif" text-anchor="end" fill="#fff">'+istr+'</text>');
  }

  paths += '<path d="'+ticks.join(' ')+'" stroke="#fff" opacity="0.3" />;'

  for (var t=0; t<2; t++) {
    var col = t==0 ? COLORS[TEAM_ENL] : COLORS[TEAM_RES];
    if (teamPaths[t].length > 0) {
      paths += '<path d="'+teamPaths[t].join(' ')+'" stroke="'+col+'" />';
    }

    var y = scale(result.gameScore[t]);
    paths += '<path d="M40,'+y+' L390,'+y+'" stroke="'+col+'" stroke-dasharray="3,2" opacity="0.8" />';
  }

  var svg = '<div><svg width="400" height="130">'
           +'<rect x="0" y="0" width="400" height="130" stroke="#FFCE00" fill="#08304E" />'
           +paths
           +otherSvg.join('')
           +'</svg></div>';

  return svg;
}


function regionScoreboardSuccess(data,dlg) {
  if (data.result === undefined) {
    return regionScoreboardFailure(dlg);
  }



  var agentTable = '<table><tr><th>#</th><th>Agent</th></tr>';
  for (var i=0; i<data.result.topAgents.length; i++) {
    var agent = data.result.topAgents[i];
    agentTable += '<tr><td>'+(i+1)+'</td><td class="'+(agent.team=='RESISTANCE'?'res':'enl')+'">'+agent.nick+'</td></tr>';
  }
  if (data.result.topAgents.length==0) {
    agentTable += '<tr><td colspan="2"><i>no top agents</i></td></tr>';
  }
  agentTable += '</table>';


  var maxAverage = Math.max(data.result.gameScore[0], data.result.gameScore[1], 1);
  var teamRow = [];
  for (var t=0; t<2; t++) {
    var team = t==0 ? 'Enlightened' : 'Resistance';
    var teamClass = t==0 ? 'enl' : 'res';
    var teamCol = t==0 ? COLORS[TEAM_ENL] : COLORS[TEAM_RES];
    var barSize = Math.round(data.result.gameScore[t]/maxAverage*200);
    teamRow[t] = '<tr><th class="'+teamClass+'">'+team+'</th><td class="'+teamClass+'">'+digits(data.result.gameScore[t])+'</td><td><div style="background:'+teamCol+'; width: '+barSize+'px; height: 1.3ex; border: 2px outset '+teamCol+'"> </td></tr>';

  }

  var first = PLAYER.team == 'RESISTANCE' ? 1 : 0;

  dlg.html('<b>Region scores for '+data.result.regionName+'</b>'
         +'<table>'+teamRow[first]+teamRow[1-first]+'</table>'
         +'<b>Checkpoint history</b>'
         +regionScoreboardScoreHistoryChart(data.result)
         +'<b>Top agents</b>'
         +agentTable);

}
