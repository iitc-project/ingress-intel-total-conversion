// PORTAL DETAILS MAIN ///////////////////////////////////////////////
// main code block that renders the portal details in the sidebar and
// methods that highlight the portal in the map view.

window.renderPortalDetails = function(guid) {
  selectPortal(window.portals[guid] ? guid : null);

  if (guid && !portalDetail.isFresh(guid)) {
    portalDetail.request(guid);
  }

  // TODO? handle the case where we request data for a particular portal GUID, but it *isn't* in
  // window.portals....

  if(!window.portals[guid]) {
    urlPortal = guid;
    $('#portaldetails').html('');
    if(isSmartphone()) {
      $('.fullimg').remove();
      $('#mobileinfo').html('<div style="text-align: center"><b>tap here for info screen</b></div>');
    }
    return;
  }

  var portal = window.portals[guid];
  var data = portal.options.data;
  var details = portalDetail.get(guid);


  var modDetails = details ? '<div class="mods">'+getModDetails(details)+'</div>' : '';
  var miscDetails = details ? getPortalMiscDetails(guid,details) : '';
  var resoDetails = details ? getResonatorDetails(details) : '';

//TODO? other status details...
  var statusDetails = details ? '' : '<div id="portalStatus">Loading details...</div>';
 

  var img = fixPortalImageUrl(details ? details.imageByUrl && details.imageByUrl.imageUrl : data.image);
  var title = details ? details.portalV2.descriptiveText.TITLE : data.title;

  var lat = data.latE6/1E6;
  var lng = data.lngE6/1E6;

  var imgTitle = details ? getPortalDescriptionFromDetails(details) : data.title;
  imgTitle += '\n\nClick to show full image.';
  var portalDetailObj = details ? window.getPortalDescriptionFromDetailsExtended(details) : undefined;

  var portalDetailedDescription = '';

  if(portalDetailObj) {
    portalDetailedDescription = '<table description="Portal Photo Details" class="portal_details">';

    // TODO (once the data supports it) - portals can have multiple photos. display all, with navigation between them
    // (at this time the data isn't returned from the server - although a count of images IS returned!)

    if(portalDetailObj.submitter.name.length > 0) {
      if(portalDetailObj.submitter.team) {
        submitterSpan = '<span class="' + (portalDetailObj.submitter.team === 'RESISTANCE' ? 'res' : 'enl') + ' nickname">';
      } else {
        submitterSpan = '<span class="none">';
      }
      portalDetailedDescription += '<tr><th>Photo by:</th><td>' + submitterSpan
                                + escapeHtmlSpecialChars(portalDetailObj.submitter.name) + '</span>'+(portalDetailObj.submitter.voteCount !== undefined ? ' (' + portalDetailObj.submitter.voteCount + ' votes)' : '')+'</td></tr>';
    }
    if(portalDetailObj.submitter.link.length > 0) {
      portalDetailedDescription += '<tr><th>Photo from:</th><td><a href="'
                                + escapeHtmlSpecialChars(portalDetailObj.submitter.link) + '">' + escapeHtmlSpecialChars(portalDetailObj.submitter.link) + '</a></td></tr>';
    }

    if(portalDetailObj.description) {
      portalDetailedDescription += '<tr class="padding-top"><th>Description:</th><td>' + escapeHtmlSpecialChars(portalDetailObj.description) + '</td></tr>';
    }
//    if(d.portalV2.descriptiveText.ADDRESS) {
//      portalDetailedDescription += '<tr><th>Address:</th><td>' + escapeHtmlSpecialChars(d.portalV2.descriptiveText.ADDRESS) + '</td></tr>';
//    }

    portalDetailedDescription += '</table>';
  }

  // portal level. start with basic data - then extend with fractional info in tooltip if available
  var levelInt = data ? data.level : getPortalLevel(details);
  var levelDetails = data.level;
  if (details) {
    levelDetails = getPortalLevel(details);
    if(levelDetails != 8) {
      if(levelDetails==Math.ceil(levelDetails))
        levelDetails += "\n8";
      else
        levelDetails += "\n" + (Math.ceil(levelDetails) - levelDetails)*8;
      levelDetails += " resonator level(s) needed for next portal level";
    } else {
      levelDetails += "\nfully upgraded";
    }
  }
  levelDetails = "Level " + levelDetails;


  var linkDetails = [];

  var posOnClick = 'window.showPortalPosLinks('+lat+','+lng+',\''+escapeJavascriptString(title)+'\')';
  var permalinkUrl = '/intel?ll='+lat+','+lng+'&z=17&pll='+lat+','+lng;

  if (typeof android !== 'undefined' && android && android.intentPosLink) {
    // android devices. one share link option - and the android app provides an interface to share the URL,
    // share as a geo: intent (navigation via google maps), etc

    var shareLink = $('<div>').html( $('<a>').attr({onclick:posOnClick}).text('Share portal') ).html();
    linkDetails.push('<aside>'+shareLink+'</aside>');

  } else {
    // non-android - a permalink for the portal
    var permaHtml = $('<div>').html( $('<a>').attr({href:permalinkUrl, title:'Create a URL link to this portal'}).text('Portal link') ).html();
    linkDetails.push ( '<aside>'+permaHtml+'</aside>' );

    // and a map link popup dialog
    var mapHtml = $('<div>').html( $('<a>').attr({onclick:posOnClick, title:'Link to alternative maps (Google, etc)'}).text('Map links') ).html();
    linkDetails.push('<aside>'+mapHtml+'</aside>');

  }

  $('#portaldetails')
    .html('') //to ensure it's clear
    .attr('class', TEAM_TO_CSS[portal.options.team])
    .append(
      $('<h3>').attr({class:'title'}).text(data.title),

      $('<span>').attr({class:'close', onclick:'renderPortalDetails(null); if(isSmartphone()) show("map");',title:'Close'}).text('X'),

      // help cursor via ".imgpreview img"
      $('<div>')
      .attr({class:'imgpreview', title:imgTitle, style:"background-image: url('"+img+"')"})
      .append(
        $('<span>').attr({id:'level', title: levelDetails}).text(levelInt),
        $('<div>').attr({class:'portalDetails'}).html(portalDetailedDescription),
        $('<img>').attr({class:'hide', src:img})
      ),

      modDetails,
      miscDetails,
      resoDetails,
      statusDetails,
      '<div class="linkdetails">' + linkDetails.join('') + '</div>'
    );

  // only run the hooks when we have a portalDetails object - most plugins rely on the extended data
  // TODO? another hook to call always, for any plugins that can work with less data?
  if (details) {
    runHooks('portalDetailsUpdated', {guid: guid, portal: portal, portalDetails: details, portalData: data});
  }
}



