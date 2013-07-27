// ==UserScript==
// @id             iitc-plugin-portal-details-damage@vita10gy
// @name           IITC plugin: Portal Details: Estimated Damage
// @category       Info
// @version        0.1.8.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] show estimated level 5 buster damage in portal details.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalDetailDamage = function() {};


window.plugin.portalDetailDamage.portalDetail = function(data) {
  
  var d = data.portalDetails;
  var damage = getPortalDamage(d);
  var lvl5DmgText = ['<span title="Level 5 Damage - Expected damage from a level 5 burster fired on portal (Experimental)">Lvl5Dmg</span>',
                             digits(damage[5])];
  var lvl5DmgPercentText = ['<span title="Level 5 Damage % - Expected damage percentage from a level 5 burster fired on portal (Experimental)">Lvl5D%</span>',
                             Math.round(damage[5]/getCurrentPortalEnergy(d)*100) + '%'];
  $("#randdetails tbody").append(genFourColumnTable([lvl5DmgText, lvl5DmgPercentText]));
}

var setup =  function() {  
  window.addHook('portalDetailsUpdated', window.plugin.portalDetailDamage.portalDetail);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
