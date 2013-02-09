// ==UserScript==
// @id             iitc-plugin-guess-player-levels@breunigs
// @name           iitc: guess player level
// @version        0.1
// @namespace      https://github.com/breunigs/ingress-intel-total-conversion
// @updateURL      https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/guess-player-levels.user.js
// @downloadURL    https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/guess-player-levels.user.js
// @description    Tries to determine player levels from the data available in the current view
// @include        http://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// ==/UserScript==

function wrapper() {
console.log('hello from plugin');

if(typeof window.plugin !== 'function') window.plugin = function() {};

console.log('window.plugin now is:');
console.log(window.plugin);



window.plugin.guessPlayerLevels = function() {
  var players = {};
  $.each(window.portals, function(ind, portal) {
    var r = portal.options.details.resonatorArray.resonators;
    $.each(r, function(ind, reso) {
      if(!reso) return true;
      var p = reso.ownerGuid;
      var l = reso.level;
      if(!players[p] || players[p] < l) players[p] = l;
    });
  });

  var playersNamed = {};
  $.each(players, function(guid, level) {
    playersNamed[getPlayerName(guid)] = level;
  });

  var s = '';
  $.each(Object.keys(playersNamed).sort, function(ind, playerName) {
    s += playerName + ': ' + level;
  });

  alert(s);
}


console.log('window.plugin.guessPlayerLevels now is:');
console.log(window.plugin.guessPlayerLevels);


} // wrapper end
// inject code into site context
var script = document.createElement('script');
script.appendChild(document.createTextNode('('+ wrapper +')();'));
(document.body || document.head || document.documentElement).appendChild(script);