window.getPortalMiscDetails = function(guid,d) {

  var randDetails;

  if (d) {

    // collect some random data that’s not worth to put in an own method
    var links = {incoming: 0, outgoing: 0};
    $.each(d.portalV2.linkedEdges||[], function(ind, link) {
      links[link.isOrigin ? 'outgoing' : 'incoming']++;
    });

    function linkExpl(t) { return '<tt title="↳ incoming links\n↴ outgoing links\n• is the portal">'+t+'</tt>'; }
    var linksText = [linkExpl('links'), linkExpl(' ↳ ' + links.incoming+'&nbsp;&nbsp;•&nbsp;&nbsp;'+links.outgoing+' ↴')];

    var player = d.captured && d.captured.capturingPlayerId
      ? '<span class="nickname">' + d.captured.capturingPlayerId + '</span>'
      : null;
    var playerText = player ? ['owner', player] : null;

    var time = d.captured
      ? '<span title="' + unixTimeToDateTimeString(d.captured.capturedTime, false) + '\n'
                        + formatInterval(Math.floor((Date.now()-d.captured.capturedTime)/1000), 2) + ' ago">'
        +  unixTimeToString(d.captured.capturedTime) + '</span>'
      : null;
    var sinceText  = time ? ['since', time] : null;

    var linkedFields = ['fields', getPortalFields(guid).length];

    // collect and html-ify random data
    var randDetailsData = [];
    if (playerText && sinceText) {
      randDetailsData.push (playerText, sinceText);
    }

    randDetailsData.push (
      getRangeText(d), getEnergyText(d),
      linksText, getAvgResoDistText(d),
      linkedFields, getAttackApGainText(d),
      getHackDetailsText(d), getMitigationText(d)
    );

    // artifact details

    //niantic hard-code the fact it's just jarvis shards/targets - so until more examples exist, we'll do the same
    //(at some future point we can iterate through all the artifact types and add rows as needed)
    var jarvisArtifact = artifact.getPortalData (guid, 'jarvis');
    if (jarvisArtifact) {
      // the genFourColumnTable function below doesn't handle cases where one column is null and the other isn't - so default to *something* in both columns
      var target = ['',''], shards = ['shards','(none)'];
      if (jarvisArtifact.target) {
        target = ['target', '<span class="'+TEAM_TO_CSS[jarvisArtifact.target]+'">'+(jarvisArtifact.target==TEAM_RES?'Resistance':'Enlightened')+'</span>'];
      }
      if (jarvisArtifact.fragments) {
        shards = [jarvisArtifact.fragments.length>1?'shards':'shard', '#'+jarvisArtifact.fragments.join(', #')];
      }

      randDetailsData.push (target, shards);
    }

    randDetails = '<table id="randdetails">' + genFourColumnTable(randDetailsData) + '</table>';

  }

  return randDetails;
}


