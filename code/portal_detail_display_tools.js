// PORTAL DETAILS DISPLAY ////////////////////////////////////////////
// hand any of these functions the details-hash of a portal, and they
// will return pretty, displayable HTML or parts thereof.

// returns displayable text+link about portal range
window.getRangeText = function(d) {
  var range = getPortalRange(d);
  
  var title = 'Base range:\t' + digits(Math.floor(range.base))+'m'
    + '\nLink amp boost:\t×'+range.boost
    + '\nRange:\t'+digits(Math.floor(range.range))+'m';
  
  if(!range.isLinkable) title += '\nPortal is missing resonators,\nno new links can be made';
  
  return ['range',
      '<a onclick="window.rangeLinkClick()"'
    + (range.isLinkable ? '' : ' style="text-decoration:line-through;"')
    + ' title="'+title+'">'
    + (range.range > 1000
      ? Math.floor(range.range/1000) + ' km'
      : Math.floor(range.range)      + ' m')
    + '</a>'];
}

// generates description text from details for portal
window.getPortalDescriptionFromDetails = function(details) {
  return details.title || '(untitled)';

//  var descObj = details.descriptiveText.map;
//  // FIXME: also get real description?
//  var desc = descObj.TITLE;
//  if(descObj.ADDRESS)
//    desc += '\n' + descObj.ADDRESS;
////  if(descObj.ATTRIBUTION)
////    desc += '\nby '+descObj.ATTRIBUTION+' ('+descObj.ATTRIBUTION_LINK+')';
//  return desc;
}

// Grabs more info, including the submitter name for the current main
// portal image
window.getPortalDescriptionFromDetailsExtended = function(details) {
  var descObj = details.title;
  var photoStreamObj = details.photoStreamInfo;

  var submitterObj = new Object();
  submitterObj.type = "";
  submitterObj.name = "";
  submitterObj.team = "";
  submitterObj.link = "";
  submitterObj.voteCount = undefined;

  if(photoStreamObj && photoStreamObj.hasOwnProperty("coverPhoto") && photoStreamObj.coverPhoto.hasOwnProperty("attributionMarkup")) {
    submitterObj.name = "Unknown";

    var attribution = photoStreamObj.coverPhoto.attributionMarkup;
    submitterObj.type = attribution[0];
    if(attribution[1].hasOwnProperty("plain"))
      submitterObj.name = attribution[1].plain;
    if(attribution[1].hasOwnProperty("team"))
      submitterObj.team = attribution[1].team;
    if(attribution[1].hasOwnProperty("attributionLink"))
      submitterObj.link = attribution[1].attributionLink;
    if(photoStreamObj.coverPhoto.hasOwnProperty("voteCount"))
      submitterObj.voteCount = photoStreamObj.coverPhoto.voteCount;
  }


  var portalDetails = {
    title: descObj.TITLE,
    description: descObj.DESCRIPTION,
    address: descObj.ADDRESS,
    submitter: submitterObj
  };

  return portalDetails;
}


