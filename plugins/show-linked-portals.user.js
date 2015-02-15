// ==UserScript==
// @id             iitc-plugin-show-linked-portals@fstopienski
// @name           IITC plugin: Show linked portals
// @category       Portal Info
// @version        0.3.0.@@DATETIMEVERSION@@
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
  plugin.showLinkedPortal.removePreview();

  var portalLinks = getPortalLinks(data.guid);
  var length = portalLinks.in.length + portalLinks.out.length

  var c = 1;

  function renderLinkedPortal(linkGuid) {
    if(c > 16) return;

    var key = this; // passed by Array.prototype.forEach
    var link = window.links[linkGuid].options.data;
    var guid = link[key + 'Guid'];
    var lat = link[key + 'LatE6']/1E6;
    var lng = link[key + 'LngE6']/1E6;

    var div = $('<div>').addClass('showLinkedPortalLink showLinkedPortalLink' + c);

    var title;

    if(portals[guid]) {
      var data = portals[guid].options.data;

      title = data.title;
      div.append($('<img/>').attr({
        'src': fixPortalImageUrl(data.image),
        'class': 'minImg',
        'alt': title,
      }));
    } else {
      title = 'Go to portal';
      div
        .addClass('outOfRange')
        .append($('<span/>')
          .text('Portal out of range.'))
    }

    div
      .attr({
        'data-guid': guid,
        'data-lat': lat,
        'data-lng': lng,
        'title': $('<div/>')
          .append($('<strong/>').text(title))
          .append($('<br/>'))
          .append($('<span/>').text(key=='d' ? '↴ outgoing link' : '↳ incoming link'))
          .html(),
      })
      .appendTo('#portaldetails');

    c++;
  }

  portalLinks.out.forEach(renderLinkedPortal, 'd');
  portalLinks.in.forEach(renderLinkedPortal, 'o');

  if(length > 16) {
    $('<div>')
      .addClass('showLinkedPortalLink showLinkedPortalOverflow')
      .text(length-16 + ' more')
      .appendTo('#portaldetails');
  }

  $('#portaldetails')
    .on('click', '.showLinkedPortalLink', plugin.showLinkedPortal.onLinkedPortalClick)
    .on('mouseover', '.showLinkedPortalLink', plugin.showLinkedPortal.onLinkedPortalMouseOver)
    .on('mouseout', '.showLinkedPortalLink', plugin.showLinkedPortal.onLinkedPortalMouseOut);
}

plugin.showLinkedPortal.onLinkedPortalClick = function() {
  plugin.showLinkedPortal.removePreview();

  var element = $(this);
  var guid = element.attr('data-guid');
  var lat = element.attr('data-lat');
  var lng = element.attr('data-lng');

  if(!guid) return; // overflow

  var position = L.latLng(lat, lng);
  if(!map.getBounds().contains(position)) map.setView(position);
  if(portals[guid])
    renderPortalDetails(guid);
  else
    zoomToAndShowPortal(guid, position);
};

plugin.showLinkedPortal.onLinkedPortalMouseOver = function() {
  plugin.showLinkedPortal.removePreview();

  var element = $(this);
  var lat = element.attr('data-lat');
  var lng = element.attr('data-lng');

  if(!(lat && lng)) return; // overflow

  var position = L.latLng(lat, lng);
  plugin.showLinkedPortal.preview = L.circleMarker(position, {
    color: "red",
    weight: 5,
    fill: false,
    dashArray: "1,6",
    radius: 18,
  }).addTo(map);
};

plugin.showLinkedPortal.onLinkedPortalMouseOut = function() {
  plugin.showLinkedPortal.removePreview();
};

plugin.showLinkedPortal.removePreview = function() {
  if(plugin.showLinkedPortal.preview)
    map.removeLayer(plugin.showLinkedPortal.preview);
  plugin.showLinkedPortal.preview = null;
};

var setup = function () {
  window.addHook('portalDetailsUpdated', window.plugin.showLinkedPortal.portalDetail);
  $('head').append('<style>' +
    '.showLinkedPortalLink{cursor: pointer; position: absolute; height: 40px; width: 50px; border:solid 1px; overflow: hidden; text-align: center; background: #0e3d4e;}' +
    '.showLinkedPortalLink .minImg{height: 40px;}' +
    '.showLinkedPortalLink.outOfRange span{font-size: 10px;}' +

    '.showLinkedPortalLink1,.showLinkedPortalLink2,.showLinkedPortalLink3,.showLinkedPortalLink4 {left: 5px}' +
    '.showLinkedPortalLink5,.showLinkedPortalLink6,.showLinkedPortalLink7,.showLinkedPortalLink8 {right: 5px}' +
    '.showLinkedPortalLink9,.showLinkedPortalLink10,.showLinkedPortalLink11,.showLinkedPortalLink12 {left: 59px}' +
    '.showLinkedPortalLink13,.showLinkedPortalLink14,.showLinkedPortalLink15,.showLinkedPortalLink16 {right: 59px}' +

    '.showLinkedPortalLink1,.showLinkedPortalLink5,.showLinkedPortalLink9,.showLinkedPortalLink13 {top: 23px; }' +
    '.showLinkedPortalLink2,.showLinkedPortalLink6,.showLinkedPortalLink10,.showLinkedPortalLink14 {top: 72px; }' +
    '.showLinkedPortalLink3,.showLinkedPortalLink7,.showLinkedPortalLink11,.showLinkedPortalLink15 {top: 122px; }' +
    '.showLinkedPortalLink4,.showLinkedPortalLink8,.showLinkedPortalLink12,.showLinkedPortalLink16,.showLinkedPortalOverflow {top: 171px; }' +
    '.showLinkedPortalOverflow{left: 50%;margin-left:-25px;cursor: default;}' +
    '#level{text-align: center; margin-right: -0.5em; position: relative; right: 50%; width: 1em;}' +
    '</style>');
}
// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
