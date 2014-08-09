
// GAME STATUS ///////////////////////////////////////////////////////
// MindUnit display

window.updateGameScoreFailCount = 0;

window.updateGameScore = function(data) {
  if(!data) {
    // move the postAjax call onto a very short timer. this way, if it throws an exception, it won't prevent IITC booting
    setTimeout (function() { window.postAjax('getGameScore', {}, window.updateGameScore); }, 1);
    return;
  }

  // hacky - but here is as good as any for a location
  // tne niantic servers include a 'version' parameter with the requests. this is changed for any site update they
  // roll out, even when the protocol has no changes at all. (and sometimes when there's no other client javascript
  // changes of any kind!)
  if (data.error || (data.indexOf && data.indexOf('"error"') != -1)) {
    if (data.error == 'out of date') {
      dialog({
        title: 'Reload IITC',
        html: '<p>IITC is using an outdated version code. This will happen when Niantic update the standard intel site.</p>'
             +'<p>You need to reload the page to get the updated changes.</p>'
             +'<p>If you have just reloaded the page, then an old version of the standard site script is cached somewhere.'
             +'In this case, try clearing your cache, or waiting 15-30 minutes for the stale data to expire.</p>',
        buttons: {
          'RELOAD': function() { window.location.reload(); }
        }
      });
      return;

    } else {
      console.error('game score failed to load');
    }
  }

  window.updateGameScoreFailCount = 0;

  var e = parseInt(data[0]); //enlightened score in data[0]
  var r = parseInt(data[1]); //resistance score in data[1]
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
