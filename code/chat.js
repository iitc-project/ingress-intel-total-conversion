window.chat = function() {}

window.getOldestTimestampChat = function(public) {
  if(public) {
    var a = $('#chatpublic time:first').data('timestamp');
    var b = $('#chatbot time:first').data('timestamp');
    if(a && b) return Math.min(a, b);
    return a || b || -1;
  } else {
    return $('#chatfaction time').first().data('timestamp') || -1;
  }
}

window.getNewestTimestampChat = function(public) {
  if(public) {
    var a = $('#chatpublic time:last').data('timestamp');
    var b = $('#chatbot time:last').data('timestamp');
    if(a && b) return Math.max(a, b);
    return a || b || -1;
  } else {
    return $('#chatfaction time').last().data('timestamp') || -1;
  }
}

window.getPostDataForChat = function(public, getOlderMsgs) {
  if(typeof public !== 'boolean') throw('Need to know if public or faction chat.');

  var b = map.getBounds();
  var ne = b.getNorthEast();
  var sw = b.getSouthWest();

  var data = {
    desiredNumItems: 10,
    minLatE6: Math.round(sw.lat*1E6),
    minLngE6: Math.round(sw.lng*1E6),
    maxLatE6: Math.round(ne.lat*1E6),
    maxLngE6: Math.round(ne.lng*1E6),
    minTimestampMs: -1,
    maxTimestampMs: -1,
    factionOnly: !public
  }

  if(getOlderMsgs) {
    // ask for older chat when scrolling up
    data = $.extend(data, {maxTimestampMs: getOldestTimestampChat(public)});
  } else {
    // ask for newer chat
    $.extend(data, {minTimestampMs: getNewestTimestampChat(public)});
  }
  return data;
}

window.requestFactionChat  = function(getOlderMsgs) {
  if(window.idleTime >= MAX_IDLE_TIME) {
    console.log('user has been idle for ' + idleTime + ' minutes. Skipping faction chat.');
    renderUpdateStatus();
    return;
  }

  data = getPostDataForChat(false, false);
  window.requests.add(window.postAjax('getPaginatedPlextsV2', data, window.handleFactionChat));
}

window.renderChatMsg = function(msg, nick, time, team) {
  var ta = unixTimeToHHmm(time);
  var tb = unixTimeToString(time, true);
  var t = '<time title="'+tb+'" data-timestamp="'+time+'">'+ta+'</time>';
  var s = 'style="color:'+COLORS[team]+'"';
  return '<p>'+t+'<mark '+s+'>'+nick+'</mark><span>'+msg+'</span></p>';
}

window.handleFactionChat = function(data, textStatus, jqXHR) {
  var appMsg = '';
  var first = null;
  var last;
  $.each(data.result.reverse(), function(ind, chat) {
    var time = chat[1];
    var msg = chat[2].plext.markup[2][1].plain;
    var team = chat[2].plext.team === 'ALIENS' ? TEAM_ENL : TEAM_RES;
    var nick = chat[2].plext.markup[1][1].plain.slice(0, -2); // cut “: ” at end
    var guid = chat[2].plext.markup[1][1].guid;
    window.setPlayerName(guid, nick); // free nick name resolves

    if(!first) first = time;
    last = time;
    appMsg += renderChatMsg(msg, nick, time, team);
  });

  $('#chatfaction').html(appMsg);
}

window.toggleChat = function() {
  var c = $('#chat');
  var cc = $('#chatcontrols');
  if(c.data('toggle')) {
    $('#chatcontrols a:first').text('expand');
    c.css('height', CHAT_SHRINKED+'px');
    c.css('top', 'auto');
    c.data('toggle', false);
    cc.css('top', 'auto');
    cc.css('bottom', (CHAT_SHRINKED+4)+'px');
  } else {
    $('#chatcontrols a:first').text('shrink');
    c.css('height', 'auto');
    c.css('top', '25px');
    c.data('toggle', true);
    cc.css('top', '0');
    cc.css('bottom', 'auto');
  }
}


window.setupChat = function() {
  $('#chatcontrols a').first().click(window.toggleChat);
  requestFactionChat();
}
