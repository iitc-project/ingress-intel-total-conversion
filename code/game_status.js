
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
  // the niantic servers have attempted to obfuscate the client/server protocol, by munging the request parameters
  // detecting which munge set should be used is tricky - even the stock site gets it wrong sometimes
  // to detect the problem and try a different set is easiest in a place where there's only a single request of that type
  // sent at once, and it has no extra parameters. this method matches those requirements
  if (data.error || (data.indexOf && data.indexOf('"error"') != -1)) {
    if (data.error == 'missing version') {
      dialog({
        title: 'Reload IITC',
        html: '<p>IITC is using an outdated munge set. This can happen when Niantic update the standard intel site.</p>'
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
