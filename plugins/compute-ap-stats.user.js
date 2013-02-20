// ==UserScript==
// @id             iitc-plugin-compute-ap-stats@breunigs
// @name           iitc: Compute AP statistics
// @version        0.1
// @namespace      https://github.com/breunigs/ingress-intel-total-conversion
// @updateURL      https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/compute_AP_stats.user.js
// @downloadURL    https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/compute_AP_stats.user.js
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
  
  var allResEdges = new Array();
  var allResFields = new Array();
  var allEnlEdges = new Array();
  var allEnlFields = new Array();
  
  
  // Grab every portal in the viewable area and compute individual AP stats  (ignoring links and fields for now)
  $.each(window.portals, function(ind, portal) {
    var d = portal.options.details
    var resoCount = 0;

    // see how many resonators the portal has
    $.each(d.resonatorArray.resonators, function(ind, reso) {
      if(!reso) return true;
      resoCount += 1;
    });
    
    // sum up the AP for the resonators, and any bonus 
    var resoAp = resoCount * DESTROY_RESONATOR;
    var portalSum = resoAp + CAPTURE_PORTAL + 8*DEPLOY_RESONATOR + COMPLETION_BONUS;
    
    // Team1 is a Res portal, Team2 is a Enl portal
    if ( getTeam(d) === TEAM_ENL ) {
      totalAP_RES += portalSum;
      
      $.each(d.portalV2.linkedEdges, function(ind,edge) {
      	if(!edge) return true;
      	allEnlEdges.push(edge.edgeGuid);
      });
      
      $.each(d.portalV2.linkedFields, function(ind,field) {
        if(!field) return true;
        allEnlFields.push(field);
      });
    }
    else if ( getTeam(d) === TEAM_RES ) {
      totalAP_ENL += portalSum;
      
      $.each(d.portalV2.linkedEdges, function(ind,edge) {
        if(!edge) return true;
        allResEdges.push(edge.edgeGuid);
      });
        
      $.each(d.portalV2.linkedFields, function(ind,field) {
        if(!field) return true;
        allResFields.push(field);
      });
    }
    else { 
      // it's a neutral portal, potential for both teams.  by definition no fields or edges
      totalAP_ENL += portalSum;
      totalAP_RES += portalSum;
    }
  });
  
  // Compute team field AP
  allResFields = $.unique(allResFields);
  totalAP_ENL += (allResFields.length * DESTROY_FIELD);
  allEnlFields = $.unique(allEnlFields);
  totalAP_RES += (allEnlFields.length * DESTROY_FIELD);
  
  // Compute team Link AP
  allResEdges = $.unique(allResEdges);
  totalAP_ENL += (allResEdges.length * DESTROY_LINK);
  allEnlEdges = $.unique(allEnlEdges);
  totalAP_RES += (allEnlEdges.length * DESTROY_LINK);
 
  return [totalAP_RES, totalAP_ENL];
}

window.plugin.compAPStats.guess = function() {
  var res = window.plugin.compAPStats.compAPStats();
  var totalAP_RES = res[0];
  var totalAP_ENL = res[1];

  var s = 'Calculated AP gain potential:\n\n';
  s += 'Available Resistance AP: \t' + digits(totalAP_RES) + '\n';
  s += 'Available Enlightened AP: \t' + digits(totalAP_ENL) + '\n';

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
