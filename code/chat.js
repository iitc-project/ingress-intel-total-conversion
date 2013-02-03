window.chat = function() {};

window.chat.getOldestTimestamp = function(public) {
  if(public) {
    var a = $('#chatpublic time:first').data('timestamp');
    var b = $('#chatbot time:first').data('timestamp');
    if(a && b) return Math.min(a, b);
    return a || b || -1;
  } else {
    return $('#chatfaction time').first().data('timestamp') || -1;
  }
}

window.chat.getNewestTimestamp = function(public) {
  if(public) {
    var a = $('#chatpublic time:last').data('timestamp');
    var b = $('#chatbot time:last').data('timestamp');
    if(a && b) return Math.max(a, b);
    return a || b || -1;
  } else {
    return $('#chatfaction time').last().data('timestamp') || -1;
  }
}

window.chat.genPostData = function(public, getOlderMsgs) {
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
    data = $.extend(data, {maxTimestampMs: chat.getOldestTimestamp(public)});
  } else {
    // ask for newer chat
    var min = chat.getNewestTimestamp(public);
    // the inital request will have both timestamp values set to -1,
    // thus we receive the newest desiredNumItems. After that, we will
    // only receive messages with a timestamp greater or equal to min
    // above.
    // After resuming from idle, there might be more new messages than
    // desiredNumItems. So on the first request, we are not really up to
    // date. We will eventually catch up, as long as there are less new
    // messages than desiredNumItems per each refresh cycle.
    // A proper solution would be to query until no more new results are
    // returned. Another way would be to set desiredNumItems to a very
    // large number so we really get all new messages since the last
    // request. Setting desiredNumItems to -1 does unfortunately not
    // work.
    // Currently this edge case is not handled. Let’s see if this is a
    // problem in crowded areas.
    $.extend(data, {minTimestampMs: min});
  }
  return data;
}

//
// requesting faction
//

window.chat._requestOldFactionRunning = false;
window.chat.requestOldFaction = function(isRetry) {
  if(chat._requestOldFactionRunning) return;
  if(isIdle()) return renderUpdateStatus();
  chat._requestOldFactionRunning = true;

  var d = chat.genPostData(false, true);
  var r = window.postAjax(
    'getPaginatedPlextsV2',
    d,
    chat.handleOldFaction,
    isRetry
      ? function() { window.chat._requestOldFactionRunning = false; }
      : function() { window.chat.requestOldFaction(true) }
  );

  requests.add(r);
}

window.chat._requestNewFactionRunning = false;
window.chat.requestNewFaction = function(isRetry) {
  if(chat._requestNewFactionRunning) return;
  if(window.isIdle()) return renderUpdateStatus();
  chat._requestNewFactionRunning = true;

  var d = chat.genPostData(false, false);
  var r = window.postAjax(
    'getPaginatedPlextsV2',
    d,
    chat.handleNewFaction,
    isRetry
      ? function() { window.chat._requestNewFactionRunning = false; }
      : function() { window.chat.requestNewFaction(true) }
  );

  requests.add(r);
}

//
// handle faction
//

window.chat.handleOldFaction = function(data, textStatus, jqXHR) {
  chat._requestOldFactionRunning = false;
  chat.handleFaction(data, textStatus, jqXHR, true);
}

window.chat.handleNewFaction = function(data, textStatus, jqXHR) {
  chat._requestNewFactionRunning = false;
  chat.handleFaction(data, textStatus, jqXHR, false);
}

