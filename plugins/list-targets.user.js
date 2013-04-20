// ==UserScript==
// @id             list-targets@sbeitzel
// @name           IITC plugin: list targets
// @version        0.3.06
// @updateURL      https://raw.github.com/sbeitzel/ingress-intel-total-conversion/gh-pages/plugins/list-targets.user.js
// @downloadURL    https://raw.github.com/sbeitzel/ingress-intel-total-conversion/gh-pages/plugins/list-targets.user.js
// @description    Calls out links to portals which are easy candidates for attack by the current user.
// @include        https://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// ==/UserScript==

/**
 * I was motivated to create this script because I live in an area with few portals, a high-level opposition, and an
 * uncoordinated faction. As a low-level agent I struggled to find portals I could attack. As a family man with his head
 * on straight, I had a hard time meeting up with other agents for team play. I wrote this plugin to help me find the
 * weakest portal on the map. If you're playing with others, if your faction actually has some coordination and you can
 * make it out to play with other people, then this plugin is probably useless to you. Multiple agents can take down
 * any portal, and once you've destroyed and rebuilt several portals, you'll be high enough level that, again, this
 * information will not be useful to you. However, if you're not able to play with a team, for whatever reason, and you're
 * trying to find the best use of your bursters, this plugin might make that task a little more straightforward.
 */

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
        var dataStruct = {difficulty:0, plink:plink, title:d.portalV2.descriptiveText.TITLE,
                          address:d.portalV2.descriptiveText.ADDRESS, latE6:latE6, lngE6:lngE6, pguid:pguid };
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

    // portal link - single click: select portal
    //               double click: zoom to and select portal
    //               hover: show address
    // code from getPortalLink function by xelio from iitc: AP List - https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/ap-list.user.js
    window.plugin.listTargets.getPortalLink = function(datastruct) {
        var latlng = [datastruct.latE6/1E6, datastruct.lngE6/1E6].join();
        var jsSingleClick = 'window.plugin.listTargets.selectPortal(\''+datastruct.pguid+'\');return false';
        var jsDoubleClick = 'window.zoomToAndShowPortal(\''+datastruct.pguid+'\', ['+latlng+']);return false';
        var perma = '/intel?latE6='+datastruct.latE6+'&lngE6='+datastruct.lngE6+'&z=17&pguid='+datastruct.pguid;

        var atag = document.createElement("a");
        atag.setAttribute('class', "help");
        atag.setAttribute("title", datastruct.address);
        atag.setAttribute("href", perma);
        atag.setAttribute("onclick", jsSingleClick);
        atag.setAttribute("ondblclick", jsDoubleClick);
        atag.appendChild(document.createTextNode(datastruct.title));

        var div = document.createElement("div");
        div.setAttribute("style", "max-height: 15px !important; min-width:140px !important;max-width:180px !important; overflow: hidden; text-overflow:ellipsis;");
        div.appendChild(atag);

        return div;
    };

    // selectPortal - copied from ap-list plugin
    window.plugin.listTargets.selectPortal = function(guid) {
      // Add error catching to avoid following link of portal if error
      // occured in renderPortalDetails or hooked plugin
      try {
        renderPortalDetails(guid);
      } catch(e) {
        console.error(e.message);
        console.log(e.stack);
        console.log('Skipping error in renderPortalDetails or hooked plugin')
      }
      window.plugin.listTargets.setPortalLocationIndicator(guid);
    };

    // setPortalLocationIndicator - copied from ap-list plugin
    window.plugin.listTargets.setPortalLocationIndicator = function(guid) {
      var portal = window.portals[guid];
      if(!portal) return;
      var startRadius = screen.availWidth / 2;
      var portalRadius = portal.options.radius;
      var latlng = portal.getLatLng();
      var property = {
        radius: startRadius,
        fill: false,
        color: COLOR_SELECTED_PORTAL,
        weight: 2,
        opacity: 1,
        portalRadius: portalRadius,
        clickable: false };

      if(plugin.listTargets.portalLocationIndicator)
        map.removeLayer(plugin.listTargets.portalLocationIndicator);
      if(plugin.listTargets.animTimeout)
        clearTimeout(plugin.apList.animTimeout);
      plugin.listTargets.portalLocationIndicator = L.circleMarker(latlng, property).addTo(map);
      plugin.listTargets.animTimeout = setTimeout(plugin.listTargets.animPortalLocationIndicator,100);
    };

    // animPortalLocationIndicator - copied from ap-list plugin
    window.plugin.listTargets.animPortalLocationIndicator = function() {
      var radius = plugin.listTargets.portalLocationIndicator.options.radius;
      var portalRadius = plugin.listTargets.portalLocationIndicator.options.portalRadius;
      if(radius > portalRadius) {
        var step = radius / 3;
        if(radius < 80) step = step / 3;
        var newRadius = plugin.listTargets.portalLocationIndicator.options.radius -= step;
        plugin.listTargets.portalLocationIndicator.setRadius(newRadius);
        if(plugin.listTargets.animTimeout)
          clearTimeout(plugin.listTargets.animTimeout);
        plugin.listTargets.animTimeout = setTimeout(plugin.listTargets.animPortalLocationIndicator,100);
      } else {
        map.removeLayer(plugin.listTargets.portalLocationIndicator);
      }
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
      var row = document.createElement("tr");
      var cell = document.createElement("td");
      cell.appendChild(document.createTextNode(datastruct.difficulty));
      row.appendChild(cell);
      cell = document.createElement("td");
      var anchor = window.plugin.listTargets.getPortalLink(datastruct);
        // debugging
        console.log("anchor:");
        console.log(anchor);

      cell.appendChild(anchor);
        console.log("cell");
        console.log(cell);
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
