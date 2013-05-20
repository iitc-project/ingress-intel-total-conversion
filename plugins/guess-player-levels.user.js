// ==UserScript==
// @id             iitc-plugin-guess-player-levels@breunigs
// @name           IITC plugin: guess player level
// @version        0.4.2.@@DATETIMEVERSION@@
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

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.guessPlayerLevels = function() {};

window.plugin.guessPlayerLevels.setupCallback = function() {
  $('#toolbox').append(' <a onclick="window.plugin.guessPlayerLevels.guess()" title="Show player level guesses based on resonator placement in displayed portals">Guess player levels</a>');
  addHook('portalAdded', window.plugin.guessPlayerLevels.extractPortalData);
}


// This function is intended to be called by other plugins
window.plugin.guessPlayerLevels.fetchLevelByPlayer = function(guid) {
  return(window.localStorage['level-' + guid]);
}

window.plugin.guessPlayerLevels._nameToGuidCache = {};

window.plugin.guessPlayerLevels.setLevelTitle = function(dom) {
  // expects dom node with nick in its child text node

  var el = $(dom);
  var nick = el.text();
  var guid = window.playerNameToGuid(nick);
  var level = guid ? localStorage['level-'+guid] : null;

  var text;
  if (level) {
    text = 'Min player level: ' + level;
    if(level < window.MAX_XM_PER_LEVEL.length - 1) text += ' (guessed)';
  } else {
    text = 'Min player level unknown';
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
  $(window).delegate('.nickname', 'mouseenter', function() {
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

  var s = 'Players have at least the following level:\n\n';
  s += 'Resistance:\t&nbsp;&nbsp;&nbsp;\tEnlightened:\t\n';

  var namesR = plugin.guessPlayerLevels.sort(playersRes);
  var namesE = plugin.guessPlayerLevels.sort(playersEnl);
  var totallvlR = 0;
  var totallvlE = 0;
  var max = Math.max(namesR.length, namesE.length);
  for(var i = 0; i < max; i++) {
    var nickR = namesR[i];
    var lvlR = playersRes[nickR];
    var lineR = nickR ? nickR + ':\t' + lvlR : '\t';
    if(!isNaN(parseInt(lvlR)))
        totallvlR += parseInt(lvlR);

    var nickE = namesE[i];
    var lvlE = playersEnl[nickE];
    var lineE = nickE ? nickE + ':\t' + lvlE : '\t';
    if(!isNaN(parseInt(lvlE)))
        totallvlE += parseInt(lvlE);

    s += '\n'+lineR + '\t' + lineE + '\n';
  }
  s += '\nTotal level :\t'+totallvlR+'\tTotal level :\t'+totallvlE;
  s += '\nTotal player:\t'+namesR.length+'\tTotal player:\t'+namesE.length;
  var averageR = 0, averageE = 0;
  if (namesR.length > 0)  averageR = (totallvlR/namesR.length);
  if (namesE.length > 0)  averageE = (totallvlE/namesE.length);
  s += '\nAverage level:\t'+averageR.toFixed(2)+'\tAverage level:\t'+averageE.toFixed(2);
  s += '\n\nIf there are some unresolved names, simply try again.'
  //console.log(s);
  dialog({
    text: s,
    title: 'Player levels: R' + averageR.toFixed(2) + ', E' + averageE.toFixed(2)
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
