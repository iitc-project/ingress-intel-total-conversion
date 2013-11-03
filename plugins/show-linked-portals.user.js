// ==UserScript==
// @id             iitc-plugin-show-linked-portals@fstopienski
// @name           IITC plugin: Show linked portals
// @category       Portal Info
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Tries to show the linked portals (image, name and address) in portal detail view and jump to linked portal on click
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

/*
* 0.0.1 initial release, show images, names and addresses of linked portal in portal detailview
* - mouse click of the linked portal image selected the portal and adjust map
* - click of "Linked Portal is out of range" zoom a step out
*/

// use own namespace for plugin
window.plugin.showLinkedPortal = function () {
};

window.plugin.showLinkedPortal.handleUpdate = function () {
    if (!requests.isLastRequest('getThinnedEntitiesV4')) {
        return;
    }
}

window.plugin.showLinkedPortal.portalDetail = function (data) {
    // don't render linked portal data if portal is neutral.
    // (the data can remain sometimes - when a portal decays?)
    if (data.portalDetails.controllingTeam.team == 'NEUTRAL')
        return;

    var d = data.portalDetails.portalV2,
        c = 1;
    //get linked portals
    $(d.linkedEdges).each(function () {
        var portalInfo = window.plugin.showLinkedPortal.getPortalByGuid(this.otherPortalGuid, this.isOrigin);
        $('#portaldetails').append('<div class="showLinkedPortalLink showLinkedPortalLink' + c + '" id="showLinkedPortalLink_' + c + '" data-guid="' + this.otherPortalGuid + '">' + portalInfo + '</div>');
        c = c + 1;
    });

    $('.showLinkedPortalLink:not(.outOfRange)').bind('click', function () {
        var guid = $(this).attr('data-guid');
        if (window.portals[guid] !== undefined) {
            window.selectPortal($(this).attr('data-guid'));
            window.renderPortalDetails(window.selectedPortal);
            var portalDetails = window.portals[guid].options.details;
            var lat0 = portalDetails.locationE6.latE6 / 1E6;
            var lon0 = portalDetails.locationE6.lngE6 / 1E6;
            var Rlatlng = [lat0, lon0];
            map.setView(Rlatlng, map.getZoom());
        }
        else {
            // TODO: instead of just zooming out one level, check the link data for the start+end coordinates,
            // and fit the map view to the bounding box
            map.setZoom((map.getZoom() - 1));
        }
    });
}

window.plugin.showLinkedPortal.getPortalByGuid = function (guid,isorigin) {
    var linkDirection = $('<span/>').text(isorigin?'↴ outgoing link':'↳ incoming link');

    var portalInfoString;

    if (window.portals[guid] !== undefined) {
        var portalDetails = window.portals[guid].options.details;

        var portalNameAdressAlt = "'" + portalDetails.portalV2.descriptiveText.TITLE + "' (" + portalDetails.portalV2.descriptiveText.ADDRESS + ")";
        var portalNameAdressTitle = $('<div/>').append($('<strong/>').text(portalDetails.portalV2.descriptiveText.TITLE))
                                               .append($('<br/>'))
                                               .append($('<em/>').text('(' + portalDetails.portalV2.descriptiveText.ADDRESS + ')'))
                                               .append($('<br/>'))
                                               .append(linkDirection)
                                               .html();
        var imageUrl = getPortalImageUrl(portalDetails);
        portalInfoString = $('<div/>').html($('<img/>').attr('src', imageUrl)
                                                       .attr('class', 'minImg')
                                                       .attr('alt', portalNameAdressAlt)
                                                       .attr('title', portalNameAdressTitle))
                                      .html();
    } else {
        var title = $('<div/>').append($('<strong/>').text('Zoom out'))
                               .append($('<br/>'))
                               .append(linkDirection)
                               .html();

        portalInfoString = $('<div/>').html($('<span/>').attr('class','outOfRange')
                                                        .attr('title',title)
                                                        .text('Portal out of range.'))
                                      .html();
    }

    return portalInfoString;
};

window.plugin.showLinkedPortal.setupCallback = function () {
    // make the value update when the map data updates
    var handleDataResponseOrig = window.handleDataResponse;
    window.handleDataResponse = function (data, textStatus, jqXHR) {
        handleDataResponseOrig(data, textStatus, jqXHR);
        window.renderPortalDetails(window.selectedPortal);
    }
}

var setup = function () {
    window.addHook('requestFinished', window.plugin.showLinkedPortal.handleUpdate);
    window.addHook('portalDetailsUpdated', window.plugin.showLinkedPortal.portalDetail);
    $('head').append('<style>' +
        '.showLinkedPortalLink{cursor: pointer; position: absolute; height: 40px; width: 50px; border:solid 1px; overflow: hidden; text-align: center; background: #0e3d4e;}' +
        '.showLinkedPortalLink .minImg{height: 40px;}' +
        '.showLinkedPortalLink span.outOfRange{font-size: 10px;}' +

        '.showLinkedPortalLink1,.showLinkedPortalLink2,.showLinkedPortalLink3,.showLinkedPortalLink4 {left: 5px}' +
        '.showLinkedPortalLink5,.showLinkedPortalLink6,.showLinkedPortalLink7,.showLinkedPortalLink8 {right: 11px}' +
        '.showLinkedPortalLink9,.showLinkedPortalLink10,.showLinkedPortalLink11,.showLinkedPortalLink12 {left: 59px}' +
        '.showLinkedPortalLink13,.showLinkedPortalLink14,.showLinkedPortalLink15,.showLinkedPortalLink16 {right: 65px}' +

        '.showLinkedPortalLink1,.showLinkedPortalLink5,.showLinkedPortalLink9,.showLinkedPortalLink13 {top: 25px; }' +
        '.showLinkedPortalLink2,.showLinkedPortalLink6,.showLinkedPortalLink10,.showLinkedPortalLink14 {top: 69px; }' +
        '.showLinkedPortalLink3,.showLinkedPortalLink7,.showLinkedPortalLink11,.showLinkedPortalLink15 {top: 113px; }' +
        '.showLinkedPortalLink4,.showLinkedPortalLink8,.showLinkedPortalLink12,.showLinkedPortalLink16 {top: 157px; }' +
        '#level{text-align: center; margin-right: -0.5em; position: relative; right: 50%; width: 1em;}' +
        '</style>');
    window.plugin.showLinkedPortal.setupCallback();
}
// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
