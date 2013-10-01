// UTILS + MISC  ///////////////////////////////////////////////////////

window.aboutIITC = function(){
  var v = '@@BUILDNAME@@-@@BUILDDATE@@';
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


  // set 3 - in the update of 2013-09-30 (addition of 'alerts' chat tab)
  {
    'dashboard.getGameScore': 'fhlzntzkl5v7hcfh',          // GET_GAME_SCORE
    'dashboard.getPaginatedPlextsV2': 'wzuitnswoda7w028',  // GET_PAGINATED_PLEXTS
    'dashboard.getThinnedEntitiesV4': 'scgrm4lf2371esgw',  // GET_THINNED_ENTITIES
    'dashboard.getPlayersByGuids': '81l6usczczoi3lfi',     // LOOKUP_PLAYERS
    'dashboard.redeemReward': '8kop2koeld9b4c26',          // REDEEM_REWARD
    'dashboard.sendInviteEmail': 't0ccodsm1nuo5uso',       // SEND_INVITE_EMAIL
    'dashboard.sendPlext': 'k04cfjwwsg3h3827',             // SEND_PLEXT

    method: '22ux2z96jwq5zn78',
    version: 'kf6hgl9yau03ws0o', //guessed parameter name - only seen munged
    version_parameter: '4608f4356a6f55690f127fb542f557f98de66169', // passed as the value to the above parameter
    boundsParamsList: '29t16cmsn6l3r2xg',
    id: '7rogqhp5pzcqobcw',
    minLatE6: 'yzbnp7z9bd28p0yr',
    minLngE6: '2pdhntvo85cd90bw',
    maxLatE6: 'c4ivr013h4dr68pd',
    maxLngE6: '4p8oorcrwalc1mzf',
    timestampMs: 'vd2rsa9v6f8q606s',
    qk: 'cblh9xe0bgwjy5ij',
    desiredNumItems: '3ymaq7slb165porj',
    minTimestampMs: 's9jf2seni33y3gyu',
    maxTimestampMs: '2kh3vti98rhp3g29',
    chatTab: '7n7ocqfq1p18352b', //guessed parameter name - only seen munged
    ascendingTimestampOrder: 'p88a2ztchtjhiazl',
    message: 'e8qm0kptw2trrcrw',
    latE6: 'fja1phtsqxm71dqm',
    lngE6: 'iut1tb7c0x726hwn',
    guids: '5hyiwhwc0jyljvro',
    inviteeEmailAddress: 's9z6zt03eymzxhkj',
  },

  // set 4 - second update of 2013-09-30
  {
    'dashboard.getGameScore': 'ija9jgrf5hj7wm9r',          // GET_GAME_SCORE
    'dashboard.getPaginatedPlextsV2': '0elftx739mkbzi1b',  // GET_PAGINATED_PLEXTS
    'dashboard.getThinnedEntitiesV4': 'prv0ez8cbsykh63g',  // GET_THINNED_ENTITIES
    'dashboard.getPlayersByGuids': 'i0lxy6nc695z9ka3',     // LOOKUP_PLAYERS
    'dashboard.redeemReward': '376oivna8rf8qbfj',          // REDEEM_REWARD
    'dashboard.sendInviteEmail': '96y930v5q96nrcrw',       // SEND_INVITE_EMAIL
    'dashboard.sendPlext': 'c04kceytofuqvyqg',             // SEND_PLEXT

    method: '9we4b31i48ui4sdm',
    version: 'q402kn5zqisuo1ym', //guessed parameter name - only seen munged
    version_parameter: 'dbad4485024d446ae946e3d287b5d640029ef3e3', // passed as the value to the above parameter
    boundsParamsList: '3r5ctyvc2f653zjd',
    id: 'izey8ciqg2dz2oqc',
    minLatE6: 'cein0n4jrifa7ui2',
    minLngE6: 'lbd1juids3johtdo',
    maxLatE6: 'h4kyot9kmvd3g284',
    maxLngE6: 'sbci6jjc2d5g9uy4',
    timestampMs: '2wurn9giagbvv6bt',
    qk: 'hq73mwpjqyvcp6ul',
    desiredNumItems: 'kyo6vh5n58hmrnua',
    minTimestampMs: 'hu4swdftcp7mvkdi',
    maxTimestampMs: 'ly6ylae5lv1z9072',
    chatTab: 'q5kxut5rmbtlqbf9', //guessed parameter name - only seen munged
    ascendingTimestampOrder: 'hvfd0io35rahwjgr',
    message: 'z4hf7tzl27o14455',
    latE6: 'zyzh3bdxyd47vk1x',
    lngE6: 'n5d1f8pql51t641x',
    guids: 'gl16ehqoc3i3oi07',
    inviteeEmailAddress: 'orc9ufg7rp7g1y9j',
  },

];
window.activeRequestMungeSet = undefined;

// attempt to guess the munge set in use, by looking therough the functions of the stock intel page for one of the munged params
window.detectActiveMungeSet = function() {
  if (window.requestParameterMunges.length == 1) {
    // no point in searching through the code when there's only one set in use
    window.activeRequestMungeSet = 0;
    return;
  }

  // try and find the stock page functions
  // FIXME? revert to searching through all the code? is that practical?
  var stockFunc = nemesis.dashboard.network.DataFetcher.prototype.sendRequest_.toString()
  for (var i in window.requestParameterMunges) {
    if (stockFunc.indexOf (window.requestParameterMunges[i]['method']) >= 0) {
      console.log('IITC: found request munge set index '+i+' in stock intel function nemesis.dashboard.network.DataFetcher.prototype.sendRequest_');
      window.activeRequestMungeSet = i;
    }
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
    window.smartphone.mapButton.click();
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
  switch(z) {
    case 0:
    case 1:
    case 2:
    case 3:
      return 8;
    case 4:
    case 5:
      return 7;
    case 6:
    case 7:
      return 6;
    case 8:
      return 5;
    case 9:
    case 10:
      return 4;
    case 11:
    case 12:
      return 3;
    case 13:
    case 14:
      return 2;
    case 15:
    case 16:
      return 1;
    default:
      return 0
  }
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
