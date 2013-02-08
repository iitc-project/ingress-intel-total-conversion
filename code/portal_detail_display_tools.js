
// PORTAL DETAILS DISPLAY ////////////////////////////////////////////
// hand any of these functions the details-hash of a portal, and they
// will return pretty, displayable HTML or parts thereof.

// returns displayable text+link about portal range
window.getRangeText = function(d) {
  var range = getPortalRange(d);
  return 'range: '
    + '<a onclick="window.rangeLinkClick()">'
    + (range > 1000
      ? Math.round(range/1000) + ' km'
      : Math.round(range)      + ' m')
    + '</a>';
}

// generates description text from details for portal
window.getPortalDescriptionFromDetails = function(details) {
  var descObj = details.portalV2.descriptiveText;
  // FIXME: also get real description?
  var desc = descObj.TITLE + '\n' + descObj.ADDRESS;
  if(descObj.ATTRIBUTION)
    desc += '\nby '+descObj.ATTRIBUTION+' ('+descObj.ATTRIBUTION_LINK+')';
  return desc;
}


// given portal details, returns html code to display mod details.
window.getModDetails = function(d) {
  var mods = [];
  var modsTitle = [];
  $.each(d.portalV2.linkedModArray, function(ind, mod) {
    if(!mod) {
      mods.push('');
      modsTitle.push('');
    } else if(mod.type === 'RES_SHIELD') {

      var title = mod.rarity.capitalize() + ' ' + mod.displayName + '\n';
      title += 'Installed by: '+ getPlayerName(mod.installingUser);

      title += '\nStats:';
      for (var key in mod.stats) {
        if (mod.stats.hasOwnProperty(key)) {
          title += '\n+' +  mod.stats[key] + ' ' + key.capitalize();
        }
      }

      mods.push(mod.rarity.capitalize() + ' ' + mod.displayName);
      modsTitle.push(title);
    } else {
      mods.push(mod.type);
      modsTitle.push('Unknown mod. No further details available.');
    }
  });

  var t = '<span title="'+modsTitle[0]+'">'+mods[0]+'</span>'
        + '<span title="'+modsTitle[1]+'">'+mods[1]+'</span>'
        + '<span title="'+modsTitle[2]+'">'+mods[2]+'</span>'
        + '<span title="'+modsTitle[3]+'">'+mods[3]+'</span>'

  return t;
}

window.getEnergyText = function(d) {
  var nrg = getPortalEnergy(d);
  return 'energy: ' + (nrg > 1000 ? Math.round(nrg/1000) +' k': nrg);
}

window.getAvgResoDistText = function(d) {
  var avgDist = Math.round(10*getAvgResoDist(d))/10;
  return '⌀ res dist: ' + avgDist + ' m';
}

window.getReportIssueInfoText = function(d) {
  return ('Your Nick: '+PLAYER.nickname+'        '
    + 'Portal: '+d.portalV2.descriptiveText.TITLE+'        '
    + 'Location: '+d.portalV2.descriptiveText.ADDRESS
    +' (lat '+(d.locationE6.latE6/1E6)+'; lng '+(d.locationE6.lngE6/1E6)+')'
  ).replace(/['"]/, '');
}

window.getResonatorDetails = function(d) {
  console.log('rendering reso details');
  var resoDetails = '';
  var slotsFilled = 0;
  $.each(d.resonatorArray.resonators, function(ind, reso) {
    if(!reso) {
      resoDetails += renderResonatorDetails(slotsFilled++, 0);
      return true;
    }

    var l = parseInt(reso.level);
    var v = parseInt(reso.energyTotal);
    var nick = window.getPlayerName(reso.ownerGuid);
    var dist = reso.distanceToPortal;

    slotsFilled++;
    resoDetails += renderResonatorDetails(parseInt(reso.slot), l, v, dist, nick);
  });
  return resoDetails;
}

// helper function that renders the HTML for a given resonator. Does
// not work with raw details-hash. Needs digested infos instead:
// slot: which slot this resonator occupies. Starts with 0 (east) and
// rotates clockwise. So, last one is 7 (southeast).
window.renderResonatorDetails = function(slot, level, nrg, dist, nick) {
  if(level == 0) {
    var meter = '<span class="meter" style="cursor:auto"></span>';
  } else {
    var max = RESO_NRG[level];
    var fillGrade = nrg/max*100;

    var inf = 'energy:\t\t' + nrg   + ' / ' + max + '\n'
            + 'level:\t\t'  + level +'\n'
            + 'distance:\t' + dist  + 'm\n'
            + 'owner:\t\t'  + nick  + '\n'
            + 'cardinal:\t' + SLOT_TO_CARDINAL[slot];


    var style = 'width:'+fillGrade+'%; background:'+COLORS_LVL[level]+'; color:'+COLORS_LVL[level];

    var lbar = '<div style="position: absolute; top: -2px; left: 25px; color: white;"> ' + level + ' </div>';

    var fill  = '<span style="'+style+'"></span>';

    var meter = '<span style="position: relative; left: 0; top: 0;" class="meter" title="'+inf+'">'
                   + fill + lbar + '</span>';
  }
  var cls = slot <= 3 ? 'left' : 'right';
  var text = '<span class="meter-text '+cls+'">'+(nick||'')+'</span>';
  return (slot <= 3 ? text+meter : meter+text) + '<br/>';
}
