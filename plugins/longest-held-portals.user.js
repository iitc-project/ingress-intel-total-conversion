// ==UserScript==
// @id             iitc-plugin-longest-held-portals@nickspoon
// @name           IITC plugin: Display the 10 longest-held portals
// @category       Info
// @version        0.1.2.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Display the 10 longest-held portals currently on screen
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

window.plugin.longestHeldPortals = function() {};

window.plugin.longestHeldPortals.display = function() {
  var owned_portals = [];
  $.each(window.portals, function(guid,p) {
    if(p.options && p.options.details && p.options.details.captured) {
      var pod = p.options.details;
      owned_portals.push({
        date: pod.captured.capturedTime,
        title: pod.portalV2.descriptiveText.TITLE,
        owner: getPlayerName(pod.captured.capturingPlayerId),
        guid: guid,
        coords: [ pod.locationE6.latE6 / 1000000, pod.locationE6.lngE6 / 1000000 ]
      });
    }
  });
  owned_portals.sort(function(a,b) {return a.date-b.date;});
  var message = $('<div>');
  $.each(owned_portals.slice(0, 10), function(i,op) {
    message.append(
      $('<div style="white-space: nowrap;">')
        .append($('<span>').text(unixTimeToString(op.date)))
        .append('&nbsp;')
        .append($('<a>').text(op.title).click(function() {
          $(window.isSmartphone() ? '#dialog-modal' : '#dialog-oldest-portals')
            .dialog('close');
          window.zoomToAndShowPortal(op.guid, op.coords);
        }))
        .append('&nbsp;')
        .append($('<span>').text('[' + op.owner + ']')));
  });
  window.dialog({html: message, title: '10 longest-held portals:', id: 'oldest-portals'});
};

var setup =  function() {
  $('#toolbox')
    .append($('<a id="old_portals">Oldest portals</a>')
      .click(window.plugin.longestHeldPortals.display));
  if(!window.isSmartphone())
    $('#toolbox #old_portals')
      .attr('title', 'Show a list of the longest-held portals');
};

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
