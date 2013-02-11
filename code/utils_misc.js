

// UTILS + MISC  ///////////////////////////////////////////////////////

// retrieves parameter from the URL?query=string.
window.getURLParam = function(param) {
  var v = document.URL;
  var i = v.indexOf(param);
  if(i <= -1) return '';
  v = v.substr(i);
  i = v.indexOf("&");
  if(i >= 0) v = v.substr(0, i);
  return v.replace(param+"=","");
}

// read cookie by name.
// http://stackoverflow.com/a/5639455/1684530 by cwolves
var cookies;
window.readCookie = function(name,c,C,i){
  if(cookies) return cookies[name];
  c = document.cookie.split('; ');
  cookies = {};
  for(i=c.length-1; i>=0; i--){
    C = c[i].split('=');
    cookies[C[0]] = unescape(C[1]);
  }
  return cookies[name];
}

window.writeCookie = function(name, val) {
  document.cookie = name + "=" + val + '; expires=Thu, 31 Dec 2020 23:59:59 GMT; path=/';
}

// add thousand separators to given number.
// http://stackoverflow.com/a/1990590/1684530 by Doug Neiner.
window.digits = function(d) {
  return (d+"").replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1 ");
}

// posts AJAX request to Ingress API.
// action: last part of the actual URL, the rpc/dashboard. is
//         added automatically
// data: JSON data to post. method will be derived automatically from
//       action, but may be overridden. Expects to be given Hash.
//       Strings are not supported.
// success: method to call on success. See jQuery API docs for avail-
//          able arguments: http://api.jquery.com/jQuery.ajax/
// error: see above. Additionally it is logged if the request failed.
window.postAjax = function(action, data, success, error) {
  data = JSON.stringify($.extend({method: 'dashboard.'+action}, data));
  var remove = function(data, textStatus, jqXHR) { window.requests.remove(jqXHR); };
  var errCnt = function(jqXHR) { window.failedRequestCount++; window.requests.remove(jqXHR); };
  return $.ajax({
    url: 'rpc/dashboard.'+action,
    type: 'POST',
    data: data,
    dataType: 'json',
    success: [remove, success],
    error: error ? [errCnt, error] : errCnt,
    contentType: 'application/json; charset=utf-8',
    beforeSend: function(req) {
      req.setRequestHeader('X-CSRFToken', readCookie('csrftoken'));
    }
  });
}

// converts unix timestamps to HH:mm:ss format if it was today;
// otherwise it returns YYYY-MM-DD
window.unixTimeToString = function(time, full) {
  if(!time) return null;
  var d = new Date(typeof time === 'string' ? parseInt(time) : time);
  var time = d.toLocaleTimeString();
  var date = d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
  if(typeof full !== 'undefined' && full) return date + ' ' + time;
  if(d.toDateString() == new Date().toDateString())
    return time;
  else
    return date;
}

window.unixTimeToHHmm = function(time) {
  if(!time) return null;
  var d = new Date(typeof time === 'string' ? parseInt(time) : time);
  var h = '' + d.getHours(); h = h.length === 1 ? '0' + h : h;
  var s = '' + d.getMinutes(); s = s.length === 1 ? '0' + s : s;
  return  h + ':' + s;
}

window.rangeLinkClick = function() {
  if(window.portalRangeIndicator)
    window.map.fitBounds(window.portalRangeIndicator.getBounds());
}

window.reportPortalIssue = function(info) {
  var t = 'Redirecting you to a Google Help Page. Once there, click on “Contact Us” in the upper right corner.\n\nThe text box contains all necessary information. Press CTRL+C to copy it.';
  var d = window.portals[window.selectedPortal].options.details;

  var info = 'Your Nick: ' + PLAYER.nickname + '        '
    + 'Portal: ' + d.portalV2.descriptiveText.TITLE + '        '
    + 'Location: ' + d.portalV2.descriptiveText.ADDRESS
    +' (lat ' + (d.locationE6.latE6/1E6) + '; lng ' + (d.locationE6.lngE6/1E6) + ')';

  //codename, approx addr, portalname
  if(prompt(t, info) !== null)
    location.href = 'https://support.google.com/ingress?hl=en';
}

window._storedPaddedBounds = undefined;
window.getPaddedBounds = function() {
  if(_storedPaddedBounds === undefined) {
    map.on('zoomstart zoomend movestart moveend', function() {
      window._storedPaddedBounds = null;
    });
  }
  if(window._storedPaddedBounds) return window._storedPaddedBounds;

  var p = window.map.getBounds().pad(VIEWPORT_PAD_RATIO);
  window._storedPaddedBounds = p;
  return p;
}

window.renderLimitReached = function() {
  if(Object.keys(portals).length >= MAX_DRAWN_PORTALS) return true;
  if(Object.keys(links).length >= MAX_DRAWN_LINKS) return true;
  if(Object.keys(fields).length >= MAX_DRAWN_FIELDS) return true;
  return false;
}

window.getMinPortalLevel = function() {
  var z = map.getZoom();
  if(z >= 16) return 0;
  var conv = ['impossible', 8,7,7,6,6,5,5,4,4,3,3,2,2,1,1];
  return conv[z];
}

// returns number of pixels left to scroll down before reaching the
// bottom. Works similar to the native scrollTop function.
window.scrollBottom = function(elm) {
  if(typeof elm === 'string') elm = $(elm);
  return elm.get(0).scrollHeight - elm.innerHeight() - elm.scrollTop();
}

window.zoomToAndShowPortal = function(guid, latlng) {
  map.setView(latlng, 17);
  // if the data is available, render it immediately. Otherwise defer
  // until it becomes available.
  if(window.portals[guid])
    renderPortalDetails(guid);
  else
    urlPortal = guid;
}

// translates guids to entity types
window.getTypeByGuid = function(guid) {
  // portals end in “.11” or “.12“, links in “.9", fields in “.b”
  // .11 == portals
  // .12 == portals
  // .9  == links
  // .b  == fields
  // .c  == player/creator
  // .d  == chat messages
  //
  // others, not used in web:
  // .5  == resources (burster/resonator)
  // .6  == XM
  // .4  == media items, maybe all droppped resources (?)
  // resonator guid is [portal guid]-resonator-[slot]
  switch(guid.slice(33)) {
    case '11':
    case '12':
      return TYPE_PORTAL;

    case '9':
      return TYPE_LINK;

    case 'b':
      return TYPE_FIELD;

    case 'c':
      return TYPE_PLAYER;

    case 'd':
      return TYPE_CHAT;

    default:
      if(guid.slice(-11,-2) == 'resonator') return TYPE_RESONATOR;
      return TYPE_UNKNOWN;
  }
}

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
}

// http://stackoverflow.com/a/646643/1684530 by Bergi and CMS
if (typeof String.prototype.startsWith !== 'function') {
  String.prototype.startsWith = function (str){
    return this.slice(0, str.length) === str;
  };
}

window.prettyEnergy = function(nrg) {
  return nrg> 1000 ? Math.round(nrg/1000) + ' k': nrg;
}

window.setPermaLink = function(elm) {
  var c = map.getCenter();
  var lat = Math.round(c.lat*1E6);
  var lng = Math.round(c.lng*1E6);
  var qry = 'latE6='+lat+'&lngE6='+lng+'&z=' + map.getZoom();
  $(elm).attr('href',  'http://www.ingress.com/intel?' + qry);
}

window.uniqueArray = function(arr) {
  return $.grep(arr, function(v, i) {
    return $.inArray(v, arr) === i;
  });
}
