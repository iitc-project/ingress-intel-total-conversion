// PORTAL DETAILS TOOLS //////////////////////////////////////////////
// hand any of these functions the details-hash of a portal, and they
// will return useful, but raw data.

// returns a float. Displayed portal level is always rounded down from
// that value.
window.getPortalLevel = function(d) {
  var lvl = 0;
  var hasReso = false;
  $.each(d.resonators, function(ind, reso) {
    if(!reso) return true;
    lvl += parseInt(reso.level);
    hasReso = true;
  });
  return hasReso ? Math.max(1, lvl/8) : 0;
}

window.getTotalPortalEnergy = function(d) {
  var nrg = 0;
  $.each(d.resonators, function(ind, reso) {
    if(!reso) return true;
    var level = parseInt(reso.level);
    var max = RESO_NRG[level];
    nrg += max;
  });
  return nrg;
}

// For backwards compatibility
window.getPortalEnergy = window.getTotalPortalEnergy;

window.getCurrentPortalEnergy = function(d) {
  var nrg = 0;
  $.each(d.resonators, function(ind, reso) {
    if(!reso) return true;
    nrg += parseInt(reso.energy);
  });
  return nrg;
}

window.getPortalRange = function(d) {
  // formula by the great gals and guys at
  // http://decodeingress.me/2012/11/18/ingress-portal-levels-and-link-range/

  var lvl = 0;
  var resoMissing = false;
  // currently we get a short resonator array when some are missing
  if (d.resonators.length < 8) {
    resoMissing = true;
  }
  // but in the past we used to always get an array of 8, but will 'null' objects for some entries. maybe that will return?
  $.each(d.resonators, function(ind, reso) {
    if(!reso) {
      resoMissing = true;
      return;
    }
  });

  var range = {
    base: 160*Math.pow(getPortalLevel(d), 4),
    boost: getLinkAmpRangeBoost(d)
  };

  range.range = range.boost * range.base;
  range.isLinkable = !resoMissing;

  return range;
}

window.getLinkAmpRangeBoost = function(d) {
  // additional range boost calculation
  // (at the time of writing, only rare link amps have been seen in the wild, so there's a little guesswork at how
  // the stats work and combine - jon 2013-06-26)

  // link amps scale: first is full, second a quarter, the last two an eighth
  var scale = [1.0, 0.25, 0.125, 0.125];

  var boost = 0.0;  // initial boost is 0.0 (i.e. no boost over standard range)
  var count = 0;

  var linkAmps = getPortalModsByType(d, 'LINK_AMPLIFIER');

  $.each(linkAmps, function(ind, mod) {
    // link amp stat LINK_RANGE_MULTIPLIER is 2000 for rare, and gives 2x boost to the range
    // and very-rare is 7000 and gives 7x the range
    var baseMultiplier = mod.stats.LINK_RANGE_MULTIPLIER/1000;
    boost += baseMultiplier*scale[count];
    count++;
  });

  return (count > 0) ? boost : 1.0;
}


window.getAttackApGain = function(d,fieldCount,linkCount) {
  if (!fieldCount) fieldCount = 0;

  var resoCount = 0;
  var maxResonators = MAX_RESO_PER_PLAYER.slice(0);
  var curResonators = [ 0, 0, 0, 0, 0, 0, 0, 0, 0];

  for(var n = PLAYER.level + 1; n < 9; n++) {
    maxResonators[n] = 0;
  }
  $.each(d.resonators, function(ind, reso) {
    if(!reso)
      return true;
    resoCount += 1;
    var reslevel=parseInt(reso.level);
    if(reso.owner === PLAYER.nickname) {
      if(maxResonators[reslevel] > 0) {
        maxResonators[reslevel] -= 1;
      }
    } else {
      curResonators[reslevel] += 1;
    }
  });


  var resoAp = resoCount * DESTROY_RESONATOR;
  var linkAp = linkCount * DESTROY_LINK;
  var fieldAp = fieldCount * DESTROY_FIELD;
  var destroyAp = resoAp + linkAp + fieldAp;
  var captureAp = CAPTURE_PORTAL + 8 * DEPLOY_RESONATOR + COMPLETION_BONUS;
  var enemyAp = destroyAp + captureAp;
  var deployCount = 8 - resoCount;
  var completionAp = (deployCount > 0) ? COMPLETION_BONUS : 0;
  var upgradeCount = 0;
  var upgradeAvailable = maxResonators[8];
  for(var n = 7; n >= 0; n--) {
    upgradeCount += curResonators[n];
    if(upgradeAvailable < upgradeCount) {
        upgradeCount -= (upgradeCount - upgradeAvailable);
    }
    upgradeAvailable += maxResonators[n];
  }
  var friendlyAp = deployCount * DEPLOY_RESONATOR + upgradeCount * UPGRADE_ANOTHERS_RESONATOR + completionAp;
  return {
    friendlyAp: friendlyAp,
    deployCount: deployCount,
    upgradeCount: upgradeCount,
    enemyAp: enemyAp,
    destroyAp: destroyAp,
    resoAp: resoAp,
    captureAp: captureAp
  };
}

