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

  // details and data can get out of sync. if we have details, construct a matching 'data'
  if (details) {
    data = getPortalSummaryData(details);
  }


  var modDetails = details ? '<div class="mods">'+getModDetails(details)+'</div>' : '';
  var miscDetails = details ? getPortalMiscDetails(guid,details) : '';
  var resoDetails = details ? getResonatorDetails(details) : '';

//TODO? other status details...
  var statusDetails = details ? '' : '<div id="portalStatus">Loading details...</div>';
 

  var img = fixPortalImageUrl(details ? details.image : data.image);
  var title = data.title;

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
//    if(d.descriptiveText.map.ADDRESS) {
//      portalDetailedDescription += '<tr><th>Address:</th><td>' + escapeHtmlSpecialChars(d.descriptiveText.map.ADDRESS) + '</td></tr>';
//    }

    portalDetailedDescription += '</table>';
  }

  // portal level. start with basic data - then extend with fractional info in tooltip if available
  var levelInt = (teamStringToId(data.team) == TEAM_NONE) ? 0 : data.level;
  var levelDetails = levelInt;
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
    .attr('class', TEAM_TO_CSS[teamStringToId(data.team)])
    .append(
      $('<h3>').attr({class:'title'}).text(data.title),

      $('<span>').attr({
        class: 'close',
        title: 'Close [w]',
        onclick:'renderPortalDetails(null); if(isSmartphone()) show("map");',
        accesskey: 'w'
      }).text('X'),

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
    var linkInfo = getPortalLinks(guid);
    var linkCount = linkInfo.in.length + linkInfo.out.length;
    var links = {incoming: linkInfo.in.length, outgoing: linkInfo.out.length};

    function linkExpl(t) { return '<tt title="'+links.outgoing+' links out (8 max)\n'+links.incoming+' links in\n('+(links.outgoing+links.incoming)+' total)">'+t+'</tt>'; }
    var linksText = [linkExpl('links'), linkExpl(links.outgoing+' out / '+links.incoming+' in')];

    var player = d.owner
      ? '<span class="nickname">' + d.owner + '</span>'
      : '-';
    var playerText = ['owner', player];


    var fieldCount = getPortalFieldsCount(guid);

    var fieldsText = ['fields', fieldCount];

    var apGainText = getAttackApGainText(d,fieldCount,linkCount);


    // collect and html-ify random data
    var randDetailsData = [];
    if (true) {  // or "if (d.owner) {" ...? but this makes the info panel look rather empty for unclaimed portals
      // these pieces of data are only relevant when the portal is captured
      randDetailsData.push (
        playerText, getRangeText(d),
        linksText, fieldsText,
        getMitigationText(d,linkCount), getEnergyText(d)
      );
    }

    // and these have some use, even for uncaptured portals
    randDetailsData.push (
      apGainText, getHackDetailsText(d)
    );

    // artifact details

    // 2014-02-06: stock site changed from supporting 'jarvis shards' to 'amar artifacts'(?) - so let's see what we can do to be generic...
    $.each(artifact.getArtifactTypes(),function(index,type) {
      var artdata = artifact.getPortalData (guid, type);
      if (artdata) {
        var details = artifact.getArtifactDescriptions(type);
        if (details) {
          // the genFourColumnTable function below doesn't handle cases where one column is null and the other isn't - so default to *something* in both columns
          var target = ['',''], shards = [details.fragmentName,'(none)'];
          if (artdata.target) {
            target = ['target', '<span class="'+TEAM_TO_CSS[artdata.target]+'">'+(artdata.target==TEAM_RES?'Resistance':'Enlightened')+'</span>'];
          }
          if (artdata.fragments) {
            shards = [details.fragmentName, '#'+artdata.fragments.join(', #')];
          }

          randDetailsData.push (target, shards);
        } else {
          console.warn('Unknown artifact type '+type+': no names, so cannot display');
        }
      }
    });

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
