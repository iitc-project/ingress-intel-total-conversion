
// REQUEST HANDLING //////////////////////////////////////////////////
// note: only meant for portal/links/fields request, everything else
// does not count towards “loading”

window.activeRequests = [];
window.failedRequestCount = 0;

window.requests = function() {}

window.requests.add = function(ajax) {
  window.activeRequests.push(ajax);
  renderUpdateStatus();
}

window.requests.remove = function(ajax) {
  window.activeRequests.splice(window.activeRequests.indexOf(ajax), 1);
  renderUpdateStatus();
}

window.requests.abort = function() {
  $.each(window.activeRequests, function(ind, actReq) {
    if(actReq) actReq.abort();
  });

  window.activeRequests = [];
  window.failedRequestCount = 0;
  window.chat._requestOldPublicRunning  = false;
  window.chat._requestNewPublicRunning  = false;
  window.chat._requestOldFactionRunning  = false;
  window.chat._requestNewFactionRunning  = false;

  renderUpdateStatus();
}

// gives user feedback about pending operations. Draws current status
// to website. Updates info in layer chooser.
window.renderUpdateStatus = function() {
  var t = '<b>map status:</b> ';
  if(mapRunsUserAction)
    t += 'paused during interaction';
  else if(isIdle())
    t += '<span style="color:red">Idle, not updating.</span>';
  else if(window.activeRequests.length > 0)
    t += window.activeRequests.length + ' requests running.';
  else
    t += 'Up to date.';

  if(renderLimitReached())
    t += ' <span style="color:red" class="help" title="Can only render so much before it gets unbearably slow. Not all entities are shown. Zoom in or increase the limit (search for MAX_DRAWN_*).">RENDER LIMIT</span> '

  if(window.failedRequestCount > 0)
    t += ' <span style="color:red">' + window.failedRequestCount + ' requests failed</span>.'

  t += '<br/>(';
  var minlvl = getMinPortalLevel();
  if(minlvl === 0)
    t += 'loading all portals';
  else
    t+= 'only loading portals with level '+minlvl+' and up';
  t += ')';

  var portalSelection = $('.leaflet-control-layers-overlays label');
  portalSelection.slice(0, minlvl+1).addClass('disabled').attr('title', 'Zoom in to show those.');
  portalSelection.slice(minlvl, 8).removeClass('disabled').attr('title', '');


  $('#updatestatus').html(t);
}


// sets the timer for the next auto refresh. Ensures only one timeout
// is queued. May be given 'override' in milliseconds if time should
// not be guessed automatically. Especially useful if a little delay
// is required, for example when zooming.
window.startRefreshTimeout = function(override) {
  // may be required to remove 'paused during interaction' message in
  // status bar
  window.renderUpdateStatus();
  if(refreshTimeout) clearTimeout(refreshTimeout);
  var t = 0;
  if(override) {
    t = override;
  } else {
    t = REFRESH*1000;
    var adj = ZOOM_LEVEL_ADJ * (18 - window.map.getZoom());
    if(adj > 0) t += adj*1000;
  }
  var next = new Date(new Date().getTime() + t).toLocaleTimeString();
  console.log('planned refresh: ' + next);
  refreshTimeout = setTimeout(window.requests._callOnRefreshFunctions, t);
}

window.requests._onRefreshFunctions = [];
window.requests._callOnRefreshFunctions = function() {
  startRefreshTimeout();

  if(isIdle()) {
    console.log('user has been idle for ' + idleTime + ' minutes. Skipping refresh.');
    renderUpdateStatus();
    return;
  }

  console.log('refreshing');

  $.each(window.requests._onRefreshFunctions, function(ind, f) {
    f();
  });
}


// add method here to be notified of auto-refreshes
window.requests.addRefreshFunction = function(f) {
  window.requests._onRefreshFunctions.push(f);
}
