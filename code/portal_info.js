

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
  return 160*Math.pow(getPortalLevel(d), 4);
}

window.getAvgResoDist = function(d) {
  var sum = 0, resos = 0;
  $.each(d.resonatorArray.resonators, function(ind, reso) {
    if(!reso) return true;
    sum += parseInt(reso.distanceToPortal);
    resos++;
  });
  return sum/resos;
}

window.getAttackApGain = function(d) {
  var resoCount = 0;

  $.each(d.resonatorArray.resonators, function(ind, reso) {
    if (!reso)
      return true;
    resoCount += 1;
  });

  var linkCount = d.portalV2.linkedEdges ? d.portalV2.linkedEdges.length : 0;
  var fieldCount = d.portalV2.linkedFields ? d.portalV2.linkedFields.length : 0;

  var resoAp = resoCount * DESTROY_RESONATOR;
  var linkAp = linkCount * DESTROY_LINK;
  var fieldAp = fieldCount * DESTROY_FIELD;
  var destroyAp = resoAp + linkAp + fieldAp;
  var captureAp = CAPTURE_PORTAL + 8 * DEPLOY_RESONATOR + COMPLETION_BONUS;
  var totalAp = destroyAp + captureAp;

  return {
    totalAp: totalAp,
    destroyAp: destroyAp,
    captureAp: captureAp,
    resoCount: resoCount,
    resoAp: resoAp,
    linkCount: linkCount,
    linkAp: linkAp,
    fieldCount: fieldCount,
    fieldAp: fieldAp
  };
}
