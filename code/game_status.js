
// GAME STATUS ///////////////////////////////////////////////////////
// MindUnit display
window.updateGameScore = function(data) {
  if(!data) {
    window.postAjax('getGameScore', {}, window.updateGameScore);
    return;
  }

  var r = parseInt(data.result.resistanceScore), e = parseInt(data.result.enlightenedScore);
  var s = r+e;
  var rp = r/s*100, ep = e/s*100;
  r = digits(r), e = digits(e);
  var rs = '<span class="res" style="width:'+rp+'%;">'+Math.round(rp)+'%&nbsp;</span>';
  var es = '<span class="enl" style="width:'+ep+'%;">&nbsp;'+Math.round(ep)+'%</span>';
  $('#gamestat').html(rs+es).one('click', function() { window.updateGameScore() });
  // help cursor via “#gamestat span”
  $('#gamestat').attr('title', 'Resistance:\t'+r+' MindUnits\nEnlightened:\t'+e+' MindUnits');

  window.setTimeout('window.updateGameScore', REFRESH_GAME_SCORE*1000);
}
