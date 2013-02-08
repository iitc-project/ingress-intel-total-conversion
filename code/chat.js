window.chat = function() {};

window.chat._lastNicksForAutocomplete = [[], []];
window.chat.addNickForAutocomplete = function(nick, isFaction) {
  var r = chat._lastNicksForAutocomplete[isFaction ? 0 : 1];
  if(r.indexOf(nick) !== -1) return;
  r.push(nick);
  if(r.length >= 15)
    r.shift();
}

window.chat.handleTabCompletion = function() {
  var el = $('#chatinput input');
  var curPos = el.get(0).selectionStart;
  var text = el.val();
  var word = text.slice(0, curPos).replace(/.*\b([a-z0-9-_])/, '$1').toLowerCase();

  var list = window.chat._lastNicksForAutocomplete;
  list = list[1].concat(list[0]);

  var nick = null;
  for(var i = 0; i < list.length; i++) {
    if(!list[i].toLowerCase().startsWith(word)) continue;
    if(nick && nick !== list[i]) {
      console.log('More than one nick matches, aborting. ('+list[i]+' vs '+nick+')');
      return;
    }
    nick = list[i];
  }
  if(!nick) {
    console.log('No matches for ' + word);
    return;
  }

  var posStart = curPos - word.length;
  var newText = text.substring(0, posStart);
  newText += nick + (posStart === 0 ? ': ' : ' ');
  newText += text.substring(curPos);
  el.val(newText);
}

//
// timestamp and clear management
//

window.chat._oldFactionTimestamp = -1;
window.chat._newFactionTimestamp = -1;
window.chat._oldPublicTimestamp = -1;
window.chat._newPublicTimestamp = -1;

window.chat.getOldestTimestamp = function(public) {
  return chat['_old'+(public ? 'Public' : 'Faction')+'Timestamp'];
}

window.chat.getNewestTimestamp = function(public) {
  return chat['_new'+(public ? 'Public' : 'Faction')+'Timestamp'];
}

window.chat.clearIfRequired = function(elm) {
  if(!elm.data('needsClearing')) return;
  elm.data('ignoreNextScroll', true).data('needsClearing', false).html('');
}

