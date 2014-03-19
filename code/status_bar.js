// STATUS BAR ///////////////////////////////////////

// gives user feedback about pending operations. Draws current status
// to website. Updates info in layer chooser.
window.renderUpdateStatus = function() {
  var progress = 1;

  // portal level display
  var t = '<span class="help portallevel" title="Indicates portal levels displayed.  Zoom in to display lower level portals.">';
  if(!window.isSmartphone()) // space is valuable
    t += '<b>portals</b>: ';
  var minlvl = getMinPortalLevel();
  if(minlvl === 0)
    t+= '<span id="loadlevel">all</span>';
  else
    t+= '<span id="loadlevel" style="background:'+COLORS_LVL[minlvl]+'">L'+minlvl+(minlvl<8?'+':'') + '</span>';
  t +='</span>';


  // map status display
  t += ' <span class="map"><b>map</b>: ';

  if (window.mapDataRequest) {
    var status = window.mapDataRequest.getStatus();

    // status.short - short description of status
    // status.long - longer description, for tooltip (optional)
    // status.progress - fractional progress (from 0 to 1; -1 for indeterminate) of current state (optional)
    if (status.long)
      t += '<span class="help" title="'+status.long+'">'+status.short+'</span>';
    else
      t += '<span>'+status.short+'</span>';

    if (status.progress !== undefined) {
      if(status.progress !== -1)
        t += ' '+Math.floor(status.progress*100)+'%';
      progress = status.progress;
    }
  } else {
    // no mapDataRequest object - no status known
    t += '...unknown...';
  }

/*
  if(mapRunsUserAction)
    t += '<span class="help" title="Paused due to user interaction">paused</span';
  else if(isIdle())
    t += '<span style="color:#888">Idle</span>';
  else if(window.requests._quickRefreshPending)
    t += 'refreshing';
  else if(window.activeRequests.length > 0)
    t += window.activeRequests.length + ' requests';
  else {
    // tooltip with detailed tile counts
    t += '<span class="help" title="'+window.statusTotalMapTiles+' tiles: '+window.statusCachedMapTiles+' cached, '+window.statusSuccessMapTiles+' successful, '+window.statusStaleMapTiles+' stale, '+window.statusErrorMapTiles+' failed">';

    // basic error/out of date/up to date message
    if (window.statusErrorMapTiles) t += '<span style="color:#f66">Errors</span>';
    else if (window.statusStaleMapTiles) t += '<span style="color:#fa6">Out of date</span>';
    else t += 'Up to date';
  
    t += '</span>';

  }
*/
  t += '</span>';

  //request status
  if (window.activeRequests.length > 0)
    t += ' ' + window.activeRequests.length + ' requests';
  if (window.failedRequestCount > 0)
    t += ' <span style="color:#f66">' + window.failedRequestCount + ' failed</span>'



  $('#innerstatus').html(t);
  //$('#updatestatus').click(function() { startRefreshTimeout(10); });
  //. <a style="cursor: pointer" onclick="startRefreshTimeout(10)" title="Refresh">⟳</a>';

  if(progress == 1 && window.activeRequests.length > 0) {
    // we don't know the exact progress, but we have requests (e.g. chat) running, so show it as indeterminate.
    progress = -1;
  }

  if (typeof android !== 'undefined' && android && android.setProgress)
    android.setProgress(progress);
}