// given portal details, returns html code to display mod details.
window.getModDetails = function(d) {
  var mods = [];
  var modsTitle = [];
  var modsColor = [];
  $.each(d.mods, function(ind, mod) {
    var modName = '';
    var modTooltip = '';
    var modColor = '#000';

    if (mod) {
      // all mods seem to follow the same pattern for the data structure
      // but let's try and make this robust enough to handle possible future differences

      modName = mod.name || '(unknown mod)';

      if (mod.rarity) {
        modName = mod.rarity.capitalize().replace(/_/g,' ') + ' ' + modName;
      }

      modTooltip = modName + '\n';
      if (mod.owner) {
        modTooltip += 'Installed by: '+ mod.owner + '\n';
      }

      if (mod.stats) {
        modTooltip += 'Stats:';
        for (var key in mod.stats) {
          if (!mod.stats.hasOwnProperty(key)) continue;
          var val = mod.stats[key];

//          if (key === 'REMOVAL_STICKINESS' && val == 0) continue;  // stat on all mods recently - unknown meaning, not displayed in stock client

          // special formatting for known mod stats, where the display of the raw value is less useful
          if (key === 'HACK_SPEED') val = (val/10000)+'%'; // 500000 = 50%
          else if (key === 'FORCE_AMPLIFIER') val = (val/1000)+'x';  // 2000 = 2x
          else if (key === 'LINK_RANGE_MULTIPLIER') val = (val/1000)+'x' // 2000 = 2x
          else if (key === 'HIT_BONUS') val = (val/10000)+'%'; // 2000 = 0.2% (although this seems pretty small to be useful?)
          else if (key === 'ATTACK_FREQUENCY') val = (val/1000)+'x' // 2000 = 2x
          // else display unmodified. correct for shield mitigation and multihack - unknown for future/other mods

          modTooltip += '\n+' +  val + ' ' + key.capitalize().replace(/_/g,' ');
        }
      }

      if (mod.rarity) {
        modColor = COLORS_MOD[mod.rarity];
      } else {
        modColor = '#fff';
      }
    }

    mods.push(modName);
    modsTitle.push(modTooltip);
    modsColor.push(modColor);
  });


  var t = '';
  for (var i=0; i<mods.length; i++) {
    t += '<span'+(modsTitle[i].length ? ' title="'+modsTitle[i]+'"' : '')+' style="color:'+modsColor[i]+'">'+mods[i]+'</span>'
  }
  // and add blank entries if we have less than 4 mods (as the server no longer returns all mod slots, but just the filled ones)
  for (var i=mods.length; i<4; i++) {
    t += '<span style="color:#000"></span>'
  }

  return t;
}

window.getEnergyText = function(d) {
  var currentNrg = getCurrentPortalEnergy(d);
  var totalNrg = getTotalPortalEnergy(d);
  var inf = currentNrg + ' / ' + totalNrg;
  var fill = prettyEnergy(currentNrg) + ' / ' + prettyEnergy(totalNrg)
  return ['energy', '<tt title="'+inf+'">' + fill + '</tt>'];
}


window.getResonatorDetails = function(d) {
  var resoDetails = [];
  // octant=slot: 0=E, 1=NE, 2=N, 3=NW, 4=W, 5=SW, 6=S, SE=7
  // resos in the display should be ordered like this:
  //   N    NE         Since the view is displayed in rows, they
  //  NW    E          need to be ordered like this: N NE NW E W SE SW S
  //   W    SE         i.e. 2 1 3 0 4 7 5 6
  //  SW    S
  // note: as of 2014-05-23 update, this is not true for portals with empty slots!

  var processResonatorSlot = function(reso,slot) {
    var lvl=0, nrg=0, owner=null;

    if (reso) {
      lvl = parseInt(reso.level);
      nrg = parseInt(reso.energy);
      owner = reso.owner;
    }

    resoDetails.push(renderResonatorDetails(slot, lvl, nrg, owner));
  };


  // if all 8 resonators are deployed, we know which is in which slot

  if (d.resonators.length == 8) {
    // fully deployed - we can make assumptions about deployment slots
    $.each([2, 1, 3, 0, 4, 7, 5, 6], function(ind, slot) {
      processResonatorSlot(d.resonators[slot],slot);
    });
  } else {
    // partially deployed portal - we can no longer find out which resonator is in which slot
    for(var ind=0; ind<8; ind++) {
      processResonatorSlot(ind < d.resonators.length ? d.resonators[ind] : null, null);
    }

  }

  return '<table id="resodetails">' + genFourColumnTable(resoDetails) + '</table>';

}

