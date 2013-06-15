// IDLE HANDLING /////////////////////////////////////////////////////

window.idleTime = 0; // in seconds
window.isHidden = false;

var IDLE_POLL_TIME = 10;

var idlePoll = function() {
  window.idleTime += IDLE_POLL_TIME;
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

$('body').keypress(idleReset);
$('body').mousemove(idleMouseMove);

window.isIdle = function() {
  if (window.idleTime < window.REFRESH) {
    // if idle for less than the refresh time ignore 'hidden' state - likely initial page load in the background
    return false;
  }

  var hidden = (document.hidden || document.webkitHidden || document.mozHidden || document.msHidden);
  if (hidden) {
    // window hidden - force an idle state even if below the idle time limit
    return true;
  }

  // otherwise use the idle time limit
  return window.idleTime >= MAX_IDLE_TIME;
}

window._onResumeFunctions = [];

// add your function here if you want to be notified when the user
// resumes from being idle
window.addResumeFunction = function(f) {
  window._onResumeFunctions.push(f);
}
