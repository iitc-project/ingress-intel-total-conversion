// PLAYER NAMES //////////////////////////////////////////////////////
// Player names are cached in sessionStorage. There is no GUI
// element from within the total conversion to clean them, but you
// can run sessionStorage.clean() to reset it.


window.setupPlayerNameCache = function() {
  // IITC used to store player names in localStorage rather than sessionStorage. lets clear out any cached
  // names from session storage
  var matchPlayerGuid = new RegExp ('^[0-9a-f]{32}\\.c$');

  $.each(Object.keys(localStorage), function(ind,key) {
    if ( matchPlayerGuid.test(key) ) {
      // copy from localStorage to sessionStorage if not already there
      if (!sessionStorage[key]) sessionStorage[key] = localStorage[key];
      // then clear from localStorage
      localStorage.removeItem(key);
    }
  });

}


// retrieves player name by GUID. If the name is not yet available, it
// will be added to a global list of GUIDs that need to be resolved.
// The resolve method is not called automatically.
window.getPlayerName = function(guid) {
  if(sessionStorage[guid]) return sessionStorage[guid];
  // only add to queue if it isn’t already
  if(playersToResolve.indexOf(guid) === -1 && playersInResolving.indexOf(guid) === -1) {
    playersToResolve.push(guid);
  }
  return '{'+guid.slice(0, 12)+'}';
}

window._playerNameToGuidCache = {};

window.playerNameToGuid = function(playerName) {
  var cachedGuid = window._playerNameToGuidCache[playerName];
  if (cachedGuid !== undefined) return cachedGuid;

  // IITC needs our own player GUID, from a lookup by name. so we retrieve this from localstorage (if available)
  if (playerName == PLAYER.nickname) {
    cachedGuid = localStorage['PLAYER-'+PLAYER.nickname];
    if (cachedGuid !== undefined) return cachedGuid;
  }

  var guid = null;
  $.each(Object.keys(sessionStorage), function(ind,key) {
    if(playerName === sessionStorage[key]) {
      guid = key;
      window._playerNameToGuidCache[playerName] = guid;
      return false;  //break from $.each
    }
  });

  return guid;
}

// resolves all player GUIDs that have been added to the list. Reruns
// renderPortalDetails when finished, so that then-unresolved names
// get replaced by their correct versions.
window.resolvePlayerNames = function() {
  if(window.playersToResolve.length === 0) return;

  //limit per request. stock site is never more than 13 (8 res, 4 mods, owner)
  //testing shows 15 works and 20 fails
  var MAX_RESOLVE_PLAYERS_PER_REQUEST = 15;

  var p = window.playersToResolve.slice(0,MAX_RESOLVE_PLAYERS_PER_REQUEST);
  window.playersToResolve = playersToResolve.slice(MAX_RESOLVE_PLAYERS_PER_REQUEST);

  var d = {guids: p};
  window.playersInResolving = window.playersInResolving.concat(p);

  postAjax('getPlayersByGuids', d, function(dat) {
    var resolvedName = {};
    if(dat.result) {
      $.each(dat.result, function(ind, player) {
        window.setPlayerName(player.guid, player.nickname);
        resolvedName[player.guid] = player.nickname;
        // remove from array
        window.playersInResolving.splice(window.playersInResolving.indexOf(player.guid), 1);
      });
    } else {
      //no 'result' - a successful http request, but the returned result was an error of some kind
      console.warn('getplayers problem - no result in response: '+dat);

      //likely to be some kind of 'bad request' (e.g. too many names at once, or otherwise badly formatted data.
      //therefore, not a good idea to automatically retry by adding back to the playersToResolve list
    }

    // Run hook 'playerNameResolved' with the resolved player names
    window.runHooks('playerNameResolved', {names: resolvedName});

    //TODO: have an event triggered for this instead of hard-coded single function call
    if(window.selectedPortal)
      window.renderPortalDetails(window.selectedPortal);

    //if more to do, run again
    if(window.playersToResolve.length>0) resolvePlayerNames();
  },
  function() {
    // append failed resolves to the list again
    console.warn('resolving player guids failed: ' + p.join(', '));
    window.playersToResolve.concat(p);
  });
}


window.setPlayerName = function(guid, nick, uncertain) {
  // the 'uncertain' flag is set when we're scrolling back through chat. it's possible in this case
  // to come across a message from before a name change. these should be ignored if existing cache entries exist
  if(uncertain && guid in sessionStorage) return;

  if($.trim(('' + nick)).slice(0, 5) === '{"L":' && !window.alertFor37WasShown) {
    window.alertFor37WasShown = true;
    alert('You have run into bug #37. Please help me solve it!\nCopy and paste this text and post it here:\nhttps://github.com/breunigs/ingress-intel-total-conversion/issues/37\nIf copy & pasting doesn’t work, make a screenshot instead.\n\n\n' + window.debug.printStackTrace() + '\n\n\n' + JSON.stringify(nick));
  }
  sessionStorage[guid] = nick;

  // IITC needs our own player ID early on in startup. the only way we can find this is by something else
  // doing a guid->name lookup for our own name. as this doesn't always happen - and likely won't happen when needed
  // we'll store our own name->guid lookup in localStorage
  if (nick == PLAYER.nickname) {
    localStorage['PLAYER-'+PLAYER.nickname] = guid;
    PLAYER.guid = guid;  // set it in PLAYER in case it wasn't already done
  }
}




// test to see if a specific player GUID is a special system account (e.g. __JARVIS__, __ADA__) that shouldn't
// be listed as a player
window.isSystemPlayer = function(guid) {

  switch (guid) {
    case '00000000000000000000000000000001.c':
    case '00000000000000000000000000000002.c':
      return true;

    default:
      return false;
  }
}
