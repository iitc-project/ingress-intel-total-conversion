// ==UserScript==
// @id             iitc-plugin-guess-player-levels@breunigs
// @name           IITC plugin: guess player level
// @category       Info
// @version        0.5.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Tries to determine player levels from the data available in the current view
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.guessPlayerLevels = function() {};

// we prepend a hash sign (#) in front of the player name in storage in order to prevent accessing a pre-defined property
// (like constructor, __defineGetter__, etc.

window.plugin.guessPlayerLevels.setupCallback = function() {
  $('#toolbox').append(' <a onclick="window.plugin.guessPlayerLevels.guess()" title="Show player level guesses based on resonator placement in displayed portals">Guess player levels</a>');
  addHook('portalDetailLoaded', window.plugin.guessPlayerLevels.extractPortalData);
  addHook('publicChatDataAvailable', window.plugin.guessPlayerLevels.extractChatData);
}


// This function is intended to be called by other plugins
window.plugin.guessPlayerLevels.fetchLevelByPlayer = function(nick) {
  var cache = window.plugin.guessPlayerLevels._nameToLevelCache;

  if(cache['#' + nick] === undefined)
    cache = window.plugin.guessPlayerLevels._loadLevels();

  var details = cache['#' + nick];
  if(details === undefined)
    return 1;
  if(typeof details === 'number')
    return details;
  return details.guessed;
}

// This function is intended to be called by other plugins
window.plugin.guessPlayerLevels.fetchLevelDetailsByPlayer = function(nick) {
  var cache = window.plugin.guessPlayerLevels._nameToLevelCache;

  if(cache['#' + nick] === undefined)
    cache = window.plugin.guessPlayerLevels._loadLevels();

  var details = cache['#' + nick];
  if(details === undefined)
    return {min: 1, guessed: 1};
  if(typeof details === 'number')
    return {min: 1, guessed: details};
  return details;
}

window.plugin.guessPlayerLevels._nameToLevelCache = {};
window.plugin.guessPlayerLevels._localStorageLastUpdate = 0;

window.plugin.guessPlayerLevels._loadLevels = function() {
  // no use in reading localStorage repeatedly
  if(window.plugin.guessPlayerLevels._localStorageLastUpdate < Date.now() - 10*1000) {
    try {
      var cache = JSON.parse(localStorage['plugin-guess-player-levels'])
      window.plugin.guessPlayerLevels._nameToLevelCache = cache;
      window.plugin.guessPlayerLevels._localStorageLastUpdate = Date.now();
    } catch(e) {
    }
  }

  return window.plugin.guessPlayerLevels._nameToLevelCache;
}

window.plugin.guessPlayerLevels.setLevelTitle = function(dom) {
  // expects dom node with nick in its child text node

  var el = $(dom);
  var nick = el.text();

  var details = window.plugin.guessPlayerLevels.fetchLevelDetailsByPlayer(nick);

  var text;
  if(details.min == 8)
    text = 'Player level: 8';
  else {
    text = 'Min player level: ' + details.min;
    if(details.min != details.guessed)
      text += '\nGuessed player level: ' + details.guessed;
  }
  window.setupTooltips(el);

  /*
  This code looks hacky but since we are a little late within the mouseenter so
  we need to improvise a little. The open method doesn't open the tooltip directly.
  It starts the whole opening procedure (including the timeout etc) and is normally
  started by the mousemove event of the enhanced element.
  */
  el.addClass('help') // Add the "Help Mouse Cursor"
    .attr('title', text) // Set the title for the jquery tooltip
    .tooltip('open') // Start the "open" method
    .attr('title', null);  // And remove the title to prevent the browsers tooltip
}

window.plugin.guessPlayerLevels.setupChatNickHelper = function() {
  $(document).on('mouseenter', '.nickname, .pl_nudge_player', function() {
    window.plugin.guessPlayerLevels.setLevelTitle(this);
  });
}

