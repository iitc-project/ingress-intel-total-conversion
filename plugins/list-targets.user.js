// ==UserScript==
// @id             list-targets@sbeitzel
// @name           iitc: List-Targets-Plugin
// @version        0.1
// @updateURL      https://raw.github.com/sbeitzel/ingress-intel-total-conversion/gh-pages/plugins/list-targets.user.js
// @downloadURL    https://raw.github.com/sbeitzel/ingress-intel-total-conversion/gh-pages/plugins/list-targets.user.js
// @description    Calls out links to portals which are good candidates for attack by the current user.
// @include        https://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// ==/UserScript==

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
  if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////

  //noinspection JSPrimitiveTypeWrapperUsage
  window._targetStructs = new Array(); // this will hold a list of data structure

// use own namespace for plugin
  window.plugin.listTargets = function() {};

  window.plugin.listTargets.portalDetail = function (data) {
    console.log("listTargets.portalDetail", data);
  };

  window.plugin.listTargets.portalAdded = function(data) {
    console.log("listTargets.portalAdded", data);
    // Because lat/long is a number between -180 and 180, we can multiply by 1,000,000 and double NOT to get latE6/lngE6.
    /* If the details of the portal are already filled in, then we don't even need to do this. However, we can't rely
       on that being the case. What a pain in the neck! If we have to have the logic for computing the location here,
       just go ahead and do it all the time. At least we'll be consistent. */
    // data.portal.options.details.locationE6 ought to exist, but sometimes it doesn't.
    var latFloat = data.portal._latlng.lat;
    var latE6 = ~~(latFloat * 1000000);
    var lngFloat = data.portal._latlng.lng;
    var lngE6 = ~~(lngFloat * 1000000);
    var pguid = data.portal.options.guid;
    // portal link
    var plink = "https://www.ingress.com/intel?latE6="+latE6+"&lngE6="+lngE6+"&pguid="+pguid;
    var d = data.portal.options.details;
    var dataStruct = {difficulty:0, plink:plink, pguid:pguid};
    window._targetStructs.push(dataStruct);
    // we really only need to work out the susceptibility of enemy portals
    if(getTeam(d) !== 0 && getTeam(d) !== (PLAYER.team === 'ALIENS' ? TEAM_ENL : TEAM_RES)) {
      dataStruct.difficulty = window.getCurrentPortalEnergy(d);
      console.log("enemy portal", dataStruct);
    } else if (getTeam(d) !== 0) {
      console.log("friend portal");
      window._targetStructs.pop();
    } else {
      console.log("neutral portal", dataStruct);
    }
  };

  var setup =  function() {
    window.addHook('portalDetailsUpdated', window.plugin.listTargets.portalDetail);
    window.addHook('portalAdded', window.plugin.listTargets.portalAdded);
  };

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
