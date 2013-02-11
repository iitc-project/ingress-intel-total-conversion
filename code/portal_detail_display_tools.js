
// PORTAL DETAILS DISPLAY ////////////////////////////////////////////
// hand any of these functions the details-hash of a portal, and they
// will return pretty, displayable HTML or parts thereof.

// returns displayable text+link about portal range
window.getRangeText = function(d) {
  var range = getPortalRange(d);
  return ['range',
      '<a onclick="window.rangeLinkClick()">'
    + (range > 1000
      ? Math.round(range/1000) + ' km'
      : Math.round(range)      + ' m')
    + '</a>'];
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
  var modsColor = [];
  $.each(d.portalV2.linkedModArray, function(ind, mod) {
    if(!mod) {
      mods.push('');
      modsTitle.push('');
      modsColor.push('#000');
    } else if(mod.type === 'RES_SHIELD') {

      var title = mod.rarity.capitalize() + ' ' + mod.displayName + '\n';
      title += 'Installed by: '+ getPlayerName(mod.installingUser);

      title += '\nStats:';
      for (var key in mod.stats) {
        if (!mod.stats.hasOwnProperty(key)) continue;
        title += '\n+' +  mod.stats[key] + ' ' + key.capitalize();
      }

      mods.push(mod.rarity.capitalize().replace('_', ' ') + ' ' + mod.displayName);
      modsTitle.push(title);
      modsColor.push(COLORS_MOD[mod.rarity]);
    } else {
      mods.push(mod.type);
      modsTitle.push('Unknown mod. No further details available.');
      modsColor.push('#FFF');
    }
  });

  var t = '<span title="'+modsTitle[0]+'" style="color:'+modsColor[0]+'">'+mods[0]+'</span>'
        + '<span title="'+modsTitle[1]+'" style="color:'+modsColor[1]+'">'+mods[1]+'</span>'
        + '<span title="'+modsTitle[2]+'" style="color:'+modsColor[2]+'">'+mods[2]+'</span>'
        + '<span title="'+modsTitle[3]+'" style="color:'+modsColor[3]+'">'+mods[3]+'</span>'

  return t;
}

window.getEnergyText = function(d) {
  var currentNrg = getCurrentPortalEnergy(d);
  var totalNrg = getTotalPortalEnergy(d);
  var inf = currentNrg + ' / ' + totalNrg;
  var fill = prettyEnergy(currentNrg) + ' / ' + prettyEnergy(totalNrg)
  return ['energy', '<tt title="'+inf+'">' + fill + '</tt>'];
}

window.getAvgResoDistText = function(d) {
  var avgDist = Math.round(10*getAvgResoDist(d))/10;
  return ['⌀ res dist', avgDist + ' m'];
}

window.getResonatorDetails = function(d) {
  var resoDetails = '';
  // octant=slot: 0=E, 1=NE, 2=N, 3=NW, 4=W, 5=SW, 6=S, SE=7
  // resos in the display should be ordered like this:
  //   N    NE         Since the view is displayed in columns, they
  //  NW    E          need to be ordered like this: N, NW, W, SW, NE,
  //   W    SE         E, SE, S, i.e. 2 3 4 5 1 0 7 6
  //  SW    S
  $.each([2, 3, 4, 5, 1, 0, 7, 6], function(ind, slot) {
    var isLeft = slot >= 2 && slot <= 5;
    var reso = d.resonatorArray.resonators[slot];
    if(!reso) {
      resoDetails += renderResonatorDetails(slot, 0, 0, null, null, isLeft);
      return true;
    }

    var l = parseInt(reso.level);
    var v = parseInt(reso.energyTotal);
    var nick = window.getPlayerName(reso.ownerGuid);
    var dist = reso.distanceToPortal;
    // if array order and slot order drift apart, at least the octant
    // naming will still be correct.
    slot = parseInt(reso.slot);

    resoDetails += renderResonatorDetails(slot, l, v, dist, nick, isLeft);
  });
  return resoDetails;
}

// helper function that renders the HTML for a given resonator. Does
// not work with raw details-hash. Needs digested infos instead:
// slot: which slot this resonator occupies. Starts with 0 (east) and
// rotates clockwise. So, last one is 7 (southeast).
window.renderResonatorDetails = function(slot, level, nrg, dist, nick, isLeft) {
  if(level === 0) {
    var meter = '<span class="meter" title="octant:\t' + OCTANTS[slot] + '"></span>';
  } else {
    var max = RESO_NRG[level];
    var fillGrade = nrg/max*100;

    var inf = 'energy:\t\t' + nrg   + ' / ' + max + ' (' + Math.round(fillGrade) + '%)\n'
            + 'level:\t\t'  + level + '\n'
            + 'distance:\t' + dist  + 'm\n'
            + 'owner:\t\t'  + nick  + '\n'
            + 'octant:\t' + OCTANTS[slot];

    var style = 'width:'+fillGrade+'%; background:'+COLORS_LVL[level]+';';

    var color = (level < 3 ? "#9900FF" : "#FFFFFF");

    var lbar = '<span class="meter-level" style="color: ' + color + ';"> ' + level + ' </span>';

    var fill  = '<span style="'+style+'"></span>';

    var meter = '<span class="meter meter-rel" title="'+inf+'">' + fill + lbar + '</span>';
  }
  var cls = isLeft ? 'left' : 'right';
  var text = '<span class="meter-text '+cls+'">'+(nick||'')+'</span>';
  return (isLeft ? text+meter : meter+text) + '<br/>';
}

// calculate AP gain from destroying portal
// so far it counts only resonators + links
window.getDestroyAP = function(d) {
  var resoCount = 0;

  $.each(d.resonatorArray.resonators, function(ind, reso) {
    if(!reso) return true;
    resoCount += 1;
  });

  var linkCount = d.portalV2.linkedEdges ? d.portalV2.linkedEdges.length : 0;
  var fieldCount = d.portalV2.linkedFields ? d.portalV2.linkedFields.length : 0;

  var resoAp = resoCount * DESTROY_RESONATOR;
  var linkAp = linkCount * DESTROY_LINK;
  var fieldAp = fieldCount * DESTROY_FIELD;
  var sum = resoAp + linkAp + fieldAp;

  function tt(text) {
    var t = 'Destroy:\n';
    t += resoCount  + '×\tResonators\t= ' + digits(resoAp) + '\n';
    t += linkCount  + '×\tLinks\t\t= ' + digits(linkAp) + '\n';
    t += fieldCount + '×\tFields\t\t= ' + digits(fieldAp) + '\n';
    t += 'Sum: ' + digits(sum) + ' AP';
    return '<tt title="'+t+'">' + digits(text) + '</tt>';
  }

  return [tt('AP Gain'), tt(sum)];
}
