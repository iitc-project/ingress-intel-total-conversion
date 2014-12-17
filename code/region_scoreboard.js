

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

function regionScoreboardSuccess(data) {
  if (data.result === undefined) {
    return regionScoreboardFailure();
  }


  var checkpointTable = '<table><tr><th><span title="Checkpoint number" class="help">#</span></th><th>Enlightened</th><th>Resistance</th></tr>';
  for (var i=0; i<data.result.scoreHistory.length; i++) {
    checkpointTable += '<tr><td>'+data.result.scoreHistory[i][0]+'</td><td>'+data.result.scoreHistory[i][1]+'</td><td>'+data.result.scoreHistory[i][2]+'</td></tr>';
  }
  if (data.result.scoreHistory.length == 0) {
    checkpointTable += '<tr><td colspan="3"><i>no checkpoint data</td></tr>';
  }
  checkpointTable += '</table>';


  var agentTable = '<table><tr><th>#</th><th>Agent</th></tr>';
  for (var i=0; i<data.result.topAgents.length; i++) {
    var agent = data.result.topAgents[i];
    agentTable += '<tr><td>'+(i+1)+'</td><td>'+agent.nick+' '+agent.team+'</td></tr>';
  }
  if (data.result.topAgents.length==0) {
    agentTable += '<tr><td colspan="2"><i>no top agents</i></td></tr>';
  }
  agentTable += '</table>';


  dialog({
    title: 'Region scores for '+data.result.regionName,
    html: '<b>Region scores for '+data.result.regionName+'</b>'
         +'<table><tr><th>Ehlightened</th><th>Resistance</th></tr><tr><td>'+data.result.gameScore[0]+'</td><td>'+data.result.gameScore[1]+'</td></tr></table>'
         +'<b>Checkpoint history</b>'
         +checkpointTable
         +'<b>Top agents</b>'
         +agentTable,
    width: 600
  });

}
