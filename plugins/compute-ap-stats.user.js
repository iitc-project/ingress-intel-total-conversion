// ==UserScript==
// @id             iitc-plugin-compute-ap-stats@Hollow011
// @name           iitc: Compute AP statistics
// @version        0.1
// @namespace      https://github.com/breunigs/ingress-intel-total-conversion
// @updateURL      https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/compute-ap-stats.user.js
// @downloadURL    https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/compute-ap-stats.user.js
// @description    Tries to determine overal AP stats for the current zoom
// @include        http://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// ==/UserScript==

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.compAPStats = function() {};

window.plugin.compAPStats.setupCallback = function() {
  $('#toolbox').append('<a onclick="window.plugin.compAPStats.guess()">Compute AP Stats</a> ');
}

window.plugin.compAPStats.compAPStats = function() {
  
  var totalAP_RES = 0;
  var totalAP_ENL = 0;
  
  var allResEdges = [];
  var allResFields = [];
  var allEnlEdges = [];
  var allEnlFields = [];
  
  
  // Grab every portal in the viewable area and compute individual AP stats
  $.each(window.portals, function(ind, portal) {
    var d = portal.options.details;
    
    var portalStats = getAttackApGain(d);
    var portalSum = portalStats.resoAp + portalStats.captureAp;
    
    if (getTeam(d) === TEAM_ENL) {
      totalAP_RES += portalSum;
      
      $.each(d.portalV2.linkedEdges, function(ind, edge) {
      	if(!edge) return true;
      	allEnlEdges.push(edge.edgeGuid);
      });
      
      $.each(d.portalV2.linkedFields, function(ind, field) {
        if(!field) return true;
        allEnlFields.push(field);
      });
    }
    else if (getTeam(d) === TEAM_RES) {
      totalAP_ENL += portalSum;
      
      $.each(d.portalV2.linkedEdges, function(ind, edge) {
        if(!edge) return true;
        allResEdges.push(edge.edgeGuid);
      });
        
      $.each(d.portalV2.linkedFields, function(ind, field) {
        if(!field) return true;
        allResFields.push(field);
      });
    } else { 
      // it's a neutral portal, potential for both teams.  by definition no fields or edges
      totalAP_ENL += portalSum;
      totalAP_RES += portalSum;
    }
  });
  
  // Compute team field AP
  allResFields = uniqueArray(allResFields);
  totalAP_ENL += (allResFields.length * DESTROY_FIELD);
  allEnlFields = uniqueArray(allEnlFields);
  totalAP_RES += (allEnlFields.length * DESTROY_FIELD);
  
  // Compute team Link AP
  allResEdges = uniqueArray(allResEdges);
  totalAP_ENL += (allResEdges.length * DESTROY_LINK);
  allEnlEdges = uniqueArray(allEnlEdges);
  totalAP_RES += (allEnlEdges.length * DESTROY_LINK);
 
  return [totalAP_RES, totalAP_ENL];
}

window.plugin.compAPStats.guess = function() {
  var res = window.plugin.compAPStats.compAPStats();
  var totalAP_RES = res[0];
  var totalAP_ENL = res[1];

  var s = 'Calculated AP gain potential:\n\n';
  s += 'Available Resistance AP:\t' + digits(totalAP_RES) + '\n';
  s += 'Available Enlightened AP:\t' + digits(totalAP_ENL) + '\n';

  alert(s);
}

var setup =  function() {
  window.plugin.compAPStats.setupCallback();
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
