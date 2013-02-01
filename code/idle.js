// IDLE HANDLING /////////////////////////////////////////////////////

window.idleTime = 0; // in minutes

setInterval('window.idleTime += 1', 60*1000);
var idleReset = function (e) {
  // update immediately when the user comes back
  if(isIdle()) {
    window.idleTime = 0;
    window.requestData();
  }
  window.idleTime = 0;
};
$('body').mousemove(idleReset).keypress(idleReset);

window.isIdle = function() {
  return window.idleTime >= MAX_IDLE_TIME;
}
