// ==UserScript==
// @id             iitc-plugin-show-linked-portals@fstopienski
// @name           IITC plugin: Show linked portals
// @category       Portal Info
// @version        0.3.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Try to show the linked portals (image, name and link direction) in portal detail view and jump to linked portal on click.  Some details may not be available if the linked portal is not in the current view.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @include        https://www.ingress.com/mission/*
// @include        http://www.ingress.com/mission/*
// @match          https://www.ingress.com/mission/*
// @match          http://www.ingress.com/mission/*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.showLinkedPortal = function () {
};

plugin.showLinkedPortal.previewOptions = {
  color: "#C33",
  opacity: 1,
  weight: 5,
  fill: false,
  dashArray: "1,6",
  radius: 18,
};

window.plugin.showLinkedPortal.portalDetail = function (data) {
  plugin.showLinkedPortal.removePreview();

  var portalLinks = getPortalLinks(data.guid);
  var length = portalLinks.in.length + portalLinks.out.length

  var c = 1;

  $('<div>',{id:'showLinkedPortalContainer'}).appendTo('#portaldetails');

  function renderLinkedPortal(linkGuid) {
    if(c > 16) return;

    var key = this; // passed by Array.prototype.forEach
    var link = window.links[linkGuid].options.data;
    var guid = link[key + 'Guid'];
    var lat = link[key + 'LatE6']/1E6;
    var lng = link[key + 'LngE6']/1E6;

    var length = L.latLng(link.oLatE6/1E6, link.oLngE6/1E6).distanceTo([link.dLatE6/1E6, link.dLngE6/1E6]);
    var lengthFull = digits(Math.round(length)) + 'm';
    var lengthShort = length < 100000 ? lengthFull : digits(Math.round(length/1000)) + 'km'

    var div = $('<div>').addClass('showLinkedPortalLink showLinkedPortalLink' + c + (key=='d' ? ' outgoing' : ' incoming'));

    var title;

    var data = (portals[guid] && portals[guid].options.data) || portalDetail.get(guid) || null;
    if(data && data.title) {
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
          .html('Portal not loaded.<br>' + lengthShort));
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
          .append($('<br/>'))
          .append($('<span/>').html(lengthFull))
          .html(),
      })
      .appendTo('#showLinkedPortalContainer');

    c++;
  }

  portalLinks.out.forEach(renderLinkedPortal, 'd');
  portalLinks.in.forEach(renderLinkedPortal, 'o');

  if(length > 16) {
    $('<div>')
      .addClass('showLinkedPortalLink showLinkedPortalOverflow')
      .text(length-16 + ' more')
      .appendTo('#showLinkedPortalContainer');
  }

  $('#showLinkedPortalContainer')
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

  var remote = L.latLng(lat, lng);
  var local = portals[selectedPortal].getLatLng();

  plugin.showLinkedPortal.preview = L.layerGroup().addTo(map);

  L.circleMarker(remote, plugin.showLinkedPortal.previewOptions)
    .addTo(plugin.showLinkedPortal.preview);

  L.geodesicPolyline([local, remote], plugin.showLinkedPortal.previewOptions)
    .addTo(plugin.showLinkedPortal.preview);
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
  $('<style>').prop('type', 'text/css').html('@@INCLUDESTRING:plugins/show-linked-portals.css@@').appendTo('head');
}
// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
