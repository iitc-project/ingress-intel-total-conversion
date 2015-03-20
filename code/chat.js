window.chat = function() {};

//WORK IN PROGRESS - NOT YET USED!!
window.chat.commTabs = [
// channel: the COMM channel ('tab' parameter in server requests)
// name: visible name
// inputPrompt: string for the input prompt
// inputColor: (optional) color for input
// sendMessage: (optional) function to send the message (to override the default of sendPlext)
// globalBounds: (optional) if true, always use global latLng bounds
  {channel:'all', name:'All', inputPrompt: 'broadcast:', inputColor:'#f66'},
  {channel:'faction', name:'Aaction', inputPrompt: 'tell faction:'},
  {channel:'alerts', name:'Alerts', inputPrompt: 'tell Jarvis:', inputColor: '#666', globalBounds: true, sendMessage: function() {
    alert("Jarvis: A strange game. The only winning move is not to play. How about a nice game of chess?\n(You can't chat to the 'alerts' channel!)");
  }},
];


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
  var atPresent = text.substring(posStart-1, posStart) === '@';
  newText += (atPresent ? '' : '@') + nick + ' ';
  newText += text.substring(curPos);
  el.val(newText);
}

//
// clear management
//


window.chat._oldBBox = null;
window.chat.genPostData = function(channel, storageHash, getOlderMsgs) {
  if (typeof channel !== 'string') throw ('API changed: isFaction flag now a channel string - all, faction, alerts');

  var b = clampLatLngBounds(map.getBounds());

  // set a current bounding box if none set so far
  if (!chat._oldBBox) chat._oldBBox = b;

  // to avoid unnecessary chat refreshes, a small difference compared to the previous bounding box
  // is not considered different
  var CHAT_BOUNDINGBOX_SAME_FACTOR = 0.1;
  // if the old and new box contain each other, after expanding by the factor, don't reset chat
  if (!(b.pad(CHAT_BOUNDINGBOX_SAME_FACTOR).contains(chat._oldBBox) && chat._oldBBox.pad(CHAT_BOUNDINGBOX_SAME_FACTOR).contains(b))) {
    console.log('Bounding Box changed, chat will be cleared (old: '+chat._oldBBox.toBBoxString()+'; new: '+b.toBBoxString()+')');

    $('#chat > div').data('needsClearing', true);

    // need to reset these flags now because clearing will only occur
    // after the request is finished – i.e. there would be one almost
    // useless request.
    chat._faction.data = {};
    chat._faction.oldestTimestamp = -1;
    chat._faction.newestTimestamp = -1;

    chat._public.data = {};
    chat._public.oldestTimestamp = -1;
    chat._public.newestTimestamp = -1;

    chat._alerts.data = {};
    chat._alerts.oldestTimestamp = -1;
    chat._alerts.newestTimestamp = -1;

    chat._oldBBox = b;
  }

  var ne = b.getNorthEast();
  var sw = b.getSouthWest();
  var data = {
//    desiredNumItems: isFaction ? CHAT_FACTION_ITEMS : CHAT_PUBLIC_ITEMS ,
    minLatE6: Math.round(sw.lat*1E6),
    minLngE6: Math.round(sw.lng*1E6),
    maxLatE6: Math.round(ne.lat*1E6),
    maxLngE6: Math.round(ne.lng*1E6),
    minTimestampMs: -1,
    maxTimestampMs: -1,
    tab: channel,
  }

  if(getOlderMsgs) {
    // ask for older chat when scrolling up
    data = $.extend(data, {maxTimestampMs: storageHash.oldestTimestamp});
  } else {
    // ask for newer chat
    var min = storageHash.newestTimestamp;
    // the initial request will have both timestamp values set to -1,
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
    // when requesting with an actual minimum timestamp, request oldest rather than newest first.
    // this matches the stock intel site, and ensures no gaps when continuing after an extended idle period
    if (min > -1) $.extend(data, {ascendingTimestampOrder: true});
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
  $("#chatcontrols a:contains('faction')").addClass('loading');

  var d = chat.genPostData('faction', chat._faction, getOlderMsgs);
  var r = window.postAjax(
    'getPlexts',
    d,
    function(data, textStatus, jqXHR) { chat.handleFaction(data, getOlderMsgs); },
    isRetry
      ? function() { window.chat._requestFactionRunning = false; }
      : function() { window.chat.requestFaction(getOlderMsgs, true) }
  );
}


window.chat._faction = {data:{}, oldestTimestamp:-1, newestTimestamp:-1};
window.chat.handleFaction = function(data, olderMsgs) {
  chat._requestFactionRunning = false;
  $("#chatcontrols a:contains('faction')").removeClass('loading');

  if(!data || !data.result) {
    window.failedRequestCount++;
    return console.warn('faction chat error. Waiting for next auto-refresh.');
  }

  if(data.result.length === 0) return;

  var old = chat._faction.oldestTimestamp;
  chat.writeDataToHash(data, chat._faction, false, olderMsgs);
  var oldMsgsWereAdded = old !== chat._faction.oldestTimestamp;

  runHooks('factionChatDataAvailable', {raw: data, result: data.result, processed: chat._faction.data});

  window.chat.renderFaction(oldMsgsWereAdded);
}

window.chat.renderFaction = function(oldMsgsWereAdded) {
  chat.renderData(chat._faction.data, 'chatfaction', oldMsgsWereAdded);
}


//
// all
//

window.chat._requestPublicRunning = false;
window.chat.requestPublic = function(getOlderMsgs, isRetry) {
  if(chat._requestPublicRunning && !isRetry) return;
  if(isIdle()) return renderUpdateStatus();
  chat._requestPublicRunning = true;
  $("#chatcontrols a:contains('all')").addClass('loading');

  var d = chat.genPostData('all', chat._public, getOlderMsgs);
  var r = window.postAjax(
    'getPlexts',
    d,
    function(data, textStatus, jqXHR) { chat.handlePublic(data, getOlderMsgs); },
    isRetry
      ? function() { window.chat._requestPublicRunning = false; }
      : function() { window.chat.requestPublic(getOlderMsgs, true) }
  );
}

window.chat._public = {data:{}, oldestTimestamp:-1, newestTimestamp:-1};
window.chat.handlePublic = function(data, olderMsgs) {
  chat._requestPublicRunning = false;
  $("#chatcontrols a:contains('all')").removeClass('loading');

  if(!data || !data.result) {
    window.failedRequestCount++;
    return console.warn('public chat error. Waiting for next auto-refresh.');
  }

  if(data.result.length === 0) return;

  var old = chat._public.oldestTimestamp;
  chat.writeDataToHash(data, chat._public, undefined, olderMsgs);   //NOTE: isPublic passed as undefined - this is the 'all' channel, so not really public or private
  var oldMsgsWereAdded = old !== chat._public.oldestTimestamp;

  runHooks('publicChatDataAvailable', {raw: data, result: data.result, processed: chat._public.data});

  window.chat.renderPublic(oldMsgsWereAdded);

}

window.chat.renderPublic = function(oldMsgsWereAdded) {
  chat.renderData(chat._public.data, 'chatall', oldMsgsWereAdded);
}


//
// alerts
//

window.chat._requestAlertsRunning = false;
window.chat.requestAlerts = function(getOlderMsgs, isRetry) {
  if(chat._requestAlertsRunning && !isRetry) return;
  if(isIdle()) return renderUpdateStatus();
  chat._requestAlertsRunning = true;
  $("#chatcontrols a:contains('alerts')").addClass('loading');

  var d = chat.genPostData('alerts', chat._alerts, getOlderMsgs);
  var r = window.postAjax(
    'getPlexts',
    d,
    function(data, textStatus, jqXHR) { chat.handleAlerts(data, getOlderMsgs); },
    isRetry
      ? function() { window.chat._requestAlertsRunning = false; }
      : function() { window.chat.requestAlerts(getOlderMsgs, true) }
  );
}


window.chat._alerts = {data:{}, oldestTimestamp:-1, newestTimestamp:-1};
window.chat.handleAlerts = function(data, olderMsgs) {
  chat._requestAlertsRunning = false;
  $("#chatcontrols a:contains('alerts')").removeClass('loading');

  if(!data || !data.result) {
    window.failedRequestCount++;
    return console.warn('alerts chat error. Waiting for next auto-refresh.');
  }

  if(data.result.length === 0) return;

  var old = chat._alerts.oldestTimestamp;
  chat.writeDataToHash(data, chat._alerts, undefined, olderMsgs); //NOTE: isPublic passed as undefined - it's nether public or private!
  var oldMsgsWereAdded = old !== chat._alerts.oldestTimestamp;

// no hoot for alerts - API change planned here...
//  runHooks('alertsChatDataAvailable', {raw: data, result: data.result, processed: chat._alerts.data});

  window.chat.renderAlerts(oldMsgsWereAdded);
}

window.chat.renderAlerts = function(oldMsgsWereAdded) {
  chat.renderData(chat._alerts.data, 'chatalerts', oldMsgsWereAdded);
}



//
// common
//

window.chat.nicknameClicked = function(event, nickname) {
  var hookData = { event: event, nickname: nickname };
  
  if (window.runHooks('nicknameClicked', hookData)) {
    window.chat.addNickname('@' + nickname);
  }

  event.preventDefault();
  event.stopPropagation();
  return false;
}

window.chat.writeDataToHash = function(newData, storageHash, isPublicChannel, isOlderMsgs) {
  $.each(newData.result, function(ind, json) {
    // avoid duplicates
    if(json[0] in storageHash.data) return true;

    var isSecureMessage = false;
    var msgToPlayer = false;

    var time = json[1];
    var team = json[2].plext.team === 'RESISTANCE' ? TEAM_RES : TEAM_ENL;
    var auto = json[2].plext.plextType !== 'PLAYER_GENERATED';
    var systemNarrowcast = json[2].plext.plextType === 'SYSTEM_NARROWCAST';

    //track oldest + newest timestamps
    if (storageHash.oldestTimestamp === -1 || storageHash.oldestTimestamp > time) storageHash.oldestTimestamp = time;
    if (storageHash.newestTimestamp === -1 || storageHash.newestTimestamp < time) storageHash.newestTimestamp = time;

    //remove "Your X on Y was destroyed by Z" from the faction channel
//    if (systemNarrowcast && !isPublicChannel) return true;

    var msg = '', nick = '';
    $.each(json[2].plext.markup, function(ind, markup) {
      switch(markup[0]) {
      case 'SENDER': // user generated messages
        nick = markup[1].plain.slice(0, -2); // cut “: ” at end
        break;

      case 'PLAYER': // automatically generated messages
        nick = markup[1].plain;
        team = markup[1].team === 'RESISTANCE' ? TEAM_RES : TEAM_ENL;
        if(ind > 0) msg += nick; // don’t repeat nick directly
        break;

      case 'TEXT':
        msg += $('<div/>').text(markup[1].plain).html().autoLink();
        break;

      case 'AT_PLAYER':
        var thisToPlayer = (markup[1].plain == ('@'+window.PLAYER.nickname));
        var spanClass = thisToPlayer ? "pl_nudge_me" : (markup[1].team + " pl_nudge_player");
        var atPlayerName = markup[1].plain.replace(/^@/, "");
        msg += $('<div/>').html($('<span/>')
                          .attr('class', spanClass)
                          .attr('onclick',"window.chat.nicknameClicked(event, '"+atPlayerName+"')")
                          .text(markup[1].plain)).html();
        msgToPlayer = msgToPlayer || thisToPlayer;
        break;

      case 'PORTAL':
        var latlng = [markup[1].latE6/1E6, markup[1].lngE6/1E6];
        var perma = '/intel?ll='+latlng[0]+','+latlng[1]+'&z=17&pll='+latlng[0]+','+latlng[1];
        var js = 'window.selectPortalByLatLng('+latlng[0]+', '+latlng[1]+');return false';

        msg += '<a onclick="'+js+'"'
          + ' title="'+markup[1].address+'"'
          + ' href="'+perma+'" class="help">'
          + window.chat.getChatPortalName(markup[1])
          + '</a>';
        break;

      case 'SECURE':
        //NOTE: we won't add the '[secure]' string here - it'll be handled below instead
        isSecureMessage = true;
        break;

      default:
        //handle unknown types by outputting the plain text version, marked with it's type
        msg += $('<div/>').text(markup[0]+':<'+markup[1].plain+'>').html();
        break;
      }
    });


//    //skip secure messages on the public channel
//    if (isPublicChannel && isSecureMessage) return true;

//    //skip public messages (e.g. @player mentions) on the secure channel
//    if ((!isPublicChannel) && (!isSecureMessage)) return true;


    //NOTE: these two are redundant with the above two tests in place - but things have changed...
    //from the server, private channel messages are flagged with a SECURE string '[secure] ', and appear in
    //both the public and private channels
    //we don't include this '[secure]' text above, as it's redundant in the faction-only channel
    //let's add it here though if we have a secure message in the public channel, or the reverse if a non-secure in the faction one
    if (!auto && !(isPublicChannel===false) && isSecureMessage) msg = '<span style="color: #f88; background-color: #500;">[faction]</span> ' + msg;
    //and, add the reverse - a 'public' marker to messages in the private channel
    if (!auto && !(isPublicChannel===true) && (!isSecureMessage)) msg = '<span style="color: #ff6; background-color: #550">[public]</span> ' + msg;


    // format: timestamp, autogenerated, HTML message
    storageHash.data[json[0]] = [json[1], auto, chat.renderMsg(msg, nick, time, team, msgToPlayer, systemNarrowcast), nick];

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
//TODO? stable sort, to preserve server message ordering? or sort by GUID if timestamps equal?
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


window.chat.renderMsg = function(msg, nick, time, team, msgToPlayer, systemNarrowcast) {
  var ta = unixTimeToHHmm(time);
  var tb = unixTimeToDateTimeString(time, true);
  //add <small> tags around the milliseconds
  tb = (tb.slice(0,19)+'<small class="milliseconds">'+tb.slice(19)+'</small>').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  // help cursor via “#chat time”
  var t = '<time title="'+tb+'" data-timestamp="'+time+'">'+ta+'</time>';
  if ( msgToPlayer )
  {
    t = '<div class="pl_nudge_date">' + t + '</div><div class="pl_nudge_pointy_spacer"></div>';
  }
  if (systemNarrowcast)
  {
    msg = '<div class="system_narrowcast">' + msg + '</div>';
  }
  var color = COLORS[team];
  if (nick === window.PLAYER.nickname) color = '#fd6';    //highlight things said/done by the player in a unique colour (similar to @player mentions from others in the chat text itself)
  var s = 'style="cursor:pointer; color:'+color+'"';
  var i = ['<span class="invisep">&lt;</span>', '<span class="invisep">&gt;</span>'];
  return '<tr><td>'+t+'</td><td>'+i[0]+'<mark class="nickname" ' + s + '>'+ nick+'</mark>'+i[1]+'</td><td>'+msg+'</td></tr>';
}

window.chat.addNickname= function(nick) {
  var c = document.getElementById("chattext");
  c.value = [c.value.trim(), nick].join(" ").trim() + " ";
  c.focus()
}




window.chat.getActive = function() {
  return $('#chatcontrols .active').text();
}

window.chat.tabToChannel = function(tab) {
  if (tab == 'faction') return 'faction';
  if (tab == 'alerts') return 'alerts';
  return 'all';
};



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


// called by plugins (or other things?) that need to monitor COMM data streams when the user is not viewing them
// instance: a unique string identifying the plugin requesting background COMM
// channel: either 'all', 'faction' or (soon) 'alerts' - others possible in the future
// flag: true for data wanted, false for not wanted
window.chat.backgroundChannelData = function(instance,channel,flag) {
  //first, store the state for this instance
  if (!window.chat.backgroundInstanceChannel) window.chat.backgroundInstanceChannel = {};
  if (!window.chat.backgroundInstanceChannel[instance]) window.chat.backgroundInstanceChannel[instance] = {};
  window.chat.backgroundInstanceChannel[instance][channel] = flag;

  //now, to simplify the request code, merge the flags for all instances into one
  // 1. clear existing overall flags
  window.chat.backgroundChannels = {};
  // 2. for each instance monitoring COMM...
  $.each(window.chat.backgroundInstanceChannel, function(instance,channels) {
    // 3. and for each channel monitored by this instance...
    $.each(window.chat.backgroundInstanceChannel[instance],function(channel,flag) {
      // 4. if it's monitored, set the channel flag
      if (flag) window.chat.backgroundChannels[channel] = true;
    });
  });

}


window.chat.request = function() {
  console.log('refreshing chat');
  var channel = chat.tabToChannel(chat.getActive());
  if (channel == 'faction' || (window.chat.backgroundChannels && window.chat.backgroundChannels['faction'])) {
    chat.requestFaction(false);
  }
  if (channel == 'all' || (window.chat.backgroundChannels && window.chat.backgroundChannels['all'])) {
    chat.requestPublic(false);
  }
  if (channel == 'alerts' || (window.chat.backgroundChannels && window.chat.backgroundChannels['alerts'])) {
    chat.requestAlerts(false);
  }
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
};


window.chat.chooseTab = function(tab) {
  if (tab != 'all' && tab != 'faction' && tab != 'alerts') {
    console.warn('chat tab "'+tab+'" requested - but only "all", "faction" and "alerts" are valid - assuming "all" wanted');
    tab = 'all';
  }

  var oldTab = chat.getActive();

  localStorage['iitc-chat-tab'] = tab;

  var mark = $('#chatinput mark');
  var input = $('#chatinput input');

  $('#chatcontrols .active').removeClass('active');
  $("#chatcontrols a:contains('" + tab + "')").addClass('active');

  if (tab != oldTab) startRefreshTimeout(0.1*1000); //only chat uses the refresh timer stuff, so a perfect way of forcing an early refresh after a tab change

  $('#chat > div').hide();

  var elm;

  switch(tab) {
    case 'faction':
      input.css('color', '');
      mark.css('color', '');
      mark.text('tell faction:');

      chat.renderFaction(false);
      break;

    case 'all':
      input.css('cssText', 'color: #f66 !important');
      mark.css('cssText', 'color: #f66 !important');
      mark.text('broadcast:');

      chat.renderPublic(false);
      break;

    case 'alerts':
      mark.css('cssText', 'color: #bbb !important');
      input.css('cssText', 'color: #bbb !important');
      mark.text('tell Jarvis:');

      chat.renderAlerts(false);
      break;

    default:
      throw('chat.chooser was asked to handle unknown button: ' + tt);
  }

  var elm = $('#chat' + tab);
  elm.show();

  if(elm.data('needsScrollTop')) {
    elm.data('ignoreNextScroll', true);
    elm.scrollTop(elm.data('needsScrollTop'));
    elm.data('needsScrollTop', null);
  }
}

window.chat.show = function(name) {
    window.isSmartphone()
        ? $('#updatestatus').hide()
        : $('#updatestatus').show();
    $('#chat, #chatinput').show();

    window.chat.chooseTab(name);
}

window.chat.chooser = function(event) {
  var t = $(event.target);
  var tab = t.text();
  window.chat.chooseTab(tab);
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
  if (localStorage['iitc-chat-tab']) {
    chat.chooseTab(localStorage['iitc-chat-tab']);
 }

  $('#chatcontrols, #chat, #chatinput').show();

  $('#chatcontrols a:first').click(window.chat.toggle);
  $('#chatcontrols a').each(function(ind, elm) {
    if($.inArray($(elm).text(), ['all', 'faction', 'alerts']) !== -1)
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

  $('#chatall').scroll(function() {
    var t = $(this);
    if(t.data('ignoreNextScroll')) return t.data('ignoreNextScroll', false);
    if(t.scrollTop() < CHAT_REQUEST_SCROLL_TOP) chat.requestPublic(true);
    if(scrollBottom(t) === 0) chat.requestPublic(false);
  });

  $('#chatalerts').scroll(function() {
    var t = $(this);
    if(t.data('ignoreNextScroll')) return t.data('ignoreNextScroll', false);
    if(t.scrollTop() < CHAT_REQUEST_SCROLL_TOP) chat.requestAlerts(true);
    if(scrollBottom(t) === 0) chat.requestAlerts(false);
  });

  window.requests.addRefreshFunction(chat.request);

  var cls = PLAYER.team === 'RESISTANCE' ? 'res' : 'enl';
  $('#chatinput mark').addClass(cls);

  $(document).on('click', '.nickname', function(event) {
    return window.chat.nicknameClicked(event, $(this).text());
  });
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
  if (!isSmartphone()) {
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
  }

  $('#chatinput').submit(function(event) {
    event.preventDefault();
    chat.postMsg();
  });
}


window.chat.postMsg = function() {
  var c = chat.getActive();
  if(c == 'alerts')
    return alert("Jarvis: A strange game. The only winning move is not to play. How about a nice game of chess?\n(You can't chat to the 'alerts' channel!)");

  var msg = $.trim($('#chatinput input').val());
  if(!msg || msg === '') return;

  if(c === 'debug') {
    var result;
    try {
      result = eval(msg);
    } catch(e) {
      if(e.stack) console.error(e.stack);
      throw e; // to trigger native error message
    }
    if(result !== undefined)
      console.log(result.toString());
    return result;
  }

  var latlng = map.getCenter();

  var data = {message: msg,
              latE6: Math.round(latlng.lat*1E6),
              lngE6: Math.round(latlng.lng*1E6),
              tab: c};

  var errMsg = 'Your message could not be delivered. You can copy&' +
               'paste it here and try again if you want:\n\n' + msg;

  window.postAjax('sendPlext', data,
    function(response) {
      if(response.error) alert(errMsg);
      startRefreshTimeout(0.1*1000); //only chat uses the refresh timer stuff, so a perfect way of forcing an early refresh after a send message
    },
    function() {
      alert(errMsg);
    }
  );

  $('#chatinput input').val('');
}
