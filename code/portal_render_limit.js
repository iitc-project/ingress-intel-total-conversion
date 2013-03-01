
// PORTAL RENDER LIMIT HANDLER ///////////////////////////////////////
// Functions to handle hiding low level portal when portal render 
// limit is reached. 
//
// On initialization, previous minLevel will preserve to previousMinLevel
// with zoom level difference. 
//
// After initialized and reset in window.requestData(), "processPortals" 
// intercept all portals data in "handleDataResponse". Put the count of 
// new portals to newPortalsPerLevel[portal level]. And split portals 
// into two parts base on previousMinLevel. Portals with level >= 
// previousMinLevel will return as result and continue to render. 
// Others will save to portalsPreviousMinLevel. If there is no more 
// active request of map data, portals will not split and 
// portalsPreviousMinLevel will add back to result and render base on 
// current minLevel. 
//
// "handleFailRequest" is added to handle the case when the last request 
// failed and "processPortals" didn't get called. It will get
// portalsPreviousMinLevel base on current minLevel and render them.
//
// "getMinLevel" will be called by "getMinPortalLevel" in utils_misc.js 
// to determine min portal level to draw on map.
// 
// "getMinLevel" will return minLevel and call "setMinLevel" if 
// minLevel hasn't set yet. 
// 
// In "setMinLevel", it will loop through all portal level from 
// high to low, and sum total portal count (old + new) to check 
// minLevel. 
//
// In each call of window.handleDataResponse(), it will call 
// "resetCounting" to reset previous response data. But minLevel
// is preserved and only replaced when render limit reached in 
// higher level, until next window.requestData() called and reset.
// 

window.portalRenderLimit = function() {}

window.portalRenderLimit.initialized = false;
window.portalRenderLimit.minLevelSet = false;
window.portalRenderLimit.minLevel = -1;
window.portalRenderLimit.previousMinLevel = -1;
window.portalRenderLimit.previousZoomLevel;
window.portalRenderLimit.newPortalsPerLevel = new Array(MAX_PORTAL_LEVEL + 1);
window.portalRenderLimit.portalsPreviousMinLevel = new Array(MAX_PORTAL_LEVEL + 1);

window.portalRenderLimit.init = function () {
  var currentZoomLevel = map.getZoom();
  portalRenderLimit.previousZoomLevel = portalRenderLimit.previousZoomLevel || currentZoomLevel;

  // If there is a minLevel set in previous run, calculate previousMinLevel with it.
  if(portalRenderLimit.minLevelSet) {
    var zoomDiff = currentZoomLevel - portalRenderLimit.previousZoomLevel;
    portalRenderLimit.previousMinLevel = Math.max(portalRenderLimit.minLevel - zoomDiff, -1);
    portalRenderLimit.previousMinLevel = Math.min(portalRenderLimit.previousMinLevel, MAX_PORTAL_LEVEL);
  }

  portalRenderLimit.previousZoomLevel = currentZoomLevel;

  portalRenderLimit.initialized = true;
  portalRenderLimit.minLevel = -1;
  portalRenderLimit.resetCounting();
  portalRenderLimit.resetPortalsPreviousMinLevel();
}

window.portalRenderLimit.resetCounting = function() {
  portalRenderLimit.minLevelSet = false;
  for(var i = 0; i <= MAX_PORTAL_LEVEL; i++) {
    portalRenderLimit.newPortalsPerLevel[i] = 0;
  }
}

window.portalRenderLimit.resetPortalsPreviousMinLevel = function() {
  for(var i = 0; i <= MAX_PORTAL_LEVEL; i++) {
    portalRenderLimit.portalsPreviousMinLevel[i] = new Array();
  }
}

window.portalRenderLimit.splitOrMergeLowLevelPortals = function(originPortals) {
  portalRenderLimit.resetCounting();
  portalRenderLimit.countingPortals(originPortals);

  var resultPortals = requests.isLastRequest('getThinnedEntitiesV2')
    ? portalRenderLimit.mergeLowLevelPortals(originPortals)
    : portalRenderLimit.splitLowLevelPortals(originPortals);

  return resultPortals;
}

window.portalRenderLimit.countingPortals = function(portals) {
  $.each(portals, function(ind, portal) {
    var portalGuid = portal[0];
    var portalLevel = parseInt(getPortalLevel(portal[2]));
    var layerGroup = portalsLayers[portalLevel];

    if(findEntityInLeaflet(layerGroup, window.portals, portalGuid)) return true;

    portalRenderLimit.newPortalsPerLevel[portalLevel]++;
  });
}

window.portalRenderLimit.splitLowLevelPortals = function(portals) {
  var resultPortals = new Array();
  $.each(portals, function(ind, portal) {
    var portalLevel = parseInt(getPortalLevel(portal[2]));
    if(portalLevel < portalRenderLimit.previousMinLevel) {
      portalRenderLimit.portalsPreviousMinLevel[portalLevel].push(portal);
    }else{
      resultPortals.push(portal);
    }
  });
  return resultPortals;
}

window.portalRenderLimit.mergeLowLevelPortals = function(appendTo) {
  var resultPortals = appendTo ? appendTo : new Array();
  for(var i = portalRenderLimit.getMinLevel(); 
      i < portalRenderLimit.previousMinLevel; 
     i++) {
    $.merge(resultPortals, portalRenderLimit.portalsPreviousMinLevel[i]);
  }

  // Reset portalsPreviousMinLevel, ensure they return only once
  portalRenderLimit.resetPortalsPreviousMinLevel();
  return resultPortals;
}

window.portalRenderLimit.getMinLevel = function() {
  if(!portalRenderLimit.initialized) return -1;
  if(!portalRenderLimit.minLevelSet) portalRenderLimit.setMinLevel();
  return portalRenderLimit.minLevel;
}

window.portalRenderLimit.setMinLevel = function() {
  var totalPortalsCount = 0;
  var newMinLevel = MAX_PORTAL_LEVEL + 1;
  
  // Find the min portal level under render limit
  while(newMinLevel > 0) {
    var oldPortalCount = layerGroupLength(portalsLayers[newMinLevel - 1]);
    var newPortalCount = portalRenderLimit.newPortalsPerLevel[newMinLevel - 1];
    totalPortalsCount += oldPortalCount + newPortalCount;
    if(totalPortalsCount >= MAX_DRAWN_PORTALS)
      break;
    newMinLevel--;
  }
  
  // If render limit reached at max portal level, still let portal at max level render
  newMinLevel = Math.min(newMinLevel, MAX_PORTAL_LEVEL);
  
  portalRenderLimit.minLevel = Math.max(newMinLevel, portalRenderLimit.minLevel);
  portalRenderLimit.minLevelSet = true;
}
