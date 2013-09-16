// PLAYER NAMES //////////////////////////////////////////////////////
// Player names are cached in local storage forever. There is no GUI
// element from within the total conversion to clean them, but you
// can run localStorage.clean() to reset it.


// retrieves player name by GUID. If the name is not yet available, it
// will be added to a global list of GUIDs that need to be resolved.
// The resolve method is not called automatically.
window.getPlayerName = function(guid) {
  if(localStorage[guid]) return localStorage[guid];
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

  var guid = null;
  $.each(Object.keys(localStorage), function(ind,key) {
    if(playerName === localStorage[key]) {
      guid = key;
      return false;  //break from $.each
    }
  });

  window._playerNameToGuidCache[playerName] = guid;
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
    if(dat.result) {
      $.each(dat.result, function(ind, player) {
        window.setPlayerName(player.guid, player.nickname);
        // remove from array
        window.playersInResolving.splice(window.playersInResolving.indexOf(player.guid), 1);
      });
    } else {
      //no 'result' - a successful http request, but the returned result was an error of some kind
      console.warn('getplayers problem - no result in response: '+dat);

      //likely to be some kind of 'bad request' (e.g. too many names at once, or otherwise badly formatted data.
      //therefore, not a good idea to automatically retry by adding back to the playersToResolve list
    }

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
  if(uncertain && guid in localStorage) return;

  if($.trim(('' + nick)).slice(0, 5) === '{"L":' && !window.alertFor37WasShown) {
    window.alertFor37WasShown = true;
    alert('You have run into bug #37. Please help me solve it!\nCopy and paste this text and post it here:\nhttps://github.com/breunigs/ingress-intel-total-conversion/issues/37\nIf copy & pasting doesn’t work, make a screenshot instead.\n\n\n' + window.debug.printStackTrace() + '\n\n\n' + JSON.stringify(nick));
  }
  localStorage[guid] = nick;
}


window.loadPlayerNamesForPortal = function(portal_details) {
  if(map.getZoom() < PRECACHE_PLAYER_NAMES_ZOOM) return;
  var e = portal_details;

  if(e.captured && e.captured.capturingPlayerId)
    getPlayerName(e.captured.capturingPlayerId);

  if(!e.resonatorArray || !e.resonatorArray.resonators) return;

  $.each(e.resonatorArray.resonators, function(ind, reso) {
    if(reso) getPlayerName(reso.ownerGuid);
  });
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
