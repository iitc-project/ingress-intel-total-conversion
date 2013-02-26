
// PORTAL RENDER LIMIT HANDLER ///////////////////////////////////////
// Functions to handle hiding low level portal when portal render 
// limit is reached. 
//
// After initialized and reset in window.requestData(), portals in 
// response data will pass to function "pushPortal". Each new portal 
// not on the map will add 1 to newPortalsPerLevel[portal level].
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
window.portalRenderLimit.newPortalsPerLevel = new Array(MAX_PORTAL_LEVEL + 1);

window.portalRenderLimit.init = function () {
  portalRenderLimit.initialized = true;
  portalRenderLimit.minLevel = -1;
  portalRenderLimit.resetCounting();
}

window.portalRenderLimit.resetCounting = function() {
  portalRenderLimit.minLevelSet = false;
  for(var i = 0; i <= MAX_PORTAL_LEVEL; i++) {
    portalRenderLimit.newPortalsPerLevel[i] = 0;
  }
}

window.portalRenderLimit.pushPortal = function(ent) {
  var portalGuid = ent[0];
  var portalLevel = parseInt(getPortalLevel(ent[2]));
  var layerGroup = portalsLayers[portalLevel];
  
  if(findEntityInLeaflet(layerGroup, window.portals, ent[0])) return;
  portalRenderLimit.newPortalsPerLevel[portalLevel]++;
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
