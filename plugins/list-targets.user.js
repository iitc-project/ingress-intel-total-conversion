// ==UserScript==
// @id             list-targets@sbeitzel
// @name           iitc: List-Targets-Plugin
// @version        0.2
// @updateURL      https://raw.github.com/sbeitzel/ingress-intel-total-conversion/gh-pages/plugins/list-targets.user.js
// @downloadURL    https://raw.github.com/sbeitzel/ingress-intel-total-conversion/gh-pages/plugins/list-targets.user.js
// @description    Calls out links to portals which are good candidates for attack by the current user.
// @include        https://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// ==/UserScript==

function wrapper() {
  if ( !Array.prototype.forEach ) {
    Array.prototype.forEach = function(fn, scope) {
      for(var i = 0, len = this.length; i < len; ++i) {
        fn.call(scope, this[i], i, this);
      }
    }
  }
  // ensure plugin framework is there, even if iitc is not yet loaded
  if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////

  //noinspection JSPrimitiveTypeWrapperUsage
  window._targetStructs = new Array(); // this will hold a list of data structure
  //noinspection JSPrimitiveTypeWrapperUsage
  window._targetsSeen = new Array(); // this holds the GUIDs of portals we know about

// use own namespace for plugin
  window.plugin.listTargets = function() {};

  window.plugin.listTargets.portalsLoaded = function(data) {
    data.portals.forEach(function(portal, index, portalsRef) {
      var pguid = portal[0];
      var d = portal[2];
      var latE6 = d.locationE6.latE6;
      var lngE6 = d.locationE6.lngE6;
      // portal link
      var plink = "https://www.ingress.com/intel?latE6="+latE6+"&lngE6="+lngE6+"&pguid="+pguid;
      if (window._targetsSeen.indexOf(pguid) === -1) {
        var dataStruct = {difficulty:0, plink:plink, title:d.portalV2.descriptiveText.TITLE};
        window._targetStructs.push(dataStruct);
        window._targetsSeen.push(pguid);
        // we really only need to work out the susceptibility of enemy portals
        if(getTeam(d) !== 0 && getTeam(d) !== (PLAYER.team === 'ALIENS' ? TEAM_ENL : TEAM_RES)) {
          dataStruct.difficulty = window.getCurrentPortalEnergy(d);
        } else if (getTeam(d) !== 0) {
          window._targetStructs.pop();
        }
      }
    });
  };

  var setup =  function() {
    // add the UI
    var portalDiv = document.createElement("div");
    portalDiv.id = "targetlist";
    // the portal list should collapse up to the top of the window and float right to be flush against the sidebar
    portalDiv.style.position = "fixed";
    portalDiv.style.zIndex = 1001;
    portalDiv.style.width = "440px";
    portalDiv.style.maxHeight = "400px";
    portalDiv.style.right = "355px";
    portalDiv.style.top = "0px";
    portalDiv.style.overflowY = "auto";
    // place the div into the DOM
    $("#updatestatus").after(portalDiv);
    // wire in the hook
    window.addHook('portalDataLoaded', window.plugin.listTargets.portalsLoaded);
    window.addHook('requestFinished', window.plugin.listTargets.sortTargets);
    // listen for refresh notifications
    window.requests.addRefreshFunction(window.plugin.listTargets.clearTargetList);
  };

  window.plugin.listTargets.clearTargetList = function() {
    console.log("clearTargetList called");
    //noinspection JSPrimitiveTypeWrapperUsage
    window._targetStructs = new Array();
    //noinspection JSPrimitiveTypeWrapperUsage
    window._targetsSeen = new Array();
  };

  window.plugin.listTargets.sortTargets = function() {
    window._targetStructs.sort(function(a, b) {
      // a and b are data structures with difficulty attributes. We want to sort in ascending order.
      return a.difficulty - b.difficulty;
    });
    console.log("sort targets");
    console.log(window._targetStructs);
    // now the list is sorted, we should write it into the div
    var tlStr = "<table>\n<tr><td>Energy</td><td>Portal</td></tr>\n";
    $.each(window._targetStructs, function(datastruct) {
      tlStr += "<tr><td>"+datastruct.difficulty+"</td><td><a href=\""+datastruct.plink+"\">"+datastruct.title+"</a></td></tr>\n";
    });
    tlStr += "</table>\n";
    // TODO render tlStr in the div.
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
