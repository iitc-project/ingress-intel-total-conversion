// ==UserScript==
// @id             iitc-plugin-show-linked-portals@fstopienski
// @name           IITC plugin: Show linked portals
// @category       Portal Info
// @version        0.3.1.20181101.60209
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      none
// @downloadURL    none
// @description    [mobile-2018-11-01-060209] Try to show the linked portals (image, name and link direction) in portal detail view and jump to linked portal on click.  Some details may not be available if the linked portal is not in the current view.
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @include        https://*.ingress.com/mission/*
// @include        http://*.ingress.com/mission/*
// @match          https://*.ingress.com/mission/*
// @match          http://*.ingress.com/mission/*
// @grant          none
// ==/UserScript==


function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

//PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
//(leaving them in place might break the 'About IITC' page or break update checks)
plugin_info.buildName = 'mobile';
plugin_info.dateTimeVersion = '20181101.60209';
plugin_info.pluginId = 'show-linked-portals';
//END PLUGIN AUTHORS NOTE



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
  $('<style>').prop('type', 'text/css').html('#level {\n	text-align: center;\n	margin-right: -0.5em;\n	position: relative;\n	right: 50%;\n	width: 1em;\n}\n.showLinkedPortalLink {\n	cursor: pointer;\n	position: absolute;\n	height: 40px;\n	width: 50px;\n	border-width: 1px;\n	overflow: hidden;\n	text-align: center;\n	background: #0e3d4e;\n}\n.showLinkedPortalLink.outgoing {\n	border-style: dashed;\n}\n.showLinkedPortalLink.incoming {\n	border-style: dotted;\n}\n.showLinkedPortalLink .minImg {\n	height: 40px;\n}\n.showLinkedPortalLink.outOfRange span {\n	display: block;\n	line-height: 13px;\n	font-size: 10px;\n}\n.showLinkedPortalOverflow {\n	left: 50%;\n	margin-left:-25px;\n	cursor: default;\n}\n\n.showLinkedPortalLink1, .showLinkedPortalLink2, .showLinkedPortalLink3, .showLinkedPortalLink4 {\n	left: 5px;\n}\n.showLinkedPortalLink5, .showLinkedPortalLink6, .showLinkedPortalLink7, .showLinkedPortalLink8 {\n	right: 5px;\n}\n.showLinkedPortalLink9, .showLinkedPortalLink10, .showLinkedPortalLink11, .showLinkedPortalLink12 {\n	left: 59px;\n}\n.showLinkedPortalLink13, .showLinkedPortalLink14, .showLinkedPortalLink15, .showLinkedPortalLink16 {\n	right: 59px\n}\n\n.showLinkedPortalLink1, .showLinkedPortalLink5, .showLinkedPortalLink9, .showLinkedPortalLink13 {\n	top: 23px;\n}\n.showLinkedPortalLink2, .showLinkedPortalLink6, .showLinkedPortalLink10, .showLinkedPortalLink14 {\n	top: 72px;\n}\n.showLinkedPortalLink3, .showLinkedPortalLink7, .showLinkedPortalLink11, .showLinkedPortalLink15 {\n	top: 122px;\n}\n.showLinkedPortalLink4, .showLinkedPortalLink8, .showLinkedPortalLink12, .showLinkedPortalLink16,\n.showLinkedPortalOverflow {\n	top: 171px;\n}\n\n').appendTo('head');
}
// PLUGIN END //////////////////////////////////////////////////////////


setup.info = plugin_info; //add the script info data to the function as a property
if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);


