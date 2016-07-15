// ==UserScript==
// @id             iitc-plugin-cache-details-on-map@jonatkins
// @name           IITC plugin: Cache viewed portal details and always show them on the map
// @category       Cache
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Cache the details of recently viewed portals and use this to populate the map when possible
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @include        https://www.ingress.com/mission/*
// @include        http://www.ingress.com/mission/*
// @match          https://www.ingress.com/mission/*
// @match          http://www.ingress.com/mission/*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.cachePortalDetailsOnMap = function() {};

window.plugin.cachePortalDetailsOnMap.MAX_AGE = 12*60*60;  //12 hours max age for cached data

window.plugin.cachePortalDetailsOnMap.portalDetailLoaded = function(data) {
  window.plugin.cachePortalDetailsOnMap.cache[data.guid] = { loadtime: Date.now(), ent: data.ent };
};

window.plugin.cachePortalDetailsOnMap.entityInject = function(data) {
  var maxAge = Date.now() - window.plugin.cachePortalDetailsOnMap.MAX_AGE*1000;

  var ents = [];
  for (var guid in window.plugin.cachePortalDetailsOnMap.cache) {
    if (window.plugin.cachePortalDetailsOnMap.cache[guid].loadtime < maxAge) {
      delete window.plugin.cachePortalDetailsOnMap.cache[guid];
    } else {
      ents.push(window.plugin.cachePortalDetailsOnMap.cache[guid].ent);
    }
  }
  data.callback(ents);
};


window.plugin.cachePortalDetailsOnMap.setup  = function() {

  window.plugin.cachePortalDetailsOnMap.cache = {};

  addHook('portalDetailLoaded', window.plugin.cachePortalDetailsOnMap.portalDetailLoaded);
  addHook('mapDataEntityInject', window.plugin.cachePortalDetailsOnMap.entityInject);
};

var setup =  window.plugin.cachePortalDetailsOnMap.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
