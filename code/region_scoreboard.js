

window.regionScoreboard = function() {
  // TODO: rather than just load the region scores for the center of the map, display a list of regions in the current view
  // and let the user select one (with automatic selection when just one region, and limited to close enough zooms so list size is reasonable)
  var latLng = map.getCenter();

  var latE6 = Math.round(latLng.lat*1E6);
  var lngE6 = Math.round(latLng.lng*1E6);

  window.postAjax('getRegionScoreDetails', {latE6:latE6,lngE6:lngE6}, regionScoreboardSuccess, regionScoreboardFailure);
}

function regionScoreboardFailure() {
  dialog({
    title: 'Error loading region scores',
    text: 'Failed to load region scores - try again'
  });

}


function regionScoreboardScoreHistoryChart(result) {
  // svg area 400x120. graph area 350x100, offset to 40,10

  var max = Math.max(result.gameScore[0],result.gameScore[1],10); //NOTE: ensure a min of 10 for the graph
  var items = []; //we'll copy the items to an array indexed by checkpoint number - easier to access!
  for (var i=0; i<result.scoreHistory.length; i++) {
    max = Math.max(max, result.scoreHistory[i][1], result.scoreHistory[i][2]); //note: index 0 is the checkpoint number here
    items[result.scoreHistory[i][0]] = [result.scoreHistory[i][1], result.scoreHistory[i][2]];
  }

  var scale = function(y) { return 110-y/max*100; };


  var teamPaths = [[],[]];
  var circleMarkers = [];

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
        circleMarkers.push('<circle cx="'+x+'" cy="'+scale(items[i][t])+'" r="3" stroke-width="1" stroke="'+col+'" fill="'+col+'" fill-opacity="0.5" title="'+(t==0?'Enl':'Res')+' CP #'+i+': '+digits(items[i][t])+'" />');
      }
    }
  }


  var paths = '';
  for (var t=0; t<2; t++) {
    var col = t==0 ? COLORS[TEAM_ENL] : COLORS[TEAM_RES];
    if (teamPaths[t].length > 0) {
      paths += '<path d="'+teamPaths[t].join(' ')+'" stroke="'+col+'" />';
    }

    var y = scale(result.gameScore[t]);
    paths += '<path d="M40,'+y+' L390,'+y+'" stroke="'+col+'" stroke-dasharray="3,2" opacity="0.8" />';
  }


  var svg = '<div><svg width="400" height="120">'
           +'<rect x="0" y="0" width="400" height="120" stroke="#FFCE00" fill="#08304E" />'
           +'<path d="M40,110 L40,10 M40,110 L390,110" stroke="#fff" />'
           +paths
           +circleMarkers.join('')
           +'</svg></div>';

  return svg;
}


function regionScoreboardSuccess(data) {
  if (data.result === undefined) {
    return regionScoreboardFailure();
  }


//  var checkpointTable = '<table><tr><th><span title="Checkpoint number" class="help">#</span></th><th>Enlightened</th><th>Resistance</th></tr>';
//  for (var i=0; i<data.result.scoreHistory.length; i++) {
//    checkpointTable += '<tr><td>'+data.result.scoreHistory[i][0]+'</td><td>'+data.result.scoreHistory[i][1]+'</td><td>'+data.result.scoreHistory[i][2]+'</td></tr>';
//  }
//  if (data.result.scoreHistory.length == 0) {
//    checkpointTable += '<tr><td colspan="3"><i>no checkpoint data</td></tr>';
//  }
//  checkpointTable += '</table>';


  var agentTable = '<table><tr><th>#</th><th>Agent</th></tr>';
  for (var i=0; i<data.result.topAgents.length; i++) {
    var agent = data.result.topAgents[i];
    agentTable += '<tr><td>'+(i+1)+'</td><td class="'+(agent.team=='RESISTANCE'?'res':'enl')+'">'+agent.nick+'</td></tr>';
  }
  if (data.result.topAgents.length==0) {
    agentTable += '<tr><td colspan="2"><i>no top agents</i></td></tr>';
  }
  agentTable += '</table>';


  dialog({
    title: 'Region scores for '+data.result.regionName,
    html: '<b>Region scores for '+data.result.regionName+'</b>'
         +'<table><tr><th class="enl">Enlightened</th><th class="res">Resistance</th></tr><tr><td class="enl">'+digits(data.result.gameScore[0])+'</td><td class="res">'+digits(data.result.gameScore[1])+'</td></tr></table>'
         +'<b>Checkpoint history</b>'
         +regionScoreboardScoreHistoryChart(data.result)
         +'<b>Top agents</b>'
         +agentTable,
    width: 600
  });

}
