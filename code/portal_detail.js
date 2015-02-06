/// PORTAL DETAIL //////////////////////////////////////
// code to retrieve the new portal detail data from the servers

// NOTE: the API for portal detailed information is NOT FINAL
// this is a temporary measure to get things working again after a major change to the intel map
// API. expect things to change here


// anonymous function wrapper for the code - any variables/functions not placed into 'window' will be private
(function(){

var cache;
var requestQueue = {};

window.portalDetail = function() {};

window.portalDetail.setup = function() {
  cache = new DataCache();

  cache.startExpireInterval(20);
}

window.portalDetail.get = function(guid) {
  return cache.get(guid);
}

window.portalDetail.isFresh = function(guid) {
  return cache.isFresh(guid);
}


var handleResponse = function(guid, data, success) {
  delete requestQueue[guid];

  function parseMod(arr) {
    if(arr == null) { return null; }
    return {
      owner: arr[0],
      name: arr[1],
      rarity: arr[2],
      stats: arr[3],
    };
  }
  function parseResonator(arr) {
    if(arr == null) { return null; }
    return {
      owner: arr[0],
      level: arr[1],
      energy: arr[2],
    };
  }

  if (data.error || !data.result) {
    success = false;
  }

  if (success) {
    var dict = {
      raw:       data.result,
      type:      data.result[0],
      team:      data.result[1],
      latE6:     data.result[2],
      lngE6:     data.result[3],
      level:     data.result[4],
      health:    data.result[5],
      resCount:  data.result[6],
      image:     data.result[7],
      title:     data.result[8],
      ornaments: data.result[9],
      // what's [10]?
      mods:      data.result[11].map(parseMod),
      resonators:data.result[12].map(parseResonator),
      owner:     data.result[13],
    };

    cache.store(guid,dict);

    //FIXME..? better way of handling sidebar refreshing...

    if (guid == selectedPortal) {
      renderPortalDetails(guid);
    }

    window.runHooks ('portalDetailLoaded', {guid:guid, success:success, details:dict});

  } else {
    if (data.error == "RETRY") {
      // server asked us to try again
      portalDetail.request(guid);
    } else {
      window.runHooks ('portalDetailLoaded', {guid:guid, success:success});
    }
  }

}

window.portalDetail.request = function(guid) {
  if (!requestQueue[guid]) {
    requestQueue[guid] = true;

    window.postAjax('getPortalDetails', {guid:guid},
      function(data,textStatus,jqXHR) { handleResponse(guid, data, true); },
      function() { handleResponse(guid, undefined, false); }
    );
  }

}



})(); // anonymous wrapper function end


