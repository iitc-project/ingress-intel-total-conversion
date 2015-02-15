// ==UserScript==
// @id             iitc-plugin-show-linked-portals@fstopienski
// @name           IITC plugin: Show linked portals
// @category       Portal Info
// @version        0.2.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Try to show the linked portals (image, name and link direction) in portal detail view and jump to linked portal on click.  Some details may not be available if the linked portal is not in the current view.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.showLinkedPortal = function () {
};

window.plugin.showLinkedPortal.portalDetail = function (data) {
  var portalLinks = getPortalLinks(data.guid);

  var c = 1;

  $.each(portalLinks.out, function(index,linkGuid) {
    // outgoing links - so the other portal is the destination
    var otherPortalGuid = window.links[linkGuid].options.data.dGuid;
    var portalInfo = window.plugin.showLinkedPortal.getPortalByGuid(otherPortalGuid, true);
    $('#portaldetails').append('<div class="showLinkedPortalLink showLinkedPortalLink' + c + '" id="showLinkedPortalLink_' + c + '" data-guid="' + otherPortalGuid + '">' + portalInfo + '</div>');
    c = c + 1;
  });
  $.each(portalLinks.in, function(index,linkGuid) {
    // incoming link - so the other portal is the origin
    var otherPortalGuid = window.links[linkGuid].options.data.oGuid;
    var portalInfo = window.plugin.showLinkedPortal.getPortalByGuid(otherPortalGuid, false);
    $('#portaldetails').append('<div class="showLinkedPortalLink showLinkedPortalLink' + c + '" id="showLinkedPortalLink_' + c + '" data-guid="' + otherPortalGuid + '">' + portalInfo + '</div>');
    c = c + 1;
  });

  $('.showLinkedPortalLink:not(.outOfRange)').bind('click', function () {
    var guid = $(this).attr('data-guid');
    window.renderPortalDetails(guid);
    var latlng = findPortalLatLng(guid);
    if (latlng) {
      if (!map.getBounds().pad(-0.1).contains(latlng)) {
        map.panTo(latlng);
      }
    } else {
      // no idea where this portal is(!) - so step back one zoom level
      map.setZoom(map.getZoom()-1);
    }

  });
}

window.plugin.showLinkedPortal.getPortalByGuid = function (guid,isorigin) {
    var linkDirection = $('<span/>').text(isorigin?'↴ outgoing link':'↳ incoming link');

    var portalInfoString;

    if (window.portals[guid] !== undefined) {
        var portalData = window.portals[guid].options.data;

        var portalNameAddressAlt = "'" + portalData.title + "'";
        var portalNameAddressTitle = $('<div/>').append($('<strong/>').text(portalData.title))
                                                .append($('<br/>'))
                                                .append(linkDirection)
                                                .html();
        var imageUrl = fixPortalImageUrl(portalData.image);
        portalInfoString = $('<div/>').html($('<img/>').attr('src', imageUrl)
                                                       .attr('class', 'minImg')
                                                       .attr('alt', portalNameAddressAlt)
                                                       .attr('title', portalNameAddressTitle))
                                                       .html();
    } else {
        var title = $('<div/>').append($('<strong/>').text('Go to portal'))
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

var setup = function () {
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
}
// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