// draws link-range and hack-range circles around the portal with the
// given details. Clear them if parameter 'd' is null.
window.setPortalIndicators = function(p) {

  if(portalRangeIndicator) map.removeLayer(portalRangeIndicator);
  portalRangeIndicator = null;
  if(portalAccessIndicator) map.removeLayer(portalAccessIndicator);
  portalAccessIndicator = null;

  // if we have a portal...

  if(p) {
    var coord = p.getLatLng();

    // range is only known for sure if we have portal details
    // TODO? render a min range guess until details are loaded..?

    var d = portalDetail.get(p.options.guid);
    if (d) {
      var range = getPortalRange(d);
      portalRangeIndicator = (range.range > 0
          ? L.geodesicCircle(coord, range.range, {
              fill: false,
              color: RANGE_INDICATOR_COLOR,
              weight: 3,
              dashArray: range.isLinkable ? undefined : "10,10",
              clickable: false })
          : L.circle(coord, range.range, { fill: false, stroke: false, clickable: false })
        ).addTo(map);
    }

    portalAccessIndicator = L.circle(coord, HACK_RANGE,
      { fill: false, color: ACCESS_INDICATOR_COLOR, weight: 2, clickable: false }
    ).addTo(map);
  }

}

// highlights portal with given GUID. Automatically clears highlights
// on old selection. Returns false if the selected portal changed.
// Returns true if it's still the same portal that just needs an
// update.
window.selectPortal = function(guid) {
  var update = selectedPortal === guid;
  var oldPortalGuid = selectedPortal;
  selectedPortal = guid;

  var oldPortal = portals[oldPortalGuid];
  var newPortal = portals[guid];

  // Restore style of unselected portal
  if(!update && oldPortal) setMarkerStyle(oldPortal,false);

  // Change style of selected portal
  if(newPortal) {
    setMarkerStyle(newPortal, true);

    if (map.hasLayer(newPortal)) {
      newPortal.bringToFront();
    }
  }

  setPortalIndicators(newPortal);

  runHooks('portalSelected', {selectedPortalGuid: guid, unselectedPortalGuid: oldPortalGuid});
  return update;
}
