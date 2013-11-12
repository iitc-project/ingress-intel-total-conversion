// GAME STATUS ///////////////////////////////////////////////////////
// MindUnit display

window.window.updateGameScoreFailCount = 0;

window.updateGameScore = function(data) {
  if(!data) {
    window.postAjax('getGameScore', {}, window.updateGameScore);
    return;
  }

  // hacky - but here is as good as any for a location
  // the niantic servers have attempted to obsfucate the client/server protocol, by munging the request parameters
  // detecting which munge set should be used is tricky - even the stock site gets it wrong sometimes
  // to detect the problem and try a different set is easiest in a place where there's only a single request of that type
  // sent at once, and it has no extra parameters. this method matches those requirements
  if (data.error || (data.indexOf && data.indexOf('"error"') != -1)) {
    window.window.updateGameScoreFailCount++;
    if (window.window.updateGameScoreFailCount <= window.requestParameterMunges.length) {
      window.activeRequestMungeSet = (window.activeRequestMungeSet+1) % window.requestParameterMunges.length;
      console.warn('IITC munge issue - cycling to set '+window.activeRequestMungeSet);

      updateGameScore();
      return;
    } else {
      console.error('IITC munge issue - and retry limit reached. IITC will likely fail');

      // if we can be sure that the issue is not caused by Ingress being down, notify the user
      if (data.error && data.error === 'missing version') {
        alert("Could not fetch game score.\nThis is most likely due to changes on the stock Intel Map, breaking IITC at the moment.\n\nDON'T PANIC!\nDevelopers are automatically notified of this issue.");
      } else {
        alert("Could not fetch game score.\nIt appears to be a temporary problem, refreshing or simply waiting might help.");
      }
    }
  }

  window.window.updateGameScoreFailCount = 0;

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
