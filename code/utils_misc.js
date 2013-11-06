// UTILS + MISC  ///////////////////////////////////////////////////////

window.aboutIITC = function() {
  var v = (script_info.script && script_info.script.version || script_info.dateTimeVersion) + ' ['+script_info.buildName+']';
  if (typeof android !== 'undefined' && android && android.getVersionName) {
    v += '[IITC Mobile '+android.getVersionName()+']';
  }

  var plugins = '<ul>';
  for (var i in bootPlugins) {
    var info = bootPlugins[i].info;
    if (info) {
      var pname = info.script && info.script.name || info.pluginId;
      if (pname.substr(0,13) == 'IITC plugin: ' || pname.substr(0,13) == 'IITC Plugin: ') {
        pname = pname.substr(13);
      }
      var pvers = info.script && info.script.version || info.dateTimeVersion;

      var ptext = pname + ' - ' + pvers;
      if (info.buildName != script_info.buildName) {
        ptext += ' ['+(info.buildName||'<i>non-standard plugin</i>')+']';
      }

      plugins += '<li>'+ptext+'</li>';
    } else {
      // no 'info' property of the plugin setup function - old plugin wrapper code
      // could attempt to find the "window.plugin.NAME = function() {};" line it's likely to have..?
      plugins += '<li>(unknown plugin: index '+i+')</li>';
    }
  }
  plugins += '</ul>';

  var attrib = '@@INCLUDEMD:ATTRIBUTION.md@@';
  var contrib = '@@INCLUDEMD:CONTRIBS.md@@'

  var a = ''
  + '  <div><b>About IITC</b></div> '
  + '  <div>Ingress Intel Total Conversion</div> '
  + '  <hr>'
  + '  <div>'
  + '    <a href="http://iitc.jonatkins.com/" target="_blank">IITC Homepage</a><br />'
  + '     On the script’s homepage you can:'
  + '     <ul>'
  + '       <li>Find Updates</li>'
  + '       <li>Get Plugins</li>'
  + '       <li>Report Bugs</li>'
  + '       <li>Contribute!</li>'
  + '     </ul>'
  + '  </div>'
  + '  <div>'
  + '    MapQuest OSM tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="https://developer.mapquest.com/content/osm/mq_logo.png">'
  + '  </div>'
  + '  <hr>'
  + '  <div>Version: ' + v + '</div>'
  + '  <div>Plugins: ' + plugins + '</div>'
  + '  <hr>'
  + '  <div>' + attrib + '</div>'
  + '  <hr>'
  + '  <div>' + contrib + '</div>';

  dialog({
    title: 'IITC ' + v,
    html: a,
    dialogClass: 'ui-dialog-aboutIITC'
  });
}


window.layerGroupLength = function(layerGroup) {
  var layersCount = 0;
  var layers = layerGroup._layers;
  if (layers)
    layersCount = Object.keys(layers).length;
  return layersCount;
}

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

window.eraseCookie = function(name) {
  document.cookie = name + '=; expires=Thu, 1 Jan 1970 00:00:00 GMT; path=/';
}

//certain values were stored in cookies, but we're better off using localStorage instead - make it easy to convert
window.convertCookieToLocalStorage = function(name) {
  var cookie=readCookie(name);
  if(cookie !== undefined) {
    console.log('converting cookie '+name+' to localStorage');
    if(localStorage[name] === undefined) {
      localStorage[name] = cookie;
    }
    eraseCookie(name);
  }
}

// add thousand separators to given number.
// http://stackoverflow.com/a/1990590/1684530 by Doug Neiner.
window.digits = function(d) {
  return (d+"").replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1 ");
}


