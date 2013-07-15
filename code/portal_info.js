

// PORTAL DETAILS TOOLS //////////////////////////////////////////////
// hand any of these functions the details-hash of a portal, and they
// will return useful, but raw data.

// returns a float. Displayed portal level is always rounded down from
// that value.
window.getPortalLevel = function(d) {
  var lvl = 0;
  var hasReso = false;
  $.each(d.resonatorArray.resonators, function(ind, reso) {
    if(!reso) return true;
    lvl += parseInt(reso.level);
    hasReso = true;
  });
  return hasReso ? Math.max(1, lvl/8) : 0;
}

window.getTotalPortalEnergy = function(d) {
  var nrg = 0;
  $.each(d.resonatorArray.resonators, function(ind, reso) {
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
  $.each(d.resonatorArray.resonators, function(ind, reso) {
    if(!reso) return true;
    nrg += parseInt(reso.energyTotal);
  });
  return nrg;
}


window.getEffectivePortalEnergy = function(d) {
  var current_nrg = getCurrentPortalEnergy(d);
  var return_val = current_nrg;
  
  //Find the mitigation of each sheild.
  //For now matchup with ipas and speculative evidence that says mitigation is additive
  //rather than multiplacive, which makes more sense
  //var shield_rate = 100;
  //$.each(d.portalV2.linkedModArray, function(ind, mod) {
  //  if(mod !== null && jQuery.isNumeric(mod.stats.MITIGATION))
  //  {
  //    shield_rate *= 1 - mod.stats.MITIGATION/100;
  //  }
  //});
  ////Add shield's effect to energy
  //var shield_mitigation = 100 - shield_rate;
  
  //Additive sheild mitigation
  var shield_mitigation = 0;
  $.each(d.portalV2.linkedModArray, function(ind, mod) {
    if(mod !== null && jQuery.isNumeric(mod.stats.MITIGATION))
    {
      console.log( mod.stats.MITIGATION);
      shield_mitigation += mod.stats.MITIGATION;
    }
  });
  
  //Find the link effect
  var links = 0;
  if(d.portalV2.linkedEdges) $.each(d.portalV2.linkedEdges, function(ind, link) {
    links++;
  });
  
  var link_mitigation = 4/9 * Math.atan(links / Math.E) * 100;
  
  //var total_mitigation = 100 - ((1 - link_mitigation/100) * (1 - shield_mitigation/100) * 100);
  var total_mitigation = shield_mitigation + link_mitigation;
  if(total_mitigation>95)
  {
    total_mitigation = 95;
  }
  
  return_val += current_nrg * total_mitigation / 100;
  
  //Keep everything in whole numbers to mimic the shield mitigation we're all used to.
  return({ effective_energy: Math.round(return_val),
           total_mitigation: Math.round(total_mitigation), 
           link_mitigation: Math.round(link_mitigation),
           shield_mitigation: Math.round(shield_mitigation)});
}


window.getPortalDamage = function(d) {
  var damage = [];
  
  for(var lvl = 1; lvl <= MIN_AP_FOR_LEVEL.length; lvl++) {
    damage[lvl] = calculatePortalDamage(lvl, d);
  }
  
  return(damage);
}

//Calculate damage standing on portal
window.calculatePortalDamage = function(level, d) {
  var resoDetails = getResonatorDetails(d);
  var effective_energy = getEffectivePortalEnergy(d);
  var damage = 0;
  $.each(d.resonatorArray.resonators, function(ind, reso) {
    if(reso !== null) {
      damage += calculateResonatorDamage(level,reso.distanceToPortal);
    }
  });
  damage = (100 - effective_energy.total_mitigation) / 100 * damage; 
  return(Math.round(damage));
}

window.calculateResonatorDamage = function (level, distanceM) {
    //Ssergni's reliable source from ipas
    var retVal = 0;
    var maxBursterRange = [42, 48, 58, 72, 90, 112, 138, 168];
    
    if (distanceM < maxBursterRange[level-1]) {
        
      var resoAvgDmg = [
          226,
          376,
          676,
          1070,
          1500,
          2100,
          3000,
          4500
      ];
      var damage = resoAvgDmg[level - 1] * Math.pow(.5, distanceM / (maxBursterRange[level-1] / 5));
      damage = damage < 0 ? 0 : damage;
      retVal = Math.round(damage);
  }
  return(retVal);
}

window.getPortalRange = function(d) {
  // formula by the great gals and guys at
  // http://decodeingress.me/2012/11/18/ingress-portal-levels-and-link-range/

  var lvl = 0;
  var resoMissing = false;
  $.each(d.resonatorArray.resonators, function(ind, reso) {
    if(!reso) {
      resoMissing = true;
      return false;
    }
    lvl += parseInt(reso.level);
  });
  if(resoMissing) return 0;

  var range = 160*Math.pow(getPortalLevel(d), 4);

  var boost = getLinkAmpRangeBoost(d);

  return range*boost;

}

window.getLinkAmpRangeBoost = function(d) {
  // additional range boost calculation
  // (at the time of writing, only rare link amps have been seen in the wild, so there's a little guesswork at how
  // the stats work and combine - jon 2013-06-26)

  // link amps scale: first is full, second half, the last two a quarter
  var scale = [1.0, 0.5, 0.25, 0.25];

  var boost = 1.0;  // initial boost is 1.0 (i.e. no boost over standard range)
  var count = 0;

  $.each(d.portalV2.linkedModArray, function(ind, mod) {
    if(mod && mod.type === 'LINK_AMPLIFIER' && mod.stats && mod.stats.LINK_RANGE_MULTIPLIER) {
      // link amp stat LINK_RANGE_MULTIPLIER is 2000 for rare, and gives 2x boost to the range
      var baseMultiplier = mod.stats.LINK_RANGE_MULTIPLIER/1000;
      boost += (baseMultiplier-1)*scale[count];
      count++;
    }
  });

  return boost;
}


window.getAvgResoDist = function(d) {
  var sum = 0, resos = 0;
  $.each(d.resonatorArray.resonators, function(ind, reso) {
    if(!reso) return true;
    sum += parseInt(reso.distanceToPortal);
    resos++;
  });
  return resos ? sum/resos : 0;
}

window.getAttackApGain = function(d) {
  var resoCount = 0;
  var maxResonators = MAX_RESO_PER_PLAYER.slice(0);
  var curResonators = [ 0, 0, 0, 0, 0, 0, 0, 0, 0];
  
  for(var n = PLAYER.level + 1; n < 9; n++) {
    maxResonators[n] = 0;
  }
  $.each(d.resonatorArray.resonators, function(ind, reso) {
    if(!reso)
      return true;
    resoCount += 1;
    var reslevel=parseInt(reso.level);
    if(reso.ownerGuid === PLAYER.guid) {
      if(maxResonators[reslevel] > 0) {
        maxResonators[reslevel] -= 1;
      }
    } else {
      curResonators[reslevel] += 1;
    }
  });

  var linkCount = d.portalV2.linkedEdges ? d.portalV2.linkedEdges.length : 0;
  var fieldCount = d.portalV2.linkedFields ? d.portalV2.linkedFields.length : 0;

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
  
  if(PLAYER.team === d.controllingTeam.team) {
    var resonators_on_portal = d.resonatorArray.resonators;
    var resonator_levels = new Array();
    // figure out how many of each of these resonators can be placed by the player
    var player_resontators = new Array();
    for(var i=1;i<=MAX_PORTAL_LEVEL; i++) {
      player_resontators[i] = i > PLAYER.level ? 0 : MAX_RESO_PER_PLAYER[i];
    }
    $.each(resonators_on_portal, function(ind, reso) {
      if(reso !== null && reso.ownerGuid === window.PLAYER.guid) {
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
