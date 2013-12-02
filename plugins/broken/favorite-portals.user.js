// ==UserScript==
// @id             iitc-plugin-favorite-portals@soulBit
// @name           IITC plugin: Favorite Portals
// @category       Obsolete
// @version        0.2.0.@@DATETIMEVERSION@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] DEPRECATED. Please use "Bookmarks for maps and portals" instead.
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

window.plugin.favoritePortals = function() {};

window.plugin.favoritePortals.portalList = {};
window.plugin.favoritePortals.LOCAL_STORAGE_KEY = "plugin-favorite-portals";
window.plugin.favoritePortals.hasLocalStorage = ('localStorage' in window && window['localStorage'] !== null);

window.plugin.favoritePortals.onDetailsUpdated = function(data) {
  $('.linkdetails').prepend("<div title='Favorite this portal' class='toggle-favorite-portal' onclick='window.plugin.favoritePortals.togglePortal()' />");
  if(window.plugin.favoritePortals.portalList[window.selectedPortal]) {
    $('.toggle-favorite-portal').addClass( 'portal-on' );
    window.plugin.favoritePortals.portalList[window.selectedPortal] = window.portals[window.selectedPortal].options;
    window.plugin.favoritePortals.savePortals();
  }
}

window.plugin.favoritePortals.display = function() {
  var output = '';

  if (!window.plugin.favoritePortals.hasLocalStorage) {
    output += "Favorite portals cannot save any data, please try another browser that supports 'localStorage'.";
  } else {
    if ($.isEmptyObject(window.plugin.favoritePortals.portalList)) {
      output += "No portals have been marked as favorite, click the blue square in the bottom left corner of the portal details to save one.";
    } else {
      output += "<div class='header'>Portal list (values not current till portal on screen):</div>";
      output += "<div class='portal-list-container'>";

      var portals = [], dataChanged = false, portalData;
      $.each( window.plugin.favoritePortals.portalList, function(i, portal) {
        if(window.portals[i]) {
          dataChanged = true;
          window.plugin.favoritePortals.portalList[ i ] = window.portals[i].options;
        }
        portalData = (window.portals[i]) ? window.portals[i].options : portal;
        portals.push({'guid': i, 'portalData': portalData});
      });
      if(dataChanged)
        window.plugin.favoritePortals.savePortals();

      portals.sort(function(a,b) {
                var nameA = a.portalData.details.portalV2.descriptiveText.TITLE.toLowerCase();
                var nameB = b.portalData.details.portalV2.descriptiveText.TITLE.toLowerCase();
                return (nameA < nameB) ? -1 : (nameA > nameB) ? 1 : 0;
              });

      output += "<ol>";
      var teamName, energy;
      $.each(portals, function(i, portal) {
        portalData = portal.portalData;
        output += "<li name='" + portal.guid + "'>";

        output += "<a class='delete-favorite-portal' title='Delete favorite?' onclick='window.plugin.favoritePortals.onDelete(" + '"' + portal.guid + '"' + ");return false'>X</a>";
        output += "<a onclick='window.plugin.favoritePortals.onPortalClicked(" + ' "' + portal.guid + '", [' + (portalData.details.locationE6.latE6 / 1000000) + "," + (portal.portalData.details.locationE6.lngE6 / 1000000) + "]);return false'>" + portalData.details.portalV2.descriptiveText.TITLE + "</a>";
        teamName = portalData.details.controllingTeam.team;
        output += " - L" + Math.floor( portalData.level );
        energy = Math.floor( window.getCurrentPortalEnergy(portalData.details) / window.getPortalEnergy(portalData.details) * 100 );
        if(!isNaN(energy))
          output += " @" + energy + "%";
        output += ": " + ( (teamName === "ALIENS") ? "Enlightened" : teamName[0] + teamName.slice(1).toLowerCase() );
        if(portalData.details.portalV2.linkedEdges.length > 0 || portalData.details.portalV2.linkedFields.length > 0)
          output += ", " + portalData.details.portalV2.linkedEdges.length + " links & " + portalData.details.portalV2.linkedFields.length + " fields";
        output += "</li>";
      });

      output += "</ol>"
      output += "</div>";
    }
  }

  window.dialog({'html': "<div id='favorite-portal-list'>" + output + "</div>", 'title': 'Favorite portals', 'id': 'favorite-portals'});
}

window.plugin.favoritePortals.onDelete = function(guid) {
  delete window.plugin.favoritePortals.portalList[ guid ];
  if(window.selectedPortal && window.selectedPortal === guid)
    $('.toggle-favorite-portal').removeClass( 'portal-on' ).addClass( 'portal-off' );
  $("li[name='" + guid + "']").remove();
  window.plugin.favoritePortals.savePortals();
}

window.plugin.favoritePortals.onPortalClicked = function(guid, coords) {
  window.zoomToAndShowPortal(guid, coords);
  $('#dialog-favorite-portals').dialog('close');
}

window.plugin.favoritePortals.togglePortal = function() {
  if(window.plugin.favoritePortals.portalList[window.selectedPortal]) {
    $('.toggle-favorite-portal').removeClass('portal-on').addClass('portal-off');
    delete window.plugin.favoritePortals.portalList[ window.selectedPortal ];
  } else {
    $('.toggle-favorite-portal').removeClass('portal-off').addClass('portal-on');
    window.plugin.favoritePortals.portalList[window.selectedPortal] = window.portals[window.selectedPortal].options;
  }
  window.plugin.favoritePortals.savePortals();
}

window.plugin.favoritePortals.savePortals = function() {
  var portalsObject = {'portals': window.plugin.favoritePortals.portalList};
  var portalListJSON = JSON.stringify(portalsObject);
  localStorage[window.plugin.favoritePortals.LOCAL_STORAGE_KEY] = portalListJSON;
}

window.plugin.favoritePortals.loadPortals = function() {
  var portalListJSON = localStorage[window.plugin.favoritePortals.LOCAL_STORAGE_KEY];
  if(!portalListJSON) return;
  var portalsObject = JSON.parse(portalListJSON);
  window.plugin.favoritePortals.portalList = portalsObject.portals;
}

window.plugin.favoritePortals.setup = function() {
  window.plugin.favoritePortals.loadPortals();
  window.addHook('portalDetailsUpdated', window.plugin.favoritePortals.onDetailsUpdated);
  $('#toolbox').append("<a onclick='window.plugin.favoritePortals.display()' title='Create a list of favorite portals'>Favorite Portals</a>");
  $("<style>").prop("type", "text/css").html(".toggle-favorite-portal {\
                                  width: 13px;\
                                  height: 13px;\
                                  margin-left: 10px;\
                                  vertical-align: middle;\
                                  display: inline-block;\
                                  cursor: pointer;\
                                  border: 1px solid #20A8B1;\
                                }\
                                .portal-on {\
                                  background-color: #20A8B1;\
                                }\
                                .portal-off {\
                                }\
                                .linkdetails {\
                                  margin-bottom: 5px;\
                                }\
                                .delete-favorite-portal {\
                                  width: 10px;\
                                  height: 10px;\
                                  color: #FFCC00;\
                                  border: 2px solid #20A8B1;\
                                  margin-right: 10px;\
                                  padding-left: 3px;\
                                  padding-right: 3px;\
                                  font-weight: bolder;\
                                }\
                                #favorite-portal-list {\
                                  padding: 5px;\
                                }\
                                #favorite-portal-list li {\
                                  line-height: 1.8;\
                                }").appendTo("head");
};

var setup  = window.plugin.favoritePortals.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