window.plugin.guessPlayerLevels.extractPortalData = function(data) {
  if(!data.success) return;

  var r = data.details.resonatorArray.resonators;

  //due to the Jarvis Virus/ADA Refactor it's possible for a player to own resonators on a portal
  //at a higher level than the player themselves. It is not possible to detect for sure when this
  //has happened, but in many cases it will result in an impossible deployment arrangement
  //(over 1 L8/7 res, over 2 L6/5 res, etc). if we detect this case, ignore all resonators owned
  //by that player on the portal

// TODO? go further, and just ignore all resonators owned by the portal owner?
// or; have a 'guessed' level and a 'certain' level. 'certain' comes from res from non-owner, and COMM deploy
// while 'guessed' comes from resonators of the portal owner

  var perPlayerResMaxLevel = {};
  var perPlayerResMaxLevelCount = {};

  $.each(r, function(ind, reso) {
    if(!reso) return true;

    if(!perPlayerResMaxLevel[reso.ownerGuid] || reso.level > perPlayerResMaxLevel[reso.ownerGuid]) {
      perPlayerResMaxLevel[reso.ownerGuid] = reso.level;
      perPlayerResMaxLevelCount[reso.ownerGuid] = 0;
    }
    if (reso.level == perPlayerResMaxLevel[reso.ownerGuid]) perPlayerResMaxLevelCount[reso.ownerGuid]++;
  });

  $.each(perPlayerResMaxLevel, function(guid, level) {
    if (perPlayerResMaxLevelCount[guid] <= window.MAX_RESO_PER_PLAYER[level]) {
      window.plugin.guessPlayerLevels.savePlayerLevel(guid, level);
    }
  });
}

window.plugin.guessPlayerLevels.extractChatData = function(data) {
	data.raw.result.forEach(function(msg) {
		var plext = msg[2].plext;
		if(plext.plextType == 'SYSTEM_BROADCAST'
		&& plext.markup.length==5
		&& plext.markup[0][0] == 'PLAYER'
		&& plext.markup[1][0] == 'TEXT'
		&& plext.markup[1][1].plain == ' deployed an '
		&& plext.markup[2][0] == 'TEXT'
		&& plext.markup[2][0] == 'TEXT'
		&& plext.markup[3][0] == 'TEXT'
		&& plext.markup[3][1].plain == ' Resonator on ') {
			var nick = plext.markup[0][1].plain;
			var lvl = parseInt(plext.markup[2][1].plain.substr(1));
			window.plugin.guessPlayerLevels.savePlayerLevel(nick, lvl, true);
		}
	});
};

window.plugin.guessPlayerLevels.savePlayerLevel = function(nick, level, safe) {
  var cache = window.plugin.guessPlayerLevels._loadLevels();

  var details = cache['#' + nick];
  if(details === undefined)
    details = {min: 1, guessed: 1};
  if(typeof details === 'number')
    details = {min: 1, guessed: details};

  if(safe) {
    if(details.min >= level)
      return;

    details.min = level;
    if(details.guessed < details.min)
      details.guessed = details.min;
  } else {
    if(details.guessed >= level)
      return;

    details.guessed = level;
  }

  window.plugin.guessPlayerLevels._nameToLevelCache['#' + nick] = details;

  // to minimize accesses to localStorage, writing is delayed a bit

  if(window.plugin.guessPlayerLevels._writeTimeout)
    clearTimeout(window.plugin.guessPlayerLevels._writeTimeout);

  window.plugin.guessPlayerLevels._writeTimeout = setTimeout(function() {
    localStorage['plugin-guess-player-levels'] = JSON.stringify(window.plugin.guessPlayerLevels._nameToLevelCache);
  }, 500);
}