window.chat._displayedFactionGuids = [];
window.chat.handleFaction = function(data, textStatus, jqXHR, isOldMsgs) {
  if(!data || !data.result) return console.warn('Couldn’t get chat data. Pausing chat for now.');

  var msgs = '';
  var prevTime = null;
  $.each(data.result.reverse(), function(ind, json) {
    // avoid duplicates
    if(window.chat._displayedFactionGuids.indexOf(json[0]) !== -1) return;
    window.chat._displayedFactionGuids.push(json[0]);

    var time = json[1];
    var msg = json[2].plext.markup[2][1].plain;
    var team = json[2].plext.team === 'ALIENS' ? TEAM_ENL : TEAM_RES;
    var nick = json[2].plext.markup[1][1].plain.slice(0, -2); // cut “: ” at end
    var pguid = json[2].plext.markup[1][1].guid;
    window.setPlayerName(pguid, nick); // free nick name resolves


    var nowTime = new Date(time).toLocaleDateString();
    if(prevTime && prevTime !== nowTime)
      msgs += '<summary>'+nowTime+'</summary>';

    msgs += chat.renderMsg(msg, nick, time, team);


    prevTime = nowTime;
  });

  var c = $('#chatfaction');
  var scrollBefore = scrollBottom(c);
  if(isOldMsgs)
    c.prepend(msgs);
  else
    c.append(msgs);

  // If scrolled down completely, keep it that way so new messages can
  // be seen easily. If scrolled up, only need to fix scroll position
  // when old messages are added. New messages added at the bottom don’t
  // change the view and enabling this would make the chat scroll down
  // for every added message, even if the user wants to read old stuff.
  if(scrollBefore === 0 || isOldMsgs) {
    c.data('ignoreNextScroll', true);
    c.scrollTop(c.scrollTop() + (scrollBottom(c)-scrollBefore));
  }

  chat.needMoreMessages();
}

window.chat.toggle = function() {
  var c = $('#chat, #chatcontrols');
  if(c.hasClass('expand')) {
    $('#chatcontrols a:first').text('expand');
    c.removeClass('expand');
  } else {
    $('#chatcontrols a:first').text('shrink');
    c.addClass('expand');
    chat.needMoreMessages();
  }
}

window.chat.request = function() {
  console.log('refreshing chat');
  chat.requestNewFaction();
  //~ chat.requestNewPublic();
}

// checks if there are enough messages in the selected chat tab and
// loads more if not.
window.chat.needMoreMessages = function() {
  var activeChat = $('#chat > :visible');
  if(scrollBottom(activeChat) !== 0 || activeChat.scrollTop() !== 0) return;
  console.log('no scrollbar in active chat, requesting more msgs');
  if($('#chatcontrols a:last.active'))
    chat.requestOldFaction();
  else
    chat.requestOldPublic();
}

window.chat.setupTime = function() {
  var inputTime = $('#chatinput time');
  var updateTime = function() {
    if(window.isIdle()) return;
    var d = new Date();
    inputTime.text(d.toLocaleTimeString().slice(0, 5));
    // update ON the minute (1ms after)
    setTimeout(updateTime, (60 - d.getSeconds()) * 1000 + 1);
  };
  updateTime();
  window.addResumeFunction(updateTime);
}

window.chat.setup = function() {
  $('#chatcontrols, #chat, #chatinput').show();

  $('#chatcontrols a:first').click(window.chat.toggle);
  $('#chatinput').click(function() {
    $('#chatinput input').focus();
  });

  window.chat.setupTime();

  $('#chatfaction').scroll(function() {
    var t = $(this);
    if(t.data('ignoreNextScroll')) return t.data('ignoreNextScroll', false);
    if(t.scrollTop() < 200) chat.requestOldFaction();
    if(scrollBottom(t) === 0) chat.requestNewFaction();
  });

  $('#chatpublic, #chatbot').scroll(function() {
    var t = $(this);
    if(t.data('ignoreNextScroll')) return t.data('ignoreNextScroll', false);
    if(t.scrollTop() < 200) chat.requestOldPublic();
    if(scrollBottom(t) === 0) chat.requestNewPublic();
  });


  chat.requestNewFaction();
  window.addResumeFunction(chat.request);
  window.requests.addRefreshFunction(chat.request);
}


window.chat.renderMsg = function(msg, nick, time, team) {
  var ta = unixTimeToHHmm(time);
  var tb = unixTimeToString(time, true);
  var t = '<time title="'+tb+'" data-timestamp="'+time+'">'+ta+'</time>';
  var s = 'style="color:'+COLORS[team]+'"';
  return '<p>'+t+'<mark '+s+'>'+nick+'</mark><span>'+msg+'</span></p>';
}
