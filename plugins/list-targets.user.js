// ==UserScript==
// @id             list-targets@sbeitzel
// @name           IITC plugin: list targets
// @version        0.2.10
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
    var emptyTable = document.createElement("table");
    emptyTable.setAttribute('id', 'targetListTable');
    portalDiv.appendChild(emptyTable);
    // place the div into the DOM
    $("#portaldetails").after(portalDiv);
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

    console.log("sorted targets");
    console.log(window._targetStructs);

    $("#targetListTable").remove();

    var targetTable = document.createElement("table");
    targetTable.setAttribute('id', 'targetListTable');
    var thead = document.createElement("thead");
    var hrow = document.createElement("tr");
    var cell = document.createElement("th");
    cell.appendChild(document.createTextNode("Difficulty"));
    hrow.appendChild(cell);

    cell = document.createElement("th");
    cell.appendChild(document.createTextNode("Portal Link"));
    hrow.appendChild(cell);

    thead.appendChild(hrow);
    targetTable.appendChild(thead);
    var tbody = document.createElement("tbody");
    for (var i =0; i < window._targetStructs.length; i++) {
      var datastruct = window._targetStructs[i];
      console.log("add row for datastruct");
      console.log(datastruct);
      var row = document.createElement("tr");
      var cell = document.createElement("td");
      cell.appendChild(document.createTextNode(datastruct.difficulty));
      row.appendChild(cell);
      cell = document.createElement("td");
      var anchor = document.createElement("a");
      anchor.appendChild(document.createTextNode(datastruct.title));
      anchor.setAttribute("href", datastruct.plink);
      cell.appendChild(anchor);
      row.appendChild(cell);
      tbody.appendChild(row);
    };
    targetTable.appendChild(tbody);
    $("#targetlist").append(targetTable);
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
