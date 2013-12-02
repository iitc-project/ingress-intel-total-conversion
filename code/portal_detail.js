/// PORTAL DETAIL //////////////////////////////////////
// code to retrieve the new potal detail data from the servers

// NOTE: the API for portal detailed information is NOT FINAL
// this is a temporary measure to get things working again after a major change to the intel map
// API. expect things to change here


// anonymous function wrapper for the code - any variables/functions not placed into 'window' will be private
(function(){

var cache;


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

  if (success) {
    cache.store(guid,data);

    //FIXME..? better way of handling sidebar refreshing...

    if (guid == selectedPortal) {
      renderPortalDetails(guid);
    }
  }

  window.runHooks ('portalDetailLoaded', {guid:guid, success:success, details:data});
}

window.portalDetail.request = function(guid) {

  window.postAjax('getPortalDetails', {guid:guid},
    function(data,textStatus,jqXHR) { handleResponse(guid, data, true); },
    function() { handleResponse(guid, undefined, false); }
  );
}



})(); // anonumous wrapper function end


