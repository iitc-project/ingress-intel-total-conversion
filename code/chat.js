window.chat = function() {};

window.chat.handleTabCompletion = function() {
  var el = $('#chatinput input');
  var curPos = el.get(0).selectionStart;
  var text = el.val();
  var word = text.slice(0, curPos).replace(/.*\b([a-z0-9-_])/, '$1').toLowerCase();

  var list = $('#chat > div:visible mark');
  list = list.map(function(ind, mark) { return $(mark).text(); } );
  list = uniqueArray(list);

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

window.chat.getTimestamps = function(isFaction) {
  var storage = isFaction ? chat._factionData : chat._publicData;
  return $.map(storage, function(v, k) { return [v[0]]; });
}

window.chat.getOldestTimestamp = function(isFaction) {
  var t = Math.min.apply(null, chat.getTimestamps(isFaction));
  return t === Infinity ? -1 : t;
}

window.chat.getNewestTimestamp = function(isFaction) {
  var t = Math.max.apply(null, chat.getTimestamps(isFaction));
  return t === -1*Infinity ? -1 : t;
}

window.chat._oldBBox = null;
window.chat.genPostData = function(isFaction, getOlderMsgs) {
  if(typeof isFaction !== 'boolean') throw('Need to know if public or faction chat.');

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
    chat._factionData = {};
    chat._publicData = {};
  }
  chat._oldBBox = bbs;

  var ne = b.getNorthEast();
  var sw = b.getSouthWest();
  var data = {
    desiredNumItems: isFaction ? CHAT_FACTION_ITEMS : CHAT_PUBLIC_ITEMS ,
    minLatE6: Math.round(sw.lat*1E6),
    minLngE6: Math.round(sw.lng*1E6),
    maxLatE6: Math.round(ne.lat*1E6),
    maxLngE6: Math.round(ne.lng*1E6),
    minTimestampMs: -1,
    maxTimestampMs: -1,
    factionOnly: isFaction
  }

  if(getOlderMsgs) {
    // ask for older chat when scrolling up
    data = $.extend(data, {maxTimestampMs: chat.getOldestTimestamp(isFaction)});
  } else {
    // ask for newer chat
    var min = chat.getNewestTimestamp(isFaction);
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
// faction
//

window.chat._requestFactionRunning = false;
window.chat.requestFaction = function(getOlderMsgs, isRetry) {
  if(chat._requestFactionRunning && !isRetry) return;
  if(isIdle()) return renderUpdateStatus();
  chat._requestFactionRunning = true;

  var d = chat.genPostData(true, getOlderMsgs);
  var r = window.postAjax(
    'getPaginatedPlextsV2',
    d,
    chat.handleFaction,
    isRetry
      ? function() { window.chat._requestFactionRunning = false; }
      : function() { window.chat.requestFaction(getOlderMsgs, true) }
  );

  requests.add(r);
}


window.chat._factionData = {};
window.chat.handleFaction = function(data, textStatus, jqXHR) {
  chat._requestFactionRunning = false;

  if(!data || !data.result) {
    window.failedRequestCount++;
    return console.warn('faction chat error. Waiting for next auto-refresh.');
  }

  if(data.result.length === 0) return;

  var old = chat.getOldestTimestamp(true);
  chat.writeDataToHash(data, chat._factionData, false);
  var oldMsgsWereAdded = old !== chat.getOldestTimestamp(true);

  runHooks('factionChatDataAvailable', {raw: data, processed: chat._factionData});

  window.chat.renderFaction(oldMsgsWereAdded);

  if(data.result.length >= CHAT_FACTION_ITEMS) chat.needMoreMessages();
}

window.chat.renderFaction = function(oldMsgsWereAdded) {
  chat.renderData(chat._factionData, 'chatfaction', oldMsgsWereAdded);
}


//
// public
//

window.chat._requestPublicRunning = false;
window.chat.requestPublic = function(getOlderMsgs, isRetry) {
  if(chat._requestPublicRunning && !isRetry) return;
  if(isIdle()) return renderUpdateStatus();
  chat._requestPublicRunning = true;

  var d = chat.genPostData(false, getOlderMsgs);
  var r = window.postAjax(
    'getPaginatedPlextsV2',
    d,
    chat.handlePublic,
    isRetry
      ? function() { window.chat._requestPublicRunning = false; }
      : function() { window.chat.requestPublic(getOlderMsgs, true) }
  );

  requests.add(r);
}

window.chat._publicData = {};
window.chat.handlePublic = function(data, textStatus, jqXHR) {
  chat._requestPublicRunning = false;

  if(!data || !data.result) {
    window.failedRequestCount++;
    return console.warn('public chat error. Waiting for next auto-refresh.');
  }

  if(data.result.length === 0) return;

  var old = chat.getOldestTimestamp(false);
  chat.writeDataToHash(data, chat._publicData, true);
  var oldMsgsWereAdded = old !== chat.getOldestTimestamp(false);

  runHooks('publicChatDataAvailable', {raw: data, processed: chat._publicData});

  switch(chat.getActive()) {
    case 'public': window.chat.renderPublic(oldMsgsWereAdded); break;
    case 'compact': window.chat.renderCompact(oldMsgsWereAdded); break;
    case 'full': window.chat.renderFull(oldMsgsWereAdded); break;
  }

  if(data.result.length >= CHAT_PUBLIC_ITEMS) chat.needMoreMessages();
}

window.chat.renderPublic = function(oldMsgsWereAdded) {
  // only keep player data
  var data = $.map(chat._publicData, function(entry) {
    if(!entry[1]) return [entry];
  });
  chat.renderData(data, 'chatpublic', oldMsgsWereAdded);
}

window.chat.renderCompact = function(oldMsgsWereAdded) {
  var data = {};
  $.each(chat._publicData, function(guid, entry) {
    // skip player msgs
    if(!entry[1]) return true;
    var pguid = entry[3];
    // ignore if player has newer data
    if(data[pguid] && data[pguid][0] > entry[0]) return true;
    data[pguid] = entry;
  });
  // data keys are now player guids instead of message guids. However,
  // it is all the same to renderData.
  chat.renderData(data, 'chatcompact', oldMsgsWereAdded);
}

window.chat.renderFull = function(oldMsgsWereAdded) {
  // only keep automatically generated data
  var data = $.map(chat._publicData, function(entry) {
    if(entry[1]) return [entry];
  });
  chat.renderData(data, 'chatfull', oldMsgsWereAdded);
}


//
// common
//

window.chat.writeDataToHash = function(newData, storageHash, skipSecureMsgs) {
  $.each(newData.result, function(ind, json) {
    // avoid duplicates
    if(json[0] in storageHash) return true;

    var skipThisEntry = false;

    var time = json[1];
    var team = json[2].plext.team === 'ALIENS' ? TEAM_ENL : TEAM_RES;
    var auto = json[2].plext.plextType !== 'PLAYER_GENERATED';
    var msg = '', nick = '', pguid;
    $.each(json[2].plext.markup, function(ind, markup) {
      switch(markup[0]) {
      case 'SENDER': // user generated messages
        nick = markup[1].plain.slice(0, -2); // cut “: ” at end
        pguid = markup[1].guid;
        break;

      case 'PLAYER': // automatically generated messages
        pguid = markup[1].guid;
        nick = markup[1].plain;
        team = markup[1].team === 'ALIENS' ? TEAM_ENL : TEAM_RES;
        if(ind > 0) msg += nick; // don’t repeat nick directly
        break;

      case 'TEXT':
        var tmp = $('<div/>').text(markup[1].plain).html().autoLink();
        msg += tmp.replace(window.PLAYER['nickMatcher'], '<em>$1</em>');
        break;

      case 'PORTAL':
        var latlng = [markup[1].latE6/1E6, markup[1].lngE6/1E6];
        var perma = 'https://ingress.com/intel?latE6='+markup[1].latE6+'&lngE6='+markup[1].lngE6+'&z=17&pguid='+markup[1].guid;
        var js = 'window.zoomToAndShowPortal(\''+markup[1].guid+'\', ['+latlng[0]+', '+latlng[1]+']);return false';

        msg += '<a onclick="'+js+'"'
          + ' title="'+markup[1].address+'"'
          + ' href="'+perma+'" class="help">'
          + window.chat.getChatPortalName(markup[1])
          + '</a>';
        break;

      case 'SECURE':
        if(skipSecureMsgs) {
          skipThisEntry = true;
          return false; // breaks $.each
        }
      }
    });
    if(skipThisEntry) return true;

    // format: timestamp, autogenerated, HTML message, player guid
    storageHash[json[0]] = [json[1], auto, chat.renderMsg(msg, nick, time, team), pguid];

    window.setPlayerName(pguid, nick); // free nick name resolves
  });
}

// Override portal names that are used over and over, such as 'US Post Office'
window.chat.getChatPortalName = function(markup) {
  var name = markup.name;
  if(name === 'US Post Office') {
    var address = markup.address.split(',');
    name = 'USPS: ' + address[0];
  }
  return name;
}

// renders data from the data-hash to the element defined by the given
// ID. Set 3rd argument to true if it is likely that old data has been
// added. Latter is only required for scrolling.
window.chat.renderData = function(data, element, likelyWereOldMsgs) {
  var elm = $('#'+element);
  if(elm.is(':hidden')) return;

  // discard guids and sort old to new
  var vals = $.map(data, function(v, k) { return [v]; });
  vals = vals.sort(function(a, b) { return a[0]-b[0]; });

  // render to string with date separators inserted
  var msgs = '';
  var prevTime = null;
  $.each(vals, function(ind, msg) {
    var nextTime = new Date(msg[0]).toLocaleDateString();
    if(prevTime && prevTime !== nextTime)
      msgs += chat.renderDivider(nextTime);
    msgs += msg[2];
    prevTime = nextTime;
  });

  var scrollBefore = scrollBottom(elm);
  elm.html('<table>' + msgs + '</table>');
  chat.keepScrollPosition(elm, scrollBefore, likelyWereOldMsgs);
}


window.chat.renderDivider = function(text) {
  var d = ' ──────────────────────────────────────────────────────────────────────────';
  return '<tr><td colspan="3" style="padding-top:3px"><summary>─ ' + text + d + '</summary></td></tr>';
}


window.chat.renderMsg = function(msg, nick, time, team) {
  var ta = unixTimeToHHmm(time);
  var tb = unixTimeToString(time, true);
  // help cursor via “#chat time”
  var t = '<time title="'+tb+'" data-timestamp="'+time+'">'+ta+'</time>';
  var s = 'style="color:'+COLORS[team]+'"';
  var title = nick.length >= 8 ? 'title="'+nick+'" class="help"' : '';
  var i = ['<span class="invisep">&lt;</span>', '<span class="invisep">&gt;</span>'];
  return '<tr><td>'+t+'</td><td>'+i[0]+'<mark class="nickname" '+s+'>'+nick+'</mark>'+i[1]+'</td><td>'+msg+'</td></tr>';
}



window.chat.getActive = function() {
  return $('#chatcontrols .active').text();
}


window.chat.toggle = function() {
  var c = $('#chat, #chatcontrols');
  if(c.hasClass('expand')) {
    $('#chatcontrols a:first').html('<span class="toggle expand"></span>');
    c.removeClass('expand');
    var div = $('#chat > div:visible');
    div.data('ignoreNextScroll', true);
    div.scrollTop(99999999); // scroll to bottom
    $('.leaflet-control').css('margin-left', '13px');
  } else {
    $('#chatcontrols a:first').html('<span class="toggle shrink"></span>');
    c.addClass('expand');
    $('.leaflet-control').css('margin-left', '720px');
    chat.needMoreMessages();
  }
}


window.chat.request = function() {
  console.log('refreshing chat');
  chat.requestFaction(false);
  chat.requestPublic(false);
}


// checks if there are enough messages in the selected chat tab and
// loads more if not.
window.chat.needMoreMessages = function() {
  var activeTab = chat.getActive();
  if(activeTab === 'debug') return;

  var activeChat = $('#chat > :visible');
  if(activeChat.length === 0) return;

  var hasScrollbar = scrollBottom(activeChat) !== 0 || activeChat.scrollTop() !== 0;
  var nearTop = activeChat.scrollTop() <= CHAT_REQUEST_SCROLL_TOP;
  if(hasScrollbar && !nearTop) return;

  console.log('No scrollbar or near top in active chat. Requesting more data.');

  if(activeTab === 'faction')
    chat.requestFaction(true);
  else
    chat.requestPublic(true);
}


window.chat.chooser = function(event) {
  var t = $(event.target);
  var tt = t.text();

  var mark = $('#chatinput mark');
  var input = $('#chatinput input');

  $('#chatcontrols .active').removeClass('active');
  t.addClass('active');

  $('#chat > div').hide();

  var elm;

  switch(tt) {
    case 'faction':
      input.css('color', '');
      mark.css('color', '');
      mark.text('tell faction:');
      break;

    case 'public':
      input.css('cssText', 'color: red !important');
      mark.css('cssText', 'color: red !important');
      mark.text('broadcast:');
      break;

    case 'compact':
    case 'full':
      mark.css('cssText', 'color: #bbb !important');
      input.css('cssText', 'color: #bbb !important');
      mark.text('tell Jarvis:');
      break;

    default:
      throw('chat.chooser was asked to handle unknown button: ' + tt);
  }

  var elm = $('#chat' + tt);
  elm.show();
  eval('chat.render' + tt.capitalize() + '(false);');
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
  $('#chatcontrols a').each(function(ind, elm) {
    if($.inArray($(elm).text(), ['full', 'compact', 'public', 'faction']) !== -1)
      $(elm).click(window.chat.chooser);
  });


  $('#chatinput').click(function() {
    $('#chatinput input').focus();
  });

  window.chat.setupTime();
  window.chat.setupPosting();

  $('#chatfaction').scroll(function() {
    var t = $(this);
    if(t.data('ignoreNextScroll')) return t.data('ignoreNextScroll', false);
    if(t.scrollTop() < CHAT_REQUEST_SCROLL_TOP) chat.requestFaction(true);
    if(scrollBottom(t) === 0) chat.requestFaction(false);
  });

  $('#chatpublic, #chatfull, #chatcompact').scroll(function() {
    var t = $(this);
    if(t.data('ignoreNextScroll')) return t.data('ignoreNextScroll', false);
    if(t.scrollTop() < CHAT_REQUEST_SCROLL_TOP) chat.requestPublic(true);
    if(scrollBottom(t) === 0) chat.requestPublic(false);
  });

  chat.request();
  window.addResumeFunction(chat.request);
  window.requests.addRefreshFunction(chat.request);

  var cls = PLAYER.team === 'ALIENS' ? 'enl' : 'res';
  $('#chatinput mark').addClass(cls)
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
  $('#chatinput input').keydown(function(event) {
    try {
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
    event.preventDefault();
    chat.postMsg();
  });
}


window.chat.postMsg = function() {
  var c = chat.getActive();
  if(c === 'full' || c === 'compact')
    return alert('Jarvis: A strange game. The only winning move is not to play. How about a nice game of chess?');

  var msg = $.trim($('#chatinput input').val());
  if(!msg || msg === '') return;

  if(c === 'debug') return new Function (msg)();

  var publik = c === 'public';
  var latlng = map.getCenter();

  var data = {message: msg,
              latE6: Math.round(latlng.lat*1E6),
              lngE6: Math.round(latlng.lng*1E6),
              factionOnly: !publik};

  var errMsg = 'Your message could not be delivered. You can copy&' +
               'paste it here and try again if you want:\n\n' + msg;

  window.postAjax('sendPlext', data,
    function(response) {
      if(response.error) alert(errMsg);
      if(publik) chat.requestPublic(false); else chat.requestFaction(false); },
    function() {
      alert(errMsg);
    }
  );

  $('#chatinput input').val('');
}
