// ==UserScript==
// @id             iitc-plugin-guess-player-levels@breunigs
// @name           iitc: guess player level
// @version        0.2
// @namespace      https://github.com/breunigs/ingress-intel-total-conversion
// @updateURL      https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/guess-player-levels.user.js
// @downloadURL    https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/guess-player-levels.user.js
// @description    Tries to determine player levels from the data available in the current view
// @include        https://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// ==/UserScript==

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.guessPlayerLevels = function() {};

window.plugin.guessPlayerLevels.setupCallback = function() {
  $('#toolbox').append('<a onclick="window.plugin.guessPlayerLevels.guess()">guess player levels</a> ');
  addHook('portalAdded', window.plugin.guessPlayerLevels.extractPortalData);
}


window.plugin.guessPlayerLevels.setLevelTitle = function(dom) {
  // expects dom node with nick in its child text node

  var playersNamed = {};
  for (var i = 0; i < localStorage.length; i++) {
    var ident = localStorage.key(i);
    if(!ident.startsWith('level-')) continue;
    var guid = ident.slice(6);
    var level = localStorage[ident];
    playersNamed[getPlayerName(guid)] = level;
  }

  var el = $(dom);
  var nick = el.text();
  var text;
  if (nick in playersNamed) {
    text = 'Min player level: ' + playersNamed[nick];
    if(playersNamed[nick] === window.MAX_XM_PER_LEVEL - 1) text += ' (guessed)';
  } else {
    text = 'Min player level unknown';
  }
  el.attr('title', text).addClass('help');
}

window.plugin.guessPlayerLevels.setupChatNickHelper = function() {
  $('#portaldetails').delegate('#resodetails .meter-text', 'mouseenter', function() {
    window.plugin.guessPlayerLevels.setLevelTitle(this);
  });

  $('#chat').delegate('mark', 'mouseenter', function() {
    window.plugin.guessPlayerLevels.setLevelTitle(this);
  });
}

window.plugin.guessPlayerLevels.extractPortalData = function(data) {
  var r = data.portal.options.details.resonatorArray.resonators;
  $.each(r, function(ind, reso) {
    if(!reso) return true;
    var p = 'level-'+reso.ownerGuid;
    var l = reso.level;
    if(!window.localStorage[p] || window.localStorage[p] < l)
      window.localStorage[p] = l;
  });
}

window.plugin.guessPlayerLevels.guess = function() {
  var playersRes = {};
  var playersEnl = {};
  $.each(window.portals, function(ind, portal) {
    var r = portal.options.details.resonatorArray.resonators;
    $.each(r, function(ind, reso) {
      if(!reso) return true;
      var lvl = localStorage['level-' + reso.ownerGuid];
      var nick = getPlayerName(reso.ownerGuid);
      if(portal.options.team === TEAM_ENL)
        playersEnl[nick] = lvl;
      else
        playersRes[nick] = lvl;
    });
  });

  var s = 'the players have at least the following level:\n\n';
  s += 'Resistance:\t&nbsp;&nbsp;&nbsp;\tEnlightened:\t\n';

  var namesR = plugin.guessPlayerLevels.sort(playersRes);
  var namesE = plugin.guessPlayerLevels.sort(playersEnl);
  var max = Math.max(namesR.length, namesE.length);
  for(var i = 0; i < max; i++) {
    var nickR = namesR[i];
    var lvlR = playersRes[nickR];
    var lineR = nickR ? nickR + ':\t' + lvlR : '\t';

    var nickE = namesE[i];
    var lvlE = playersEnl[nickE];
    var lineE = nickE ? nickE + ':\t' + lvlE : '\t';

    s += lineR + '\t\t' + lineE + '\n';
  }

  s += '\n\nIf there are some unresolved names, simply try again.'
  console.log(s);
  alert(s);
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
  window.plugin.guessPlayerLevels.setupCallback();
  window.plugin.guessPlayerLevels.setupChatNickHelper();
}

// PLUGIN END //////////////////////////////////////////////////////////

if(window.iitcLoaded && typeof setup === 'function') {
  setup();
} else {
  if(window.bootPlugins)
    window.bootPlugins.push(setup);
  else
    window.bootPlugins = [setup];
}
} // wrapper end
// inject code into site context
var script = document.createElement('script');
script.appendChild(document.createTextNode('('+ wrapper +')();'));
(document.body || document.head || document.documentElement).appendChild(script);
