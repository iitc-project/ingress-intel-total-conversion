// ==UserScript==
// @id             iitc-plugin-show-linked-portals@fstopienski
// @name           IITC plugin: Show linked portals
// @version        0.0.3.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Tries to show the linked portals (image, name and address) in portal detail view and jump to linked portal on click
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// ==/UserScript==

/*
* 0.0.1 initial release, show images, names and addresses of linked portal in portal detailview
* - mouse click of the linked portal image selected the portal and adjust map
* - click of "Linked Portal is out of range" zoom a step out
*/

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if (typeof window.plugin !== 'function') {
    window.plugin = function () {
    };
}

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.showLinkedPortal = function () {
};

window.plugin.showLinkedPortal.handleUpdate = function () {
    if (!requests.isLastRequest('getThinnedEntitiesV2')) {
        return;
    }
}

window.plugin.showLinkedPortal.portalDetail = function (data) {

    var d = data.portalDetails.portalV2,
        c = 1;
    //get linked portals
    $(d.linkedEdges).each(function () {
        var portalInfo = window.plugin.showLinkedPortal.getPortalByGuid(this.otherPortalGuid);
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
            map.setZoom((map.getZoom() - 1));
        }
    });
}

window.plugin.showLinkedPortal.getPortalByGuid = function (guid) {
    var portalInfoString = '<span class="outOfRange" title="Zoom out">Linked  Portal out of range.</span>';
    if (window.portals[guid] !== undefined) {
        var portalDetails = window.portals[guid].options.details;
        portalInfoString = '';
        var portalNameAdressAlt = "'" + portalDetails.portalV2.descriptiveText.TITLE + "' (" + portalDetails.portalV2.descriptiveText.ADDRESS + ")";
        var portalNameAdressTitle = "'<strong>" + portalDetails.portalV2.descriptiveText.TITLE + "</strong>'<br/> <em>(" + portalDetails.portalV2.descriptiveText.ADDRESS + ")</em>";
        var imageUrl = (portalDetails.imageByUrl ? portalDetails.imageByUrl.imageUrl : window.DEFAULT_PORTAL_IMG);
        portalInfoString = '<img src="' + imageUrl + '" class="minImg" alt="' + portalNameAdressAlt + '" title="' + portalNameAdressTitle + '"/>';
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
        '.showLinkedPortalLink .minImg{height: 50px;}' +
        '.showLinkedPortalLink span.outOfRange{font-size: 8px;}' +

        '.showLinkedPortalLink1,.showLinkedPortalLink2,.showLinkedPortalLink3,.showLinkedPortalLink4 {left: 5px}' +
        '.showLinkedPortalLink5,.showLinkedPortalLink6,.showLinkedPortalLink7,.showLinkedPortalLink8 {right: 11px}' +
        '.showLinkedPortalLink9,.showLinkedPortalLink10,.showLinkedPortalLink11,.showLinkedPortalLink12 {left: 59px}' +
        '.showLinkedPortalLink13,.showLinkedPortalLink14,.showLinkedPortalLink15,.showLinkedPortalLink16 {right: 65px}' +

        '.showLinkedPortalLink1,.showLinkedPortalLink5,.showLinkedPortalLink9,.showLinkedPortalLink13 {top: 100px; }' +
        '.showLinkedPortalLink2,.showLinkedPortalLink6,.showLinkedPortalLink10,.showLinkedPortalLink14 {top: 144px; }' +
        '.showLinkedPortalLink3,.showLinkedPortalLink7,.showLinkedPortalLink11,.showLinkedPortalLink15 {top: 188px; }' +
        '.showLinkedPortalLink4,.showLinkedPortalLink8,.showLinkedPortalLink12,.showLinkedPortalLink16 {top: 232px; }' +
        '#level{text-align:center; margin-right: 0px;}' +
        '</style>');
    window.plugin.showLinkedPortal.setupCallback();
}
// PLUGIN END //////////////////////////////////////////////////////////

if (window.iitcLoaded && typeof setup === 'function') {
    setup();
} else {
    if (window.bootPlugins)
        window.bootPlugins.push(setup);
    else
        window.bootPlugins = [setup];
}
} // wrapper end
// inject code into site context
var script = document.createElement('script');
script.appendChild(document.createTextNode('(' + wrapper + ')();'));
(document.body || document.head || document.documentElement).appendChild(script);