window.requestParameterMunges = [
  // now obsolete (they don't have some of the new parameters) munge sets deleted

  // set 6 - 2013-10-29
  {
    'dashboard.getGameScore': 'vzjhib746rvkre04',          // GET_GAME_SCORE
    'dashboard.getPaginatedPlextsV2': 'gqa96zhqpddtfmkl',  // GET_PAGINATED_PLEXTS
    'dashboard.getThinnedEntitiesV4': '18lmw7lytgxji0dk',  // GET_THINNED_ENTITIES
    'dashboard.getPlayersByGuids': 'emb5xrj8rav1i0be',     // LOOKUP_PLAYERS
    'dashboard.redeemReward': '4xqof5pldqab63rb',          // REDEEM_REWARD
    'dashboard.sendInviteEmail': 'yq5wxjlnud0tj6hu',       // SEND_INVITE_EMAIL
    'dashboard.sendPlext': 'e1ipqdxjlwd3l7zb',             // SEND_PLEXT

    // common parameters
    method: 'wg7gyxoanqc1si5r',
    version: 'adlo9o4kjvho5q94', //guessed parameter name - only seen munged
    version_parameter: '56036a6497ea344a9fffa38b171a77c092c1f220', // passed as the value to the above parameter

    // GET_THINNED_ENTITIES
    quadKeys: '6vcl0ivqz4aj5sfu', //guessed parameter name - only seen munged

    // GET_PAGINATED_PLEXTS
    desiredNumItems: '6jd5b49wn748diye',
    minLatE6: '891ebsryg45b8cxb',
    minLngE6: 'mvepdcx1k6noya15',
    maxLatE6: 's3rh3fhji5mcjlof',
    maxLngE6: 'yqdgfuukrxj8byzj',
    minTimestampMs: 'btf0kpztxrkt6sl6',
    maxTimestampMs: 'hg8vhtehxf53n5cu',
    chatTab: '6bk9rmebtk1ux6da', //guessed parameter name - only seen munged
    ascendingTimestampOrder: '4zw3v6xwp117r47w',

    // SEND_PLEXT
    message: '55vpsci0hji0ai5x',
    latE6: 'lyhrt4miuwc7w29d',
    lngE6: 'c1yl2qmzfu5j23ao',
//  chatTab: '6bk9rmebtk1ux6da', //guessed parameter name - only seen munged

    // LOOKUP_PLAYERS
    guids: 'k76phw8ey9z21z7c',

    // SEND_INVITE_EMAIL
    inviteeEmailAddress: 'x16pe9u4i8bidbi2',
  },

  // set 7 - 2013-11-06
  {
    'dashboard.getArtifactInfo': 'artifacts',               // GET_ARTIFACT_INFO: new (and not obfsucated?!)
    'dashboard.getGameScore': 'yol4dxx5ufqolhk2',          // GET_GAME_SCORE
    'dashboard.getPaginatedPlextsV2': '7b83j2z81rtk6101',  // GET_PAGINATED_PLEXTS
    'dashboard.getThinnedEntitiesV4': '46su4lrisoq28gxh',  // GET_THINNED_ENTITIES
    'dashboard.getPlayersByGuids': 'wsc5puahrymtf1qh',     // LOOKUP_PLAYERS
    'dashboard.redeemReward': 'oo0n7pw2m0xufpzx',          // REDEEM_REWARD
    'dashboard.sendInviteEmail': 'bo1bp74rz8kbdjkb',       // SEND_INVITE_EMAIL
    'dashboard.sendPlext': 'q0f8o4v9t8pt91yv',             // SEND_PLEXT

    // common parameters
    method: 'imo60cdzkemxduub',
    version: '54lh4o0q7nz7dao9', //guessed parameter name - only seen munged
    version_parameter: '370c0b4e160ed26c8c4ce40f10f546545730e1ef', // passed as the value to the above parameter

    // GET_THINNED_ENTITIES
    quadKeys: 'iqy8e2d3zpne0cmh', //guessed parameter name - only seen munged

    // GET_PAGINATED_PLEXTS
    desiredNumItems: 'chwe3yko3xy0qlk3',
    minLatE6: 'f31z3x27ua8i05cf',
    minLngE6: 't0rmob7f42c0w04r',
    maxLatE6: 'ebwfvri5io9q0tvu',
    maxLngE6: 'lfqzvpj92dp8uxo6',
    minTimestampMs: '23a6djyyieeaeduu',
    maxTimestampMs: 'zhjtsm2gw7w3b7mx',
    chatTab: 'tak64gipm3hhqpnh', //guessed parameter name - only seen munged
    ascendingTimestampOrder: 'v5rzzxtg5rmry3dx',

    // SEND_PLEXT
    message: 'onptntn3szan21lj',
    latE6: '1jq9lgu3hjajrt7s',
    lngE6: 'plbubiopnavbxxh6',
//  chatTab: 'tak64gipm3hhqpnh', //guessed parameter name - only seen munged

    // LOOKUP_PLAYERS
    guids: '919p2cfpdo2wz03n',

    // SEND_INVITE_EMAIL
    inviteeEmailAddress: 'thpbnoyjx0antwm5',
  },

];
window.activeRequestMungeSet = undefined;

