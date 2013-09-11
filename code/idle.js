// IDLE HANDLING /////////////////////////////////////////////////////

window.idleTime = 0; // in seconds
window._idleTimeLimit = MAX_IDLE_TIME;

var IDLE_POLL_TIME = 10;

var idlePoll = function() {
  window.idleTime += IDLE_POLL_TIME;

  var hidden = (document.hidden || document.webkitHidden || document.mozHidden || document.msHidden || false);
  if (hidden) {
    // window hidden - use the refresh time as the idle limit, rather than the max time
    window._idleTimeLimit = window.REFRESH;
  }
}

setInterval(idlePoll, IDLE_POLL_TIME*1000);

var idleReset = function () {
  // update immediately when the user comes back
  if(isIdle()) {
    window.idleTime = 0;
    $.each(window._onResumeFunctions, function(ind, f) {
      f();
    });
  }
  window.idleTime = 0;
  window._idleTimeLimit = MAX_IDLE_TIME;
};

// only reset idle on mouse move where the coordinates are actually different.
// some browsers send the event when not moving!
var _lastMouseX=-1, _lastMouseY=-1;
var idleMouseMove = function(e) {
  var dX = _lastMouseX-e.clientX;
  var dY = _lastMouseY-e.clientY;
  var deltaSquared = dX*dX + dY*dY;
  // only treat movements over 3 pixels as enough to reset us
  if (deltaSquared > 3*3) {
    _lastMouseX = e.clientX;
    _lastMouseY = e.clientY;
    idleReset();
  }
}

window.setupIdle = function() {
  $('body').keypress(idleReset);
  $('body').mousemove(idleMouseMove);
}


window.isIdle = function() {
  return window.idleTime >= window._idleTimeLimit;
}

window._onResumeFunctions = [];

// add your function here if you want to be notified when the user
// resumes from being idle
window.addResumeFunction = function(f) {
  window._onResumeFunctions.push(f);
}
