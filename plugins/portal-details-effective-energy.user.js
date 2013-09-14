// ==UserScript==
// @id             iitc-plugin-portal-details-effective-energy@vita10gy
// @name           IITC plugin: Portal Details: Effective Energy
// @category       Info
// @version        0.1.8.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] show effective damage and mitigation in portal details.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalDetailEffectiveEnergy = function() {};


window.plugin.portalDetailEffectiveEnergy.portalDetail = function(data) {
  var effectiveEnergy = getEffectivePortalEnergy(data.portalDetails);
  var mitigation = ['mitigation',
                    '<span title="Link Mitigation: '
                    + effectiveEnergy.link_mitigation
                    + '% - Shield Mitigation: '
                    + effectiveEnergy.shield_mitigation
                    + '%">'
                    + (effectiveEnergy.total_mitigation)
                    + '%</span>']
  var effectiveEnergyText = ['<span title="Effective Energy - The current energy this portal has, plus the energy absorbed by the portal\'s defenses">EfEn</span>',
                             digits(effectiveEnergy.effective_energy)];
  $("#randdetails tbody").append(genFourColumnTable([mitigation, effectiveEnergyText]));
}

var setup =  function() {  
  window.addHook('portalDetailsUpdated', window.plugin.portalDetailEffectiveEnergy.portalDetail);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