window.chat._oldBBox = null;
window.chat.genPostData = function(public, getOlderMsgs) {
  if(typeof public !== 'boolean') throw('Need to know if public or faction chat.');

  chat._localRangeCircle.setLatLng(map.getCenter());
  var b = map.getBounds().extend(chat._localRangeCircle.getBounds());
  var ne = b.getNorthEast();
  var sw = b.getSouthWest();

  // round bounds in order to ignore rounding errors
  var bbs = $.map([ne.lat, ne.lng, sw.lat, sw.lng], function(x) { return Math.round(x*1E4) }).join();
  if(chat._oldBBox && chat._oldBBox !== bbs) {
    $('#chat > div').data('needsClearing', true);
    console.log('Bounding Box changed, chat will be cleared (old: '+chat._oldBBox+' ; new: '+bbs+' )');
    // need to reset these flags now because clearing will only occur
    // after the request is finished – i.e. there would be one almost
    // useless request.
    chat._displayedFactionGuids = [];
    chat._displayedPublicGuids = [];
    chat._displayedPlayerActionTime = {};
    chat._oldFactionTimestamp = -1;
    chat._newFactionTimestamp = -1;
    chat._oldPublicTimestamp = -1;
    chat._newPublicTimestamp = -1;
  }
  chat._oldBBox = bbs;

  var ne = b.getNorthEast();
  var sw = b.getSouthWest();
  var data = {
    desiredNumItems: public ? CHAT_PUBLIC_ITEMS : CHAT_FACTION_ITEMS,
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
  if(!data || !data.result) {
    window.failedRequestCount++;
    return console.warn('faction chat error. Waiting for next auto-refresh.');
  }

  var c = $('#chatfaction');
  chat.clearIfRequired(c);

  if(data.result.length === 0) return;

  chat._newFactionTimestamp = data.result[0][1];
  chat._oldFactionTimestamp = data.result[data.result.length-1][1];

  var scrollBefore = scrollBottom(c);
  chat.renderPlayerMsgsTo(true, data, isOldMsgs, chat._displayedFactionGuids);
  chat.keepScrollPosition(c, scrollBefore, isOldMsgs);

  if(data.result.length >= CHAT_FACTION_ITEMS) chat.needMoreMessages();
}




//
// requesting public
//

window.chat._requestOldPublicRunning = false;
window.chat.requestOldPublic = function(isRetry) {
  if(chat._requestOldPublicRunning) return;
  if(isIdle()) return renderUpdateStatus();
  chat._requestOldPublicRunning = true;

  var d = chat.genPostData(true, true);
  var r = window.postAjax(
    'getPaginatedPlextsV2',
    d,
    chat.handleOldPublic,
    isRetry
      ? function() { window.chat._requestOldPublicRunning = false; }
      : function() { window.chat.requestOldPublic(true) }
  );

  requests.add(r);
}

window.chat._requestNewPublicRunning = false;
window.chat.requestNewPublic = function(isRetry) {
  if(chat._requestNewPublicRunning) return;
  if(window.isIdle()) return renderUpdateStatus();
  chat._requestNewPublicRunning = true;

  var d = chat.genPostData(true, false);
  var r = window.postAjax(
    'getPaginatedPlextsV2',
    d,
    chat.handleNewPublic,
    isRetry
      ? function() { window.chat._requestNewPublicRunning = false; }
      : function() { window.chat.requestNewPublic(true) }
  );

  requests.add(r);
}


//
// handle public
//


window.chat.handleOldPublic = function(data, textStatus, jqXHR) {
  chat._requestOldPublicRunning = false;
  chat.handlePublic(data, textStatus, jqXHR, true);
}

window.chat.handleNewPublic = function(data, textStatus, jqXHR) {
  chat._requestNewPublicRunning = false;
  chat.handlePublic(data, textStatus, jqXHR, false);
}

window.chat._displayedPublicGuids = [];
window.chat._displayedPlayerActionTime = {};
window.chat.handlePublic = function(data, textStatus, jqXHR, isOldMsgs) {
  if(!data || !data.result) {
    window.failedRequestCount++;
    return console.warn('public chat error. Waiting for next auto-refresh.');
  }

  var ca = $('#chatautomated');
  var cp = $('#chatpublic');
  chat.clearIfRequired(ca);
  chat.clearIfRequired(cp);

  if(data.result.length === 0) return;

  chat._newPublicTimestamp = data.result[0][1];
  chat._oldPublicTimestamp = data.result[data.result.length-1][1];


  var scrollBefore = scrollBottom(ca);
  chat.handlePublicAutomated(data);
  chat.keepScrollPosition(ca, scrollBefore, isOldMsgs);


  var scrollBefore = scrollBottom(cp);
  chat.renderPlayerMsgsTo(false, data, isOldMsgs, chat._displayedPublicGuids);
  chat.keepScrollPosition(cp, scrollBefore, isOldMsgs);

  if(data.result.length >= CHAT_PUBLIC_ITEMS) chat.needMoreMessages();
}


window.chat.handlePublicAutomated = function(data) {
 $.each(data.result, function(ind, json) { // newest first!
    var time = json[1];

    // ignore player messages
    var t = json[2].plext.plextType;
    if(t !== 'SYSTEM_BROADCAST' && t !== 'SYSTEM_NARROWCAST') return true;

    var tmpmsg = '', nick = null, pguid, team;

    // each automated message is composed of many text chunks. loop
    // over them to gather all necessary data.
    $.each(json[2].plext.markup, function(ind, part) {
      switch(part[0]) {
        case 'PLAYER':
          pguid = part[1].guid;
          var lastAction = window.chat._displayedPlayerActionTime[pguid];
          // ignore older messages about player
          if(lastAction && lastAction[0] > time) return false;

          nick = part[1].plain;
          team = part[1].team === 'ALIENS' ? TEAM_ENL : TEAM_RES;
          window.setPlayerName(pguid, nick); // free nick name resolves
          if(ind > 0) tmpmsg += nick; // don’t repeat nick directly
          break;

        case 'TEXT':
          tmpmsg += part[1].plain;
          break;

        case 'PORTAL':
          var latlng = [part[1].latE6/1E6, part[1].lngE6/1E6];
          var js = 'window.zoomToAndShowPortal(\''+part[1].guid+'\', ['+latlng[0]+', '+latlng[1]+'])';
          tmpmsg += '<a onclick="'+js+'" title="'+part[1].address+'" class="help">'+part[1].name+'</a>';
          break;
      }
    });

    // nick will only be set if we don’t have any info about that
    // player yet.
    if(nick) {
      tmpmsg = chat.renderMsg(tmpmsg, nick, time, team);
      window.chat._displayedPlayerActionTime[pguid] = [time, tmpmsg];
    };
 });

  if(chat.getActive() === 'automated')
    window.chat.renderAutomatedMsgsTo();
}

window.chat.renderAutomatedMsgsTo = function() {
  var x = window.chat._displayedPlayerActionTime;
  // we don’t care about the GUIDs anymore
  var vals = $.map(x, function(v, k) { return [v]; });
  // sort them old to new
  vals = vals.sort(function(a, b) { return a[0]-b[0]; });

  var prevTime = null;
  var msgs = $.map(vals, function(v) {
    var nowTime = new Date(v[0]).toLocaleDateString();
    if(prevTime && prevTime !== nowTime)
      var val = chat.renderDivider(nowTime) + v[1];
    else
      var val = v[1];

    prevTime = nowTime;
    return val;
  }).join('\n');

  $('#chatautomated').html(msgs);
}




//
// common
//


window.chat.renderPlayerMsgsTo = function(isFaction, data, isOldMsgs, dupCheckArr) {
  var msgs = '';
  var prevTime = null;

  $.each(data.result.reverse(), function(ind, json) { // oldest first!
    if(json[2].plext.plextType !== 'PLAYER_GENERATED') return true;

    // avoid duplicates
    if(dupCheckArr.indexOf(json[0]) !== -1) return true;
    dupCheckArr.push(json[0]);

    var time = json[1];
    var team = json[2].plext.team === 'ALIENS' ? TEAM_ENL : TEAM_RES;
    var msg, nick, pguid;
    $.each(json[2].plext.markup, function(ind, markup) {
      if(markup[0] === 'SENDER') {
        nick = markup[1].plain.slice(0, -2); // cut “: ” at end
        pguid = markup[1].guid;
        window.setPlayerName(pguid, nick); // free nick name resolves
        if(!isOldMsgs) window.chat.addNickForAutocomplete(nick, isFaction);
      }

      if(markup[0] === 'TEXT') {
        msg = markup[1].plain.autoLink();
        msg = msg.replace(window.PLAYER['nickMatcher'], '<em>$1</em>');
      }

      if(!isFaction && markup[0] === 'SECURE') {
        nick = null;
        return false; // aka break
      }
    });

    if(!nick) return true; // aka next

    var nowTime = new Date(time).toLocaleDateString();
    if(prevTime && prevTime !== nowTime)
      msgs += chat.renderDivider(nowTime);

    msgs += chat.renderMsg(msg, nick, time, team);
    prevTime = nowTime;
  });

  var addTo = isFaction ? $('#chatfaction') : $('#chatpublic');

  // if there is a change of day between two requests, handle the
  // divider insertion here.
  if(isOldMsgs) {
    var ts = addTo.find('time:first').data('timestamp');
    var nextTime = new Date(ts).toLocaleDateString();
    if(prevTime && prevTime !== nextTime && ts)
      msgs += chat.renderDivider(nextTime);
  }

  if(isOldMsgs)
    addTo.prepend(msgs);
  else
    addTo.append(msgs);
}


window.chat.renderDivider = function(text) {
  return '<summary>─ '+text+' ────────────────────────────────────────────────────────────────────────────</summary>';
}


window.chat.renderMsg = function(msg, nick, time, team) {
  var ta = unixTimeToHHmm(time);
  var tb = unixTimeToString(time, true);
  // help cursor via “#chat time”
  var t = '<time title="'+tb+'" data-timestamp="'+time+'">'+ta+'</time>';
  var s = 'style="color:'+COLORS[team]+'"';
  var title = nick.length >= 8 ? 'title="'+nick+'" class="help"' : '';
  return '<p>'+t+'<mark '+s+'>'+nick+'</mark><span>'+msg+'</span></p>';
}



window.chat.getActive = function() {
  return $('#chatcontrols .active').text();
}


window.chat.toggle = function() {
  var c = $('#chat, #chatcontrols');
  if(c.hasClass('expand')) {
    $('#chatcontrols a:first').text('expand');
    c.removeClass('expand');
    var div = $('#chat > div:visible');
    div.data('ignoreNextScroll', true);
    div.scrollTop(99999999); // scroll to bottom
  } else {
    $('#chatcontrols a:first').text('shrink');
    c.addClass('expand');
    chat.needMoreMessages();
  }
}


window.chat.request = function() {
  console.log('refreshing chat');
  chat.requestNewFaction();
  chat.requestNewPublic();
}


// checks if there are enough messages in the selected chat tab and
// loads more if not.
window.chat.needMoreMessages = function() {
  var activeChat = $('#chat > :visible');
  if(scrollBottom(activeChat) !== 0 || activeChat.scrollTop() !== 0) return;
  console.log('no scrollbar in active chat, requesting more msgs');
  if($('#chatcontrols a:last.active').length)
    chat.requestOldFaction();
  else
    chat.requestOldPublic();
}


window.chat.chooser = function(event) {
  var t = $(event.target);
  var tt = t.text();
  var span = $('#chatinput span');

  $('#chatcontrols .active').removeClass('active');
  t.addClass('active');

  $('#chat > div').hide();

  var elm;

  switch(tt) {
    case 'faction':
      span.css('color', '');
      span.text('tell faction:');
      elm = $('#chatfaction');
      break;

    case 'public':
      span.css('cssText', 'color: red !important');
      span.text('broadcast:');
      elm = $('#chatpublic');
      break;

    case 'automated':
      span.css('cssText', 'color: #bbb !important');
      span.text('tell Jarvis:');
      chat.renderAutomatedMsgsTo();
      elm = $('#chatautomated');
      break;
  }

  elm.show();
  if(elm.data('needsScrollTop')) {
    elm.data('ignoreNextScroll', true);
    elm.scrollTop(elm.data('needsScrollTop'));
    elm.data('needsScrollTop', null);
  }

  chat.needMoreMessages();
}


// contains the logic to keep the correct scroll position.
window.chat.keepScrollPosition = function(box, scrollBefore, isOldMsgs) {
  // If scrolled down completely, keep it that way so new messages can
  // be seen easily. If scrolled up, only need to fix scroll position
  // when old messages are added. New messages added at the bottom don’t
  // change the view and enabling this would make the chat scroll down
  // for every added message, even if the user wants to read old stuff.

  if(box.is(':hidden') && !isOldMsgs) {
    box.data('needsScrollTop', 99999999);
    return;
  }

  if(scrollBefore === 0 || isOldMsgs) {
    box.data('ignoreNextScroll', true);
    box.scrollTop(box.scrollTop() + (scrollBottom(box)-scrollBefore));
  }
}




//
// setup
//

window.chat.setup = function() {
  window.chat._localRangeCircle =  L.circle(map.getCenter(), CHAT_MIN_RANGE*1000);

  $('#chatcontrols, #chat, #chatinput').show();

  $('#chatcontrols a:first').click(window.chat.toggle);
  $('#chatcontrols a:not(:first)').click(window.chat.chooser);


  $('#chatinput').click(function() {
    $('#chatinput input').focus();
  });

  window.chat.setupTime();
  window.chat.setupPosting();

  $('#chatfaction').scroll(function() {
    var t = $(this);
    if(t.data('ignoreNextScroll')) return t.data('ignoreNextScroll', false);
    if(t.scrollTop() < 200) chat.requestOldFaction();
    if(scrollBottom(t) === 0) chat.requestNewFaction();
  });

  $('#chatpublic, #chatautomated').scroll(function() {
    var t = $(this);
    if(t.data('ignoreNextScroll')) return t.data('ignoreNextScroll', false);
    if(t.scrollTop() < 200) chat.requestOldPublic();
    if(scrollBottom(t) === 0) chat.requestNewPublic();
  });

  chat.request();
  window.addResumeFunction(chat.request);
  window.requests.addRefreshFunction(chat.request);

  var cls = PLAYER.team === 'ALIENS' ? 'enl' : 'res';
  $('#chatinput span').addClass(cls)
}


window.chat.setupTime = function() {
  var inputTime = $('#chatinput time');
  var updateTime = function() {
    if(window.isIdle()) return;
    var d = new Date();
    var h = d.getHours() + ''; if(h.length === 1) h = '0' + h;
    var m = d.getMinutes() + ''; if(m.length === 1) m = '0' + m;
    inputTime.text(h+':'+m);
    // update ON the minute (1ms after)
    setTimeout(updateTime, (60 - d.getSeconds()) * 1000 + 1);
  };
  updateTime();
  window.addResumeFunction(updateTime);
}


//
// posting
//


window.chat.setupPosting = function() {
  $('#chatinput input').keypress(function(event) {
try{

    var kc = (event.keyCode ? event.keyCode : event.which);
    if(kc === 13) { // enter
      chat.postMsg();
      event.preventDefault();
    } else if (kc === 9) { // tab
      event.preventDefault();
      window.chat.handleTabCompletion();
    }


} catch(error) {
  console.log(error);
  debug.printStackTrace();
}
  });

  $('#chatinput').submit(function(event) {
    chat.postMsg();
    event.preventDefault();
  });
}


window.chat.postMsg = function() {
  var c = chat.getActive();
  if(c === 'automated') return alert('Jarvis: A strange game. The only winning move is not to play. How about a nice game of chess?');

  var msg = $.trim($('#chatinput input').val());
  if(!msg || msg === '') return;

  var public = c === 'public';
  var latlng = map.getCenter();

  var data = {message: msg,
              latE6: Math.round(latlng.lat*1E6),
              lngE6: Math.round(latlng.lng*1E6),
              factionOnly: !public};

  window.postAjax('sendPlext', data,
    function() { if(public) chat.requestNewPublic(); else chat.requestNewFaction(); },
    function() {
      alert('Your message could not be delivered. You can copy&' +
            'paste it here and try again if you want:\n\n'+msg);
    }
  );

  $('#chatinput input').val('');
}