// helper function that renders the HTML for a given resonator. Does
// not work with raw details-hash. Needs digested infos instead:
// slot: which slot this resonator occupies. Starts with 0 (east) and
// rotates clockwise. So, last one is 7 (southeast).
window.renderResonatorDetails = function(slot, level, nrg, nick) {
  if(OCTANTS[slot] === 'N')
    var className = 'meter north';
  else
    var className = 'meter';

  var max = RESO_NRG[level];
  var fillGrade = level > 0 ? nrg/max*100 : 0;

  var inf = (level > 0 ? 'energy:\t' + nrg   + ' / ' + max + ' (' + Math.round(fillGrade) + '%)\n'
                        +'level:\t'  + level + '\n'
                        +'owner:\t'  + nick  + '\n'
                       : '')
          + (slot !== null ? 'octant:\t' + OCTANTS[slot] + ' ' + OCTANTS_ARROW[slot]:'');

  var style = fillGrade ? 'width:'+fillGrade+'%; background:'+COLORS_LVL[level]+';':'';

  var color = (level < 3 ? "#9900FF" : "#FFFFFF");

  var lbar = level > 0 ? '<span class="meter-level" style="color: ' + color + ';"> L ' + level + ' </span>' : '';

  var fill  = '<span style="'+style+'"></span>';

  var meter = '<span class="' + className + '" title="'+inf+'">' + fill + lbar + '</span>';

  nick = nick ? '<span class="nickname">'+nick+'</span>' : null;
  return [meter, nick || ''];
}

// calculate AP gain from destroying portal and then capturing it by deploying resonators
window.getAttackApGainText = function(d,fieldCount,linkCount) {
  var breakdown = getAttackApGain(d,fieldCount,linkCount);
  var totalGain = breakdown.enemyAp;

  function tt(text) {
    var t = '';
    if (PLAYER.team == d.team) {
      totalGain = breakdown.friendlyAp;
      t += 'Friendly AP:\t' + breakdown.friendlyAp + '\n';
      t += '  Deploy ' + breakdown.deployCount + ', ';
      t += 'Upgrade ' + breakdown.upgradeCount + '\n';
      t += '\n';
    }
    t += 'Enemy AP:\t' + breakdown.enemyAp + '\n';
    t += '  Destroy AP:\t' + breakdown.destroyAp + '\n';
    t += '  Capture AP:\t' + breakdown.captureAp + '\n';
    return '<tt title="' + t + '">' + text + '</tt>';
  }

  return [tt('AP Gain'), tt(digits(totalGain))];
}


window.getHackDetailsText = function(d) {
  var hackDetails = getPortalHackDetails(d);

  var shortHackInfo = hackDetails.hacks+' @ '+formatInterval(hackDetails.cooldown);

  function tt(text) {
    var t = 'Hacks available every 4 hours\n';
    t += 'Hack count:\t'+hackDetails.hacks+'\n';
    t += 'Cooldown time:\t'+formatInterval(hackDetails.cooldown)+'\n';
    t += 'Burnout time:\t'+formatInterval(hackDetails.burnout)+'\n';

    return '<span title="'+t+'">'+text+'</span>';
  }

  return [tt('hacks'), tt(shortHackInfo)];
}


window.getMitigationText = function(d,linkCount) {
  var mitigationDetails = getPortalMitigationDetails(d,linkCount);

  var mitigationShort = mitigationDetails.total;
  if (mitigationDetails.excess) mitigationShort += ' (+'+mitigationDetails.excess+')';

  function tt(text) {
    var t = 'Total shielding:\t'+(mitigationDetails.shields+mitigationDetails.links)+'\n'
          + '- active:\t'+mitigationDetails.total+'\n'
          + '- excess:\t'+mitigationDetails.excess+'\n'
          + 'From\n'
          + '- shields:\t'+mitigationDetails.shields+'\n'
          + '- links:\t'+mitigationDetails.links;

    return '<span title="'+t+'">'+text+'</span>';
  }

  return [tt('shielding'), tt(mitigationShort)];
}
