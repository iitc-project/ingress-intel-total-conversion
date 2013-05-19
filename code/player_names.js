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
    console.log('resolving player guid=' + guid);
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
  var p = window.playersToResolve;
  var d = {guids: p};
  playersInResolving = window.playersInResolving.concat(p);
  playersToResolve = [];
  postAjax('getPlayersByGuids', d, function(dat) {
    $.each(dat.result, function(ind, player) {
      window.setPlayerName(player.guid, player.nickname);
      // remove from array
      window.playersInResolving.splice(window.playersInResolving.indexOf(player.guid), 1);
    });
    if(window.selectedPortal)
      window.renderPortalDetails(window.selectedPortal);
  },
  function() {
    // append failed resolves to the list again
    console.warn('resolving player guids failed: ' + p.join(', '));
    window.playersToResolve.concat(p);
  });
}


window.setPlayerName = function(guid, nick) {
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
