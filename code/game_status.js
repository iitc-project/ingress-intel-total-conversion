
// GAME STATUS ///////////////////////////////////////////////////////
// MindUnit display


window.updateGameScore = function(data) {
  if(!data) {
    // move the postAjax call onto a very short timer. this way, if it throws an exception, it won't prevent IITC booting
    setTimeout (function() { window.postAjax('getGameScore', {}, window.updateGameScore); }, 1);
    return;
  }

  if (data && data.result) {

    var e = parseInt(data.result[0]); //enlightened score in result[0]
    var r = parseInt(data.result[1]); //resistance score in result[1]
    var s = r+e;
    var rp = r/s*100, ep = e/s*100;
    r = digits(r), e = digits(e);
    var rs = '<span class="res" style="width:'+rp+'%;">'+Math.round(rp)+'%&nbsp;</span>';
    var es = '<span class="enl" style="width:'+ep+'%;">&nbsp;'+Math.round(ep)+'%</span>';
    $('#gamestat').html(rs+es).one('click', function() { window.updateGameScore() });
    // help cursor via “#gamestat span”
    $('#gamestat').attr('title', 'Resistance:\t'+r+' MindUnits\nEnlightened:\t'+e+' MindUnits');
  } else if (data && data.error) {
    console.warn('game score failed to load: '+data.error);
  } else {
    console.warn('game score failed to load - unknown reason');
  }

  // TODO: idle handling - don't refresh when IITC is idle!
  window.setTimeout('window.updateGameScore', REFRESH_GAME_SCORE*1000);
}
