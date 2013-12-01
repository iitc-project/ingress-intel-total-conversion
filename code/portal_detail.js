/// PORTAL DETAIL //////////////////////////////////////
// code to retrieve the new potal detail data from the servers


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