//This function will return the potential level a player can upgrade it to
window.potentialPortalLevel = function(d) {
  var current_level = getPortalLevel(d);
  var potential_level = current_level;
  
  if(PLAYER.team === d.team) {
    var resonators_on_portal = d.resonators;
    var resonator_levels = new Array();
    // figure out how many of each of these resonators can be placed by the player
    var player_resontators = new Array();
    for(var i=1;i<=MAX_PORTAL_LEVEL; i++) {
      player_resontators[i] = i > PLAYER.level ? 0 : MAX_RESO_PER_PLAYER[i];
    }
    $.each(resonators_on_portal, function(ind, reso) {
      if(reso !== null && reso.owner === window.PLAYER.nickname) {
        player_resontators[reso.level]--;
      }
      resonator_levels.push(reso === null ? 0 : reso.level);  
    });
    
    resonator_levels.sort(function(a, b) {
      return(a - b);
    });
    
    // Max out portal
    var install_index = 0;
    for(var i=MAX_PORTAL_LEVEL;i>=1; i--) {
      for(var install = player_resontators[i]; install>0; install--) {
        if(resonator_levels[install_index] < i) {
          resonator_levels[install_index] = i;
          install_index++;
        }
      }
    }
    //console.log(resonator_levels);
    potential_level = resonator_levels.reduce(function(a, b) {return a + b;}) / 8;
  }
  return(potential_level);
}


window.fixPortalImageUrl = function(url) {
  if (url) {
    if (window.location.protocol === 'https:') {
      url = url.indexOf('www.panoramio.com') !== -1
            ? url.replace(/^http:\/\/www/, 'https://ssl').replace('small', 'medium')
            : url.replace(/^http:\/\//, '//');
    }
    return url;
  } else {
    return DEFAULT_PORTAL_IMG;
  }

}


window.getPortalModsByType = function(d, type) {
  var mods = [];

  var typeToStat = {
    RES_SHIELD: 'MITIGATION',
    FORCE_AMP: 'FORCE_AMPLIFIER',
    TURRET: 'HIT_BONUS',  // and/or ATTACK_FREQUENCY??
    HEATSINK: 'HACK_SPEED',
    MULTIHACK: 'BURNOUT_INSULATION',
    LINK_AMPLIFIER: 'LINK_RANGE_MULTIPLIER'
  };

  var stat = typeToStat[type];

  $.each(d.mods || [], function(i,mod) {
    if (mod && mod.stats.hasOwnProperty(stat)) mods.push(mod);
  });


  // sorting mods by the stat keeps code simpler, when calculating combined mod effects
  mods.sort (function(a,b) {
    return b.stats[stat] - a.stats[stat];
  });

  return mods;
}



window.getPortalShieldMitigation = function(d) {
  var shields = getPortalModsByType(d, 'RES_SHIELD');

  var mitigation = 0;
  $.each(shields, function(i,s) {
    mitigation += parseInt(s.stats.MITIGATION);
  });

  return mitigation;
}

window.getPortalLinksMitigation = function(linkCount) {
  var mitigation = Math.round(400/9*Math.atan(linkCount/Math.E));
  return mitigation;
}

window.getPortalMitigationDetails = function(d,linkCount) {
  var mitigation = {
    shields: getPortalShieldMitigation(d),
    links: getPortalLinksMitigation(linkCount)
  };

  // mitigation is limited to 95% (as confirmed by Brandon Badger on G+)
  mitigation.total = Math.min(95, mitigation.shields+mitigation.links);

  mitigation.excess = (mitigation.shields+mitigation.links) - mitigation.total;

  return mitigation;
}


window.getPortalHackDetails = function(d) {

  var heatsinks = getPortalModsByType(d, 'HEATSINK');
  var multihacks = getPortalModsByType(d, 'MULTIHACK');

  // first mod of type is fully effective, the others are only 50% effective
  var effectivenessReduction = [ 1, 0.5, 0.5, 0.5 ];

  var cooldownTime = 300; // 5 mins - 300 seconds 

  $.each(heatsinks, function(index,mod) {
    var hackSpeed = parseInt(mod.stats.HACK_SPEED)/1000000;
    cooldownTime = Math.round(cooldownTime * (1 - hackSpeed * effectivenessReduction[index]));
  });

  var numHacks = 4; // default hacks

  $.each(multihacks, function(index,mod) {
    var extraHacks = parseInt(mod.stats.BURNOUT_INSULATION);
    numHacks = numHacks + (extraHacks * effectivenessReduction[index]);
  });

  return {cooldown: cooldownTime, hacks: numHacks, burnout: cooldownTime*(numHacks-1)};
}

// given a detailed portal structure, return summary portal data, as seen in the map tile data
window.getPortalSummaryData = function(d) {

  // NOTE: the summary data reports unclaimed portals as level 1 - not zero as elsewhere in IITC
  var level = parseInt(getPortalLevel(d));
  if (level == 0) level = 1; //niantic returns neutral portals as level 1, not 0 as used throughout IITC elsewhere

  var resCount = 0;
  if (d.resonators) {
    for (var x in d.resonators) {
      if (d.resonators[x]) resCount++;
    }
  }
  var maxEnergy = getTotalPortalEnergy(d);
  var curEnergy = getCurrentPortalEnergy(d);
  var health = maxEnergy>0 ? parseInt(curEnergy/maxEnergy*100) : 0;

  return {
    level: level,
    title: d.title,
    image: d.image,
    resCount: resCount,
    latE6: d.latE6,
    health: health,
    team: d.team,
    lngE6: d.lngE6,
    type: 'portal'
  };
}