// attempt to guess the munge set in use, by looking therough the functions of the stock intel page for one of the munged params
window.detectActiveMungeSet = function() {

  // try and find the stock page functions
  // FIXME? revert to searching through all the code? is that practical?
  var stockFunc;
  try {
    stockFunc = nemesis.dashboard.network.XhrController.prototype.sendRequest.toString();
  } catch(e) {
    try {
      stockFunc = nemesis.dashboard.network.DataFetcher.prototype.sendRequest_.toString();
    } catch(e) {
    }
  }

  if(stockFunc) {
    for (var i in window.requestParameterMunges) {
      if (stockFunc.indexOf (window.requestParameterMunges[i]['method']) >= 0) {
        console.log('IITC: found request munge set index '+i+' in stock intel site');
        window.activeRequestMungeSet = i;
      }
    }
  } else {
    console.error('IITC: failed to find the stock site function for detecting munge set');
  }

  if (window.activeRequestMungeSet===undefined) {
    console.error('IITC: failed to find request munge set - IITC will likely fail');
    window.activeRequestMungeSet = 0;
  }
}

// niantic now add some munging to the request parameters. so far, only two sets of this munging have been seen
window.requestDataMunge = function(data) {
  var activeMunge = window.requestParameterMunges[window.activeRequestMungeSet];

  function munge(obj) {
    if (Object.prototype.toString.call(obj) === '[object Array]') {
      // an array - munge each element of it
      var newobj = [];
      for (var i in obj) {
        newobj[i] = munge(obj[i]);
      }
      return newobj;
    } else if (typeof obj === 'object') {
      // an object: munge each property name, and pass the value through the munge process
      var newobj = Object();
      for (var p in obj) {
        var m = activeMunge[p];
        if (m === undefined) {
          console.error('Error: failed to find munge for object property '+p);
          newobj[p] = obj[p];
        } else {
          // rename the property
          newobj[m] = munge(obj[p]);
        }
      }
      return newobj;
    } else {
      // neither an array or an object - so must be a simple value. return it unmodified
      return obj;
    }
  };

  var newdata = munge(data);
  return newdata;
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
  if (window.activeRequestMungeSet===undefined) {
    window.detectActiveMungeSet();
  }
  var activeMunge = window.requestParameterMunges[window.activeRequestMungeSet];

  var methodName = 'dashboard.'+action;
  var versionStr = 'version_parameter';

  // munging of the method name - seen in Set 2 (onwards?)
  methodName = activeMunge[methodName];
  // and of the 'version' parameter
  versionStr = activeMunge[versionStr];

  var post_data = JSON.stringify(window.requestDataMunge($.extend({method: methodName, version: versionStr}, data)));
  var remove = function(data, textStatus, jqXHR) { window.requests.remove(jqXHR); };
  var errCnt = function(jqXHR) { window.failedRequestCount++; window.requests.remove(jqXHR); };
  var result = $.ajax({
    url: '/r/'+methodName,
    type: 'POST',
    data: post_data,
    context: data,
    dataType: 'json',
    success: [remove, success],
    error: error ? [errCnt, error] : errCnt,
    contentType: 'application/json; charset=utf-8',
    beforeSend: function(req) {
      req.setRequestHeader('X-CSRFToken', readCookie('csrftoken'));
    }
  });
  result.action = action;
  return result;
}

window.zeroPad = function(number,pad) {
  number = number.toString();
  var zeros = pad - number.length;
  return Array(zeros>0?zeros+1:0).join("0") + number;
}


// converts javascript timestamps to HH:mm:ss format if it was today;
// otherwise it returns YYYY-MM-DD
window.unixTimeToString = function(time, full) {
  if(!time) return null;
  var d = new Date(typeof time === 'string' ? parseInt(time) : time);
  var time = d.toLocaleTimeString();
  var date = d.getFullYear()+'-'+zeroPad(d.getMonth()+1,2)+'-'+zeroPad(d.getDate(),2);
  if(typeof full !== 'undefined' && full) return date + ' ' + time;
  if(d.toDateString() == new Date().toDateString())
    return time;
  else
    return date;
}

// converts a javascript time to a precise date and time (optionally with millisecond precision)
// formatted in ISO-style YYYY-MM-DD hh:mm:ss.mmm - but using local timezone
window.unixTimeToDateTimeString = function(time, millisecond) {
  if(!time) return null;
  var d = new Date(typeof time === 'string' ? parseInt(time) : time);
  return d.getFullYear()+'-'+zeroPad(d.getMonth()+1,2)+'-'+zeroPad(d.getDate(),2)
    +' '+d.toLocaleTimeString()+(millisecond?'.'+zeroPad(d.getMilliseconds(),3):'');
}

window.unixTimeToHHmm = function(time) {
  if(!time) return null;
  var d = new Date(typeof time === 'string' ? parseInt(time) : time);
  var h = '' + d.getHours(); h = h.length === 1 ? '0' + h : h;
  var s = '' + d.getMinutes(); s = s.length === 1 ? '0' + s : s;
  return  h + ':' + s;
}

