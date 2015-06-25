// STATUS BAR ///////////////////////////////////////

// gives user feedback about pending operations. Draws current status
// to website. Updates info in layer chooser.
window.renderUpdateStatusTimer_ = undefined;

window.renderUpdateStatus = function() {
  var progress = 1;

  // portal/limk level display

  var zoom = map.getZoom();
  zoom = getDataZoomForMapZoom(zoom);

  var minLinkLength;
  if (zoom <= 4) minLinkLength = 200000;
  else if (zoom <= 6) minLinkLength = 60000;
  else if (zoom <= 7) minLinkLength = 10000;
  else if (zoom <= 8) minLinkLength = 5000;
  else if (zoom <= 10) minLinkLength = 2500;
  else if (zoom <= 11) minLinkLength = 800;
  else if (zoom <= 12) minLinkLength = 300;
  else if (zoom <= 14) minLinkLength = 0; // 0 means 'all links, but not all portals'
  else minLinkLength = -1; // -1 means 'all links and portals by min level'

  var minlvl = getMinPortalLevel();


  var t = '<span class="help portallevel" title="Indicates portal levels/link lengths displayed.  Zoom in to display more.">';

  if (minLinkLength == -1) {
    if(!window.isSmartphone()) // space is valuable
      t += '<b>portals</b>: ';
    if(minlvl === 0)
      t += '<span id="loadlevel">all</span>';
    else
      t += '<span id="loadlevel" style="background:'+COLORS_LVL[minlvl]+'">L'+minlvl+(minlvl<8?'+':'') + '</span>';
  } else {
    if(!window.isSmartphone()) // space is valuable
      t += '<b>links</b>: ';

    if (minLinkLength > 0)
      t += '<span id="loadlevel">&gt;'+(minLinkLength>1000?minLinkLength/1000+'km':minLinkLength+'m')+'</span>';
    else
      t += '<span id="loadlevel">all links</span>';
  }

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

  t += '</span>';

  //request status
  if (window.activeRequests.length > 0)
    t += ' ' + window.activeRequests.length + ' requests';
  if (window.failedRequestCount > 0)
    t += ' <span style="color:#f66">' + window.failedRequestCount + ' failed</span>'


  //it's possible that updating the status bar excessively causes some performance issues. so rather than doing it
  //immediately, delay it to the next javascript event loop, cancelling any pending update
  // will also cause any browser-related rendering to occur first, before the status actually updates

  if (window.renderUpdateStatusTimer_) clearTimeout(window.renderUpdateStatusTimer_);

  window.renderUpdateStatusTimer_ = setTimeout ( function() {
    window.renderUpdateStatusTimer_ = undefined;

    $('#innerstatus').html(t);
    //$('#updatestatus').click(function() { startRefreshTimeout(10); });
    //. <a style="cursor: pointer" onclick="startRefreshTimeout(10)" title="Refresh">⟳</a>';

    if(progress == 1 && window.activeRequests.length > 0) {
      // we don't know the exact progress, but we have requests (e.g. chat) running, so show it as indeterminate.
      progress = -1;
    }

    if (typeof android !== 'undefined' && android && android.setProgress)
      android.setProgress(progress);
  }, 0);

}
