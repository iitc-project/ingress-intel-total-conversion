
// REQUEST HANDLING //////////////////////////////////////////////////
// note: only meant for portal/links/fields request, everything else
// does not count towards “loading”

window.activeRequests = [];
window.failedRequestCount = 0;

window.requests = function() {}

//time of last refresh
window.requests._lastRefreshTime = 0;
window.requests._quickRefreshPending = false;

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
  window.chat._requestPublicRunning  = false;
  window.chat._requestFactionRunning  = false;

  renderUpdateStatus();
}

// gives user feedback about pending operations. Draws current status
// to website. Updates info in layer chooser.
window.renderUpdateStatus = function() {

  var t = '<div><span class="help portallevel" title="Indicates portal levels displayed.  Zoom in to display lower level portals."><b>portals</b>: ';
  var minlvl = getMinPortalLevel();
  if(minlvl === 0)
    t += 'all';
  else
    t+= 'L'+minlvl+(minlvl<8?'+':'');
  t +='</span>';

  t += ' <span class="map"><b>map</b>: ';
  if(mapRunsUserAction)
    t += '<span class="help" title="Paused due to user interaction">paused</span';
  else if(isIdle())
    t += '<span style="color:#888">Idle</span>';
  else if(window.activeRequests.length > 0)
    t += window.activeRequests.length + ' requests';
  else if(window.requests._quickRefreshPending)
    t += 'refreshing';
  else
    t += 'Up to date';
  t += '</span>';

  if(renderLimitReached())
    t += ' <span style="color:#f66" class="help" title="Can only render so much before it gets unbearably slow. Not all entities are shown. Zoom in or increase the limit (search for MAX_DRAWN_*).">RENDER LIMIT</span>'

  if(window.failedRequestCount > 0)
    t += ' <span style="color:#f66">' + window.failedRequestCount + ' failed</span>'

  t += '</div>';

  var portalSelection = $('.leaflet-control-layers-overlays label');
  //it's an array - 0=unclaimed, 1=lvl 1, 2=lvl 2, ..., 8=lvl 8 - 9 relevant entries
  //mark all levels below (but not at) minlvl as disabled
  portalSelection.slice(0, minlvl).addClass('disabled').attr('title', 'Zoom in to show those.');
  //and all from minlvl to 8 as enabled
  portalSelection.slice(minlvl, 8+1).removeClass('disabled').attr('title', '');


  $('#updatestatus').html(t);
  //$('#updatestatus').click(function() { startRefreshTimeout(10); });
  //. <a style="cursor: pointer" onclick="startRefreshTimeout(10)" title="Refresh">⟳</a>';
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
  if(override == -1) return;  //don't set a new timeout

  var t = 0;
  if(override) {
    window.requests._quickRefreshPending = true;
    t = override;
    //ensure override can't cause too fast a refresh if repeatedly used (e.g. lots of scrolling/zooming)
    timeSinceLastRefresh = new Date().getTime()-window.requests._lastRefreshTime;
    if(timeSinceLastRefresh < 0) timeSinceLastRefresh = 0;  //in case of clock adjustments
    if(timeSinceLastRefresh < MINIMUM_OVERRIDE_REFRESH*1000)
      t = (MINIMUM_OVERRIDE_REFRESH*1000-timeSinceLastRefresh);
  } else {
    window.requests._quickRefreshPending = false;
    t = REFRESH*1000;
    var adj = ZOOM_LEVEL_ADJ * (18 - window.map.getZoom());
    if(adj > 0) t += adj*1000;
  }
  var next = new Date(new Date().getTime() + t).toLocaleTimeString();
  console.log('planned refresh in ' + (t/1000) + ' seconds, at ' + next);
  refreshTimeout = setTimeout(window.requests._callOnRefreshFunctions, t);
  renderUpdateStatus();
}

window.requests._onRefreshFunctions = [];
window.requests._callOnRefreshFunctions = function() {
  console.log('running refresh at ' + new Date().toLocaleTimeString());
  startRefreshTimeout();

  if(isIdle()) {
    console.log('user has been idle for ' + idleTime + ' seconds, or window hidden. Skipping refresh.');
    renderUpdateStatus();
    return;
  }

  console.log('refreshing');

  //store the timestamp of this refresh
  window.requests._lastRefreshTime = new Date().getTime();

  $.each(window.requests._onRefreshFunctions, function(ind, f) {
    f();
  });
}


// add method here to be notified of auto-refreshes
window.requests.addRefreshFunction = function(f) {
  window.requests._onRefreshFunctions.push(f);
}

window.requests.isLastRequest = function(action) {
  var result = true;
  $.each(window.activeRequests, function(ind, req) {
    if(req.action === action) {
      result = false;
      return false;
    }
  });
  return result;
}
