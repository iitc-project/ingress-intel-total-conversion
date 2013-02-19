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
  var DESTROY_RESONATOR = 75; //AP for destroying portal
  var DESTROY_LINK = 187; //AP for destroying link
  var DESTROY_FIELD = 750; //AP for destroying field
  var CAPTURE_PORTAL = 500; //AP for capturing a portal
  var DEPLOY_RESONATOR = 125; //AP for deploying a resonator
  var COMPLETION_BONUS = 250; //AP for deploying all resonators on portal
  
  var totalAP_RES = 0;
  var totalAP_ENL = 0;
  
  //Grab every portal in the viewable area and compute individual AP stats
  $.each(window.portals, function(ind, portal) {
    var d = portal.options.details
    var resoCount = 0;

    //This code lovingly copied and chopped from parent plugin func getDestroyAP();
    ///////////////////////////////////////////////////////////////////////////
    $.each(d.resonatorArray.resonators, function(ind, reso) {
      if(!reso) return true;
      resoCount += 1;
    });
    
    //We'll count fields/links below so we don't duplicate AP
    //var linkCount = d.portalV2.linkedEdges ? d.portalV2.linkedEdges.length : 0;
    //var fieldCount = d.portalV2.linkedFields ? d.portalV2.linkedFields.length : 0;
    
    var resoAp = resoCount * DESTROY_RESONATOR;
    //var linkAp = linkCount * DESTROY_LINK;
    //var fieldAp = fieldCount * DESTROY_FIELD;
    var sum = resoAp + CAPTURE_PORTAL + 8*DEPLOY_RESONATOR + COMPLETION_BONUS;
    ///////////////////////////////////////////////////////////////////////////
    
    //Team1 is a Res portal, Team2 is a Enl portal
    if ( getTeam(d) == 1 )
      totalAP_ENL += sum;
    else if ( getTeam(d) == 2 )
      totalAP_RES += sum;
    else { //it's a neutral portal, potential for both teams
      totalAP_ENL += sum;
      totalAP_RES += sum;
    }
  });
  
  //Compute team field AP
  $.each(window.fields, function(ind, field) {
    //This is a hack that extrapolates the team based on the fill color of a field
    //Yes, I know it's painful.  We'd have an easier time if they would embed the
    //filed details in the leaflet object like they do for portals.
    var color = field.options.fillColor; //pukes out a string *sigh*
    var team = 0;
    
    if( color == '#0088FF' ) //color is RES
      totalAP_ENL += DESTROY_FIELD;
    else if( color == '#03FE03' ) //color is Enl
      totalAP_RES += DESTROY_FIELD;
  });
  
  //Compute team Link AP
  $.each(window.links, function(ind, link) {
    //This is a hack that extrapolates the team based on the fill color of a link
    //Yes, I know it's painful.  We'd have an easier time if they would embed the
    //filed details in the leaflet object like they do for portals.
    var color = link.options.color; //pukes out a string *sigh*
    
    var team = 0;
    
    if( color == '#0088FF' ) //color is RES
      totalAP_ENL += DESTROY_LINK;
    else if( color == '#03FE03' ) //color is Enl
      totalAP_RES += DESTROY_LINK;
  });
  
  return [totalAP_RES, totalAP_ENL];
}

window.plugin.compAPStats.guess = function() {
  var totalAP_RES = window.plugin.compAPStats.compAPStats()[0];
  var totalAP_ENL = window.plugin.compAPStats.compAPStats()[1];

  var s = 'Total AP for viewable area:\n\n';
  s += 'Possible Resistance AP: ' + totalAP_RES + '\n';
  s += 'Possible Enlightened AP: ' + totalAP_ENL + '\n';

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