window.plugin.guessPlayerLevels.guess = function() {
  var playersRes = {};
  var playersEnl = {};
  $.each(window.portals, function(guid,p) {
    var details = portalDetail.get(guid);
    if(details) {
      var r = details.resonatorArray.resonators;
      $.each(r, function(ind, reso) {
        if(!reso) return true;
        var nick = reso.ownerGuid;
        if(isSystemPlayer(nick)) return true;

        var lvl = window.plugin.guessPlayerLevels.fetchLevelDetailsByPlayer(nick).min;
        if(!lvl) return true;

        if(getTeam(details) === TEAM_ENL)
          playersEnl[nick] = lvl;
        else
          playersRes[nick] = lvl;
      });

      if(details.captured) {
        var nick = details.captured.capturingPlayerId
        if(isSystemPlayer(nick)) return true;
        var lvl = window.plugin.guessPlayerLevels.fetchLevelDetailsByPlayer(nick).min;
        if(!lvl) return true;

        if(getTeam(details) === TEAM_ENL)
          playersEnl[nick] = lvl;
        else
          playersRes[nick] = lvl;
      }
    }
  });

  var s = 'Players have at least the following level:\n\n';
  s += 'Resistance:\t&nbsp;&nbsp;&nbsp;\tEnlightened:\t\n';

  var namesR = plugin.guessPlayerLevels.sort(playersRes);
  var namesE = plugin.guessPlayerLevels.sort(playersEnl);
  var totallvlR = 0;
  var totallvlE = 0;
  var max = Math.max(namesR.length, namesE.length);

  function makeRow(nick, lvl, team) {
    if(!nick)
      return '\t';

    var color = COLORS[team];
    if (nick === window.PLAYER.nickname) color = '#fd6'; //highlight the player's name in a unique colour (similar to @player mentions from others in the chat text itself)

    return '<mark class="nickname" style="color:'+color+'">'+nick+'</mark>\t' + lvl;
  }

  var nick, lvl, lineE, lineR;
  for(var i = 0; i < max; i++) {
    nick = namesR[i];
    lvl = playersRes[nick];
    lineR = makeRow(nick, lvl, TEAM_RES);
    if(!isNaN(parseInt(lvl)))
      totallvlR += parseInt(lvl);

    nick = namesE[i];
    lvl = playersEnl[nick];
    lineE = makeRow(nick, lvl, TEAM_ENL);
    if(!isNaN(parseInt(lvl)))
      totallvlE += parseInt(lvl);

    s += '\n'+lineR + '\t' + lineE + '\n';
  }
  s += '\nTotal level :\t'+totallvlR+'\tTotal level :\t'+totallvlE;
  s += '\nTotal player:\t'+namesR.length+'\tTotal player:\t'+namesE.length;
  var averageR = 0, averageE = 0;
  if (namesR.length > 0)  averageR = (totallvlR/namesR.length);
  if (namesE.length > 0)  averageE = (totallvlE/namesE.length);
  s += '\nAverage level:\t'+averageR.toFixed(2)+'\tAverage level:\t'+averageE.toFixed(2);
  s += '\n\nOnly players from recently viewed portal details are listed.'

  dialog({
    text: s,
    title: 'Player levels: R' + averageR.toFixed(2) + ', E' + averageE.toFixed(2),
    id: 'guess-player-levels',
    width: 350,
    buttons: {
      'RESET GUESSES': function() {
        // clear all guessed levels from local storage
        localStorage.removeItem('plugin-guess-player-levels')
        window.plugin.guessPlayerLevels._nameToLevelCache = {}
        // now force all portals through the callback manually
        $.each(window.portals, function(guid,p) {
          var details = portalDetail.get(guid);
          if(details)
            window.plugin.guessPlayerLevels.extractPortalData({details:details, success:true});
        });
        // and re-open the dialog (on a minimal timeout - so it's not closed while processing this callback)
        setTimeout(window.plugin.guessPlayerLevels.guess,1);
      },
    }
  });
}

window.plugin.guessPlayerLevels.sort = function(playerHash) {
  return Object.keys(playerHash).sort(function(a, b) {
    if(playerHash[a] < playerHash[b]) return 1;
    if(playerHash[a] > playerHash[b]) return -1;

    if (a.toLowerCase() < b.toLowerCase()) return -1;
    if (a.toLowerCase() > b.toLowerCase()) return 1;
    return 0;
  });
}


var setup =  function() {
  // we used to store level guesses as one localStorage key per player, named 'level-PLAYER_GUID'
  // they're now stored in a single storage key - 'plugin-guess-player-levels' - so clear these old entries
  $.each(Object.keys(localStorage), function(ind,key) {// legacy code - should be removed in the future
    if(key.lastIndexOf('level-',0)===0) {
      localStorage.removeItem(key);
    }
  });

  window.plugin.guessPlayerLevels.setupCallback();
  window.plugin.guessPlayerLevels.setupChatNickHelper();
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
