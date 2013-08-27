// MAP DATA //////////////////////////////////////////////////////////
// these functions handle how and which entities are displayed on the
// map. They also keep them up to date, unless interrupted by user
// action.


window.request = undefined;


// requests map data for current viewport. For details on how this
// works, refer to the description in “MAP DATA REQUEST CALCULATORS”
window.requestData = function() {

  if (window.request === undefined) window.request = new Request();

  request.start();

}

