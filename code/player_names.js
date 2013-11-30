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