window.formatInterval = function(seconds) {

  var h = Math.floor(seconds / 3600);
  var m = Math.floor((seconds % 3600) / 60);
  var s = seconds % 60;

  var text = '';
  if (h > 0) text += h+'h';
  if (m > 0) text += m+'m';
  if (s > 0 || text == '') text += s+'s';

  return text;
}


window.rangeLinkClick = function() {
  if(window.portalRangeIndicator)
    window.map.fitBounds(window.portalRangeIndicator.getBounds());
  if(window.isSmartphone())
    window.show('map');
}

window.showPortalPosLinks = function(lat, lng, name) {
  var encoded_name = 'undefined';
  if(name !== undefined) {
    encoded_name = encodeURIComponent(name);
  }

  if (typeof android !== 'undefined' && android && android.intentPosLink) {
    android.intentPosLink(lat, lng, map.getZoom(), name, true);
  } else {
    var qrcode = '<div id="qrcode"></div>';
    var script = '<script>$(\'#qrcode\').qrcode({text:\'GEO:'+lat+','+lng+'\'});</script>';
    var gmaps = '<a href="https://maps.google.com/?q='+lat+','+lng+'%20('+encoded_name+')">Google Maps</a>';
    var bingmaps = '<a href="http://www.bing.com/maps/?v=2&cp='+lat+'~'+lng+'&lvl=16&sp=Point.'+lat+'_'+lng+'_'+encoded_name+'___">Bing Maps</a>';
    var osm = '<a href="http://www.openstreetmap.org/?mlat='+lat+'&mlon='+lng+'&zoom=16">OpenStreetMap</a>';
    var latLng = '<span>&lt;' + lat + ',' + lng +'&gt;</span>';
    dialog({
      html: '<div style="text-align: center;">' + qrcode + script + gmaps + '; ' + bingmaps + '; ' + osm + '<br />' + latLng + '</div>',
      title: name,
      id: 'poslinks'
    });
  }
}

window.androidCopy = function(text) {
  if(typeof android === 'undefined' || !android || !android.copy)
    return true; // i.e. execute other actions
  else
    android.copy(text);
  return false;
}

window.androidPermalink = function() {
  if(typeof android === 'undefined' || !android || !android.copy)
    return true; // i.e. execute other actions

  var center = map.getCenter();
  android.intentPosLink(center.lat, center.lng, map.getZoom(), "Intel Map", false);
  return false;
}


window.getPortalDataZoom = function() {
  var mapZoom = map.getZoom();

  // make sure we're dealing with an integer here
  // (mobile: a float somehow gets through in some cases!)
  var z = parseInt(mapZoom);

  // limiting the mazimum zoom level for data retrieval reduces the number of requests at high zoom levels
  // (as all portal data is retrieved at z=17, why retrieve multiple z=18 tiles when fewer z=17 would do?)
  // very effective along with the new cache code
  if (z > 17) z=17;

  //sanity check - should never happen
  if (z < 0) z=0;

  return z;
}


window.getMinPortalLevelForZoom = function(z) {
//based on code from stock gen_dashboard.js
  var ZOOM_TO_LEVEL = [8, 8, 8, 8, 7, 7, 6, 6, 5, 4, 4, 3, 3, 2, 2, 1, 1];
  var l = ZOOM_TO_LEVEL[z] || 0;
  return l;
}


window.getMinPortalLevel = function() {
  var z = getPortalDataZoom();
  return getMinPortalLevelForZoom(z);
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


String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
}

// http://stackoverflow.com/a/646643/1684530 by Bergi and CMS
if (typeof String.prototype.startsWith !== 'function') {
  String.prototype.startsWith = function (str){
    return this.slice(0, str.length) === str;
  };
}

