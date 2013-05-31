// PORTAL DETAILS MAIN ///////////////////////////////////////////////
// main code block that renders the portal details in the sidebar and
// methods that highlight the portal in the map view.

window.renderPortalDetails = function(guid) {
  if(!window.portals[guid]) {
    unselectOldPortal();
    urlPortal = guid;
    return;
  }

  var d = window.portals[guid].options.details;

  selectPortal(guid);

  // collect some random data that’s not worth to put in an own method
  var links = {incoming: 0, outgoing: 0};
  if(d.portalV2.linkedEdges) $.each(d.portalV2.linkedEdges, function(ind, link) {
    links[link.isOrigin ? 'outgoing' : 'incoming']++;
  });
  function linkExpl(t) { return '<tt title="↳ incoming links\n↴ outgoing links\n• is the portal">'+t+'</tt>'; }
  var linksText = [linkExpl('links'), linkExpl(' ↳ ' + links.incoming+'&nbsp;&nbsp;•&nbsp;&nbsp;'+links.outgoing+' ↴')];

  var player = d.captured && d.captured.capturingPlayerId
    ? '<span class="nickname">' + getPlayerName(d.captured.capturingPlayerId) + '</span>'
    : null;
  var playerText = player ? ['owner', player] : null;

  var time = d.captured
    ? '<span title="' + unixTimeToDateTimeString(d.captured.capturedTime, false) + '">'
      +  unixTimeToString(d.captured.capturedTime) + '</span>'
    : null;
  var sinceText  = time ? ['since', time] : null;

  var linkedFields = ['fields', d.portalV2.linkedFields.length];

  // collect and html-ify random data
  var randDetails = [
    playerText, sinceText, getRangeText(d), getEnergyText(d),
    linksText, getAvgResoDistText(d), linkedFields, getAttackApGainText(d)
  ];
  randDetails = '<table id="randdetails">' + genFourColumnTable(randDetails) + '</table>';

  var resoDetails = '<table id="resodetails">' + getResonatorDetails(d) + '</table>';

  setPortalIndicators(d);
  var img = d.imageByUrl.imageUrl;
  var lat = d.locationE6.latE6/1E6;
  var lng = d.locationE6.lngE6/1E6;
  var perma = '/intel?ll='+lat+','+lng+'&z=17&pll='+lat+','+lng;
  var imgTitle = 'title="'+getPortalDescriptionFromDetails(d)+'\n\nClick to show full image."';
  var poslinks = 'window.showPortalPosLinks('+lat+','+lng+',\''+escapeJavascriptString(d.portalV2.descriptiveText.TITLE)+'\')';

  $('#portaldetails')
    .attr('class', TEAM_TO_CSS[getTeam(d)])
    .html(''
      + '<h3 class="title">'+escapeHtmlSpecialChars(d.portalV2.descriptiveText.TITLE)+'</h3>'
      + '<span class="close" onclick="unselectOldPortal();" title="Close">X</span>'
      // help cursor via ".imgpreview img"
      + '<div class="imgpreview" '+imgTitle+' style="background-image: url('+img+')">'
      + '<img class="hide" src="'+img+'"/>'
      + '<span id="level">'+Math.floor(getPortalLevel(d))+'</span>'
      + '</div>'
      + '<div class="mods">'+getModDetails(d)+'</div>'
      + randDetails
      + resoDetails
      + '<div class="linkdetails">'
      + '<aside><a href="'+perma+'" onclick="return androidCopy(this.href)" title="Create a URL link to this portal" >Portal link</a></aside>'
      + '<aside><a onclick="'+poslinks+'" title="Link to alternative maps (Google, etc)">Map links</a></aside>'
      + '<aside><a onclick="window.reportPortalIssue()" title="Report issues with this portal to Niantic/Google">Report issue</a></aside>'
      + '</div>'
    );

  // try to resolve names that were required for above functions, but
  // weren't available yet.
  resolvePlayerNames();

  runHooks('portalDetailsUpdated', {portalDetails: d});
}

// draws link-range and hack-range circles around the portal with the
// given details.
window.setPortalIndicators = function(d) {
  if(portalRangeIndicator) map.removeLayer(portalRangeIndicator);
  var range = getPortalRange(d);
  var coord = [d.locationE6.latE6/1E6, d.locationE6.lngE6/1E6];
  portalRangeIndicator = (range > 0
      ? L.circle(coord, range, { fill: false, color: RANGE_INDICATOR_COLOR, weight: 3, clickable: false })
      : L.circle(coord, range, { fill: false, stroke: false, clickable: false })
    ).addTo(map);
  if(!portalAccessIndicator)
    portalAccessIndicator = L.circle(coord, HACK_RANGE,
      { fill: false, color: ACCESS_INDICATOR_COLOR, weight: 2, clickable: false }
    ).addTo(map);
  else
    portalAccessIndicator.setLatLng(coord);
}

window.clearPortalIndicators = function() {
  if(portalRangeIndicator) map.removeLayer(portalRangeIndicator);
  portalRangeIndicator = null;
  if(portalAccessIndicator) map.removeLayer(portalAccessIndicator);
  portalAccessIndicator = null;
}


// highlights portal with given GUID. Automatically clears highlights
// on old selection. Returns false if the selected portal changed.
// Returns true if it's still the same portal that just needs an
// update.
window.selectPortal = function(guid) {
  var update = selectedPortal === guid;
  var oldPortal = portals[selectedPortal];
  if(!update && oldPortal) portalResetColor(oldPortal);

  selectedPortal = guid;

  if(portals[guid]) {
    resonatorsSetSelectStyle(guid);
    portals[guid].bringToFront().setStyle({color: COLOR_SELECTED_PORTAL});
  }

  return update;
}


window.unselectOldPortal = function() {
  var oldPortal = portals[selectedPortal];
  if(oldPortal) portalResetColor(oldPortal);
  selectedPortal = null;
  $('#portaldetails').html('');
  clearPortalIndicators();
}