// escape a javascript string, so quotes and backslashes are escaped with a backslash
// (for strings passed as parameters to html onclick="..." for example)
window.escapeJavascriptString = function(str) {
  return (str+'').replace(/[\\"']/g,'\\$&');
}

//escape special characters, such as tags
window.escapeHtmlSpecialChars = function(str) {
  var div = document.createElement(div);
  var text = document.createTextNode(str);
  div.appendChild(text);
  return div.innerHTML;
}

window.prettyEnergy = function(nrg) {
  return nrg> 1000 ? Math.round(nrg/1000) + ' k': nrg;
}

window.setPermaLink = function(elm) {
  var c = map.getCenter();
  var lat = Math.round(c.lat*1E6)/1E6;
  var lng = Math.round(c.lng*1E6)/1E6;
  var qry = 'll='+lat+','+lng+'&z=' + map.getZoom();
  $(elm).attr('href',  '/intel?' + qry);
}

window.uniqueArray = function(arr) {
  return $.grep(arr, function(v, i) {
    return $.inArray(v, arr) === i;
  });
}

window.genFourColumnTable = function(blocks) {
  var t = $.map(blocks, function(detail, index) {
    if(!detail) return '';
    if(index % 2 === 0)
      return '<tr><td>'+detail[1]+'</td><th>'+detail[0]+'</th>';
    else
      return '    <th>'+detail[0]+'</th><td>'+detail[1]+'</td></tr>';
  }).join('');
  if(t.length % 2 === 1) t + '<td></td><td></td></tr>';
  return t;
}


// converts given text with newlines (\n) and tabs (\t) to a HTML
// table automatically.
window.convertTextToTableMagic = function(text) {
  // check if it should be converted to a table
  if(!text.match(/\t/)) return text.replace(/\n/g, '<br>');

  var data = [];
  var columnCount = 0;

  // parse data
  var rows = text.split('\n');
  $.each(rows, function(i, row) {
    data[i] = row.split('\t');
    if(data[i].length > columnCount) columnCount = data[i].length;
  });

  // build the table
  var table = '<table>';
  $.each(data, function(i, row) {
    table += '<tr>';
    $.each(data[i], function(k, cell) {
      var attributes = '';
      if(k === 0 && data[i].length < columnCount) {
        attributes = ' colspan="'+(columnCount - data[i].length + 1)+'"';
      }
      table += '<td'+attributes+'>'+cell+'</td>';
    });
    table += '</tr>';
  });
  table += '</table>';
  return table;
}

// Given 3 sets of points in an array[3]{lat, lng} returns the area of the triangle
window.calcTriArea = function(p) {
  return Math.abs((p[0].lat*(p[1].lng-p[2].lng)+p[1].lat*(p[2].lng-p[0].lng)+p[2].lat*(p[0].lng-p[1].lng))/2);
}

// Update layerGroups display status to window.overlayStatus and localStorage 'ingress.intelmap.layergroupdisplayed'
window.updateDisplayedLayerGroup = function(name, display) {
  overlayStatus[name] = display;
  localStorage['ingress.intelmap.layergroupdisplayed'] = JSON.stringify(overlayStatus);
}

// Read layerGroup status from window.overlayStatus if it was added to map,
// read from cookie if it has not added to map yet.
// return 'defaultDisplay' if both overlayStatus and cookie didn't have the record
window.isLayerGroupDisplayed = function(name, defaultDisplay) {
  if(typeof(overlayStatus[name]) !== 'undefined') return overlayStatus[name];

  convertCookieToLocalStorage('ingress.intelmap.layergroupdisplayed');
  var layersJSON = localStorage['ingress.intelmap.layergroupdisplayed'];
  if(!layersJSON) return defaultDisplay;

  var layers = JSON.parse(layersJSON);
  // keep latest overlayStatus
  overlayStatus = $.extend(layers, overlayStatus);
  if(typeof(overlayStatus[name]) === 'undefined') return defaultDisplay;
  return overlayStatus[name];
}

window.addLayerGroup = function(name, layerGroup, defaultDisplay) {
  if(isLayerGroupDisplayed(name, defaultDisplay)) map.addLayer(layerGroup);
  layerChooser.addOverlay(layerGroup, name);
}

window.clampLat = function(lat) {
  // the map projection used does not handle above approx +- 85 degrees north/south of the equator
  if (lat > 85.051128)
    lat = 85.051128;
  else if (lat < -85.051128)
    lat = -85.051128;
  return lat;
}

window.clampLng = function(lng) {
  if (lng > 179.999999)
    lng = 179.999999;
  else if (lng < -180.0)
    lng = -180.0;
  return lng;
}


window.clampLatLng = function(latlng) {
  return new L.LatLng ( clampLat(latlng.lat), clampLng(latlng.lng) );
}

window.clampLatLngBounds = function(bounds) {
  return new L.LatLngBounds ( clampLatLng(bounds.getSouthWest()), clampLatLng(bounds.getNorthEast()) );
}

// avoid error in stock JS
if(goog && goog.style) {
  goog.style.showElement = function(a, b) {
    if(a && a.style)
      a.style.display = b ? "" : "none"
  };
}

// Fix Leaflet: handle touchcancel events in Draggable
L.Draggable.prototype._onDownOrig = L.Draggable.prototype._onDown;
L.Draggable.prototype._onDown = function(e) {
  L.Draggable.prototype._onDownOrig.apply(this, arguments);

  if(e.type === "touchstart") {
    L.DomEvent.on(document, "touchcancel", this._onUp, this);
  }
}

