// ==UserScript==
// @id             iitc-plugin-player-tracker@breunigs
// @name           IITC Plugin: Player tracker
// @category       Layer
// @version        0.11.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Draw trails for the path a user took onto the map based on status messages in COMMs. Uses up to three hours of data. Does not request chat data on its own, even if that would be useful.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////
window.PLAYER_TRACKER_MAX_EVENT_TIME = 3*60*60*1000; // in milliseconds  (Ray)  renamed for clarity
window.PLAYER_TRACKER_MAX_FIELD_TIME = 6*60*60*1000; // in milliseconds  (Ray)  separate time limit for checking fields
window.PLAYER_TRACKER_MAX_EVENT_DISPLAY = 10;        // (Ray) number of event lines to display in popup
window.PLAYER_TRACKER_MAX_FIELD_DISPLAY = 20;        // (Ray) number of field lines to display in popupwindow.PLAYER_TRACKER_MIN_ZOOM = 9;
window.PLAYER_TRACKER_MIN_OPACITY = 0.3;
window.PLAYER_TRACKER_LINE_COLOUR = '#FF00FD';


// use own namespace for plugin
window.plugin.playerTracker = function() {};

window.plugin.playerTracker.setup = function() {
  $('<style>').prop('type', 'text/css').html('@@INCLUDESTRING:plugins/player-tracker.css@@').appendTo('head');

  var iconEnlImage = '@@INCLUDEIMAGE:images/marker-green.png@@';
  var iconEnlRetImage = '@@INCLUDEIMAGE:images/marker-green-2x.png@@';
  var iconResImage = '@@INCLUDEIMAGE:images/marker-blue.png@@';
  var iconResRetImage = '@@INCLUDEIMAGE:images/marker-blue-2x.png@@';

  plugin.playerTracker.iconEnl = L.Icon.Default.extend({options: {
    iconUrl: iconEnlImage,
    iconRetinaUrl: iconEnlRetImage
  }});
  plugin.playerTracker.iconRes = L.Icon.Default.extend({options: {
    iconUrl: iconResImage,
    iconRetinaUrl: iconResRetImage
  }});

  plugin.playerTracker.drawnTracesEnl = new L.LayerGroup();
  plugin.playerTracker.drawnTracesRes = new L.LayerGroup();
  // to avoid any favouritism, we'll put the player's own faction layer first
  if (PLAYER.team == 'RESISTANCE') {
    window.addLayerGroup('Player Tracker Resistance', plugin.playerTracker.drawnTracesRes, true);
    window.addLayerGroup('Player Tracker Enlightened', plugin.playerTracker.drawnTracesEnl, true);
  } else {
    window.addLayerGroup('Player Tracker Enlightened', plugin.playerTracker.drawnTracesEnl, true);
    window.addLayerGroup('Player Tracker Resistance', plugin.playerTracker.drawnTracesRes, true);
  }
  map.on('layeradd',function(obj) {
    if(obj.layer === plugin.playerTracker.drawnTracesEnl || obj.layer === plugin.playerTracker.drawnTracesRes) {
      obj.layer.eachLayer(function(marker) {
        if(marker._icon) window.setupTooltips($(marker._icon));
      });
    }
  });

  plugin.playerTracker.playerPopup = new L.Popup({offset: L.point([1,-34])});

  addHook('publicChatDataAvailable', window.plugin.playerTracker.handleData);

  window.map.on('zoomend', function() {
    window.plugin.playerTracker.zoomListener();
  });
  window.plugin.playerTracker.zoomListener();
  
  plugin.playerTracker.setupUserSearch();
}

window.plugin.playerTracker.stored = {};

plugin.playerTracker.onClickListener = function(event) {
  var marker = event.target;

  if (marker.options.desc) {
    plugin.playerTracker.playerPopup.setContent(marker.options.desc);
    plugin.playerTracker.playerPopup.setLatLng(marker.getLatLng());
    map.openPopup(plugin.playerTracker.playerPopup);
  }
};

// force close all open tooltips before markers are cleared
window.plugin.playerTracker.closeIconTooltips = function() {
  plugin.playerTracker.drawnTracesRes.eachLayer(function(layer) {
    if ($(layer._icon)) { $(layer._icon).tooltip('close');}
  });
  plugin.playerTracker.drawnTracesEnl.eachLayer(function(layer) {
    if ($(layer._icon)) { $(layer._icon).tooltip('close');}
  });
}

window.plugin.playerTracker.zoomListener = function() {
  var ctrl = $('.leaflet-control-layers-selector + span:contains("Player Tracker")').parent();
  if(window.map.getZoom() < window.PLAYER_TRACKER_MIN_ZOOM) {
    if (!window.isTouchDevice()) plugin.playerTracker.closeIconTooltips();
    plugin.playerTracker.drawnTracesEnl.clearLayers();
    plugin.playerTracker.drawnTracesRes.clearLayers();
    ctrl.addClass('disabled').attr('title', 'Zoom in to show those.');
    //note: zoomListener is also called at init time to set up things, so we only need to do this in here
    window.chat.backgroundChannelData('plugin.playerTracker', 'all', false);   //disable this plugin's interest in 'all' COMM
  } else {
    ctrl.removeClass('disabled').attr('title', '');
    //note: zoomListener is also called at init time to set up things, so we only need to do this in here
    window.chat.backgroundChannelData('plugin.playerTracker', 'all', true);    //enable this plugin's interest in 'all' COMM
  }
}

window.plugin.playerTracker.getEventLimit = function() // (Ray) renamed to use renamed variable
    return new Date().getTime() - window.PLAYER_TRACKER_MAX_EVENT_TIME;

window.plugin.playerTracker.getFieldLimit = function() // (Ray) separate limit for fields
    return new Date().getTime() - window.PLAYER_TRACKER_MAX_FIELD_TIME;

window.plugin.playerTracker.discardOldData = function() {
    // (Ray) altered to remove old fields as well as old events
    var eventlimit = plugin.playerTracker.getEventLimit();  // (Ray)
    var fieldlimit = plugin.playerTracker.getFieldLimit();  // (Ray)
        
    $.each(plugin.playerTracker.stored, function(plrname, player) {
        var i;
        var ev = player.events;
        var hasEvents = (ev.length > 0);
        var fld = player.fields;
        var hasFields = (fld.length >0);
        
        if (hasEvents)
            {
            for(i = 0; i < ev.length; i++) 
                { if(ev[i].time >= eventlimit) break; }
            if (i > 0) 
                {
                if (i === ev.length) 
                    hasEvents = false;
                else
                    plugin.playerTracker.stored[plrname].events.splice(0, i); 
                }
            }
            
        if (hasFields)
            {
            for(i = 0; i < fld.length; i++) 
                { if(fld[i].time >= fieldlimit) break; }
            if (i > 0)
                {
                if (i === fld.length) 
                    hasFields = false;
                else
                    plugin.playerTracker.stored[plrname].fields.splice(0, i); 
                }
            }
        
        if (!hasEvents && !hasFields)
            delete plugin.playerTracker.stored[plrname];
    });
}

window.plugin.playerTracker.eventHasLatLng = function(ev, lat, lng) {
  var hasLatLng = false;
  $.each(ev.latlngs, function(ind, ll) {
    if(ll[0] === lat && ll[1] === lng) {
      hasLatLng = true;
      return false;
    }
  });
  return hasLatLng;
}


window.plugin.playerTracker.processNewData = function(data) 
    {
    // (Ray) a lot of changes here. no early exits from messages because they could be a field
    // but not an event for traditional player tracker
    var eventlimit = plugin.playerTracker.getEventLimit();
    var fieldlimit = plugin.playerTracker.getFieldLimit();

    $.each(data.result, function(ind, json) 
        {
        // find player and portal information
        var plrname, lat, lng, id=null, name, address;
        var ignoreThisMessage = false;
        var handledThisEvent = false;

        // (Ray)
        var mufield = 0;    // counter for checking that we got a complete mu change message
        var valMU = 0;      // amount of mu changed
        var mutype = 'x';   // type of mu change + - x
        var isEvent = true;
        var isField = false;

        $.each(json[2].plext.markup, function(ind, markup) 
            {
            switch(markup[0]) 
                {
                case 'TEXT':
                    // (Ray) Yes this could be more elegant 
                    // looping through the additional TEXT nodes to make sure it has all three for an MU field
                    if ((mufield == 0) && (markup[1].plain.indexOf('created a Control Field') !== -1)) { mufield = 1; } 
                    if ((mufield == 1) && (ind == 3) && (markup[1].plain == ' +'))   { mufield = 2; mutype = '+'; }
                    if ((mufield == 2) && (ind == 4))  { mufield = 3; valMU = parseInt(markup[1].plain); }
                    if ((mufield == 3) && (ind == 5) && (markup[1].plain == ' MUs'))  { isField = true; }  // (Ray) got all four fields for + MU

                    if ((mufield == 0) && (markup[1].plain.indexOf('destroyed a Control Field') !== -1)) { mufield = 11; } 
                    if ((mufield == 11) && (ind == 3) && (markup[1].plain == ' -'))   { mufield = 12; mutype = '-'; }  
                    if ((mufield == 12) && (ind == 4))  { mufield = 13; valMU = parseInt(markup[1].plain); }
                    if ((mufield == 13) && (ind == 5) && (markup[1].plain == ' MUs')) { isField = true; }  // (Ray) got all four fields for - MU

                    // Destroy link and field messages depend on where the link or
                    // field was originally created. Therefore it's not clear which
                    // portal the player is at, so ignore it.  
                    if (markup[1].plain.indexOf('destroyed the Link') !== -1 || 
                        markup[1].plain.indexOf('Your Link') !== -1 ||
                        markup[1].plain.indexOf('destroyed a Control Field') !== -1) 
                        { isEvent = false; }
                    break;
                case 'PLAYER':
                    plrname = markup[1].plain;
                    break;
                case 'PORTAL':
                    // link messages are 'player linked X to Y' and the player is at
                    // X.
                    lat = lat ? lat : markup[1].latE6/1E6;
                    lng = lng ? lng : markup[1].lngE6/1E6;

                    // no GUID in the data any more - but we need some unique string. use the latE6,lngE6
                    id = markup[1].latE6+","+markup[1].lngE6;

                    name = name ? name : markup[1].name;
                    address = address ? address : markup[1].address;
                    break;
                } // switch
            }); // each message section

        isField = ((isField) && (valMU > 0) && (mutype != 'x') && (json[1] >= fieldlimit));
                
        isEvent = ((isEvent) && (lat) && (lng) && (id) && (plrname) && (json[1] >= eventlimit));
                
        if ((!isField) && (!isEvent))
           { return true; }
                
        var playerData = window.plugin.playerTracker.stored[plrname];
        if(!playerData) 
            {
            plugin.playerTracker.stored[plrname] = 
                {
                nick: plrname,
                team: json[2].plext.team,
                events: [],
                fields: []
                };
            playerData = window.plugin.playerTracker.stored[plrname];
            }

        if (isEvent)
            {
            var newEvent = 
                {
                latlngs: [[lat, lng]],
                ids: [id],
                time: json[1],
                name: name,
                address: address
                };
            if (playerData.events.length === 0)
                {
                plugin.playerTracker.stored[plrname].events.push(newEvent);
                }
            else
                {
                var evts = playerData.events;
                // there's some data already. Need to find correct place to insert.
                var i;
                for(i = 0; i < evts.length; i++) 
                    if(evts[i].time > json[1]) break;
 
                 var cmp = Math.max(i-1, 0);
   
                // so we have an event that happened at the same time. Most likely
                // this is multiple resos destroyed at the same time.
                if(evts[cmp].time === json[1]) 
                    {
                    evts[cmp].latlngs.push([lat, lng]);
                    evts[cmp].ids.push(id);
                    plugin.playerTracker.stored[plrname].events = evts;
                    handledThisEvent = true;
                    }

                // the time changed. Is the player still at the same location?
 
                // assume this is an older event at the same location. Then we need
                // to look at the next item in the event list. If this event is the
                // newest one, there may not be a newer event so check for that. If
                // it really is an older event at the same location, then skip it.
                if (evts[cmp+1] && plugin.playerTracker.eventHasLatLng(evts[cmp+1], lat, lng))
                    handledThisEvent = true;

                if (!handledThisEvent)
                    {
                    // if this event is newer, need to look at the previous one
                    var sameLocation = plugin.playerTracker.eventHasLatLng(evts[cmp], lat, lng);

                    // if it's the same location, just update the timestamp. Otherwise
                    // push as new event.
                    if(sameLocation) 
                        { evts[cmp].time = json[1]; }
                    else 
                        { evts.splice(i, 0,  newEvent); }

                    // update player data
                    plugin.playerTracker.stored[plrname].events = evts;
                    }
                }
            } //end isEvent

        if (isField)
            {
            var newField = 
                {
                time: json[1],
                latlngs: [[lat, lng]],
                ids: [id],
                name: (mutype == '+') ? ' + '+valMU.toLocaleString() : name,
                address: address,
                mutype: mutype,
                mu: valMU
                };
            if (playerData.fields.length === 0)
                {
                plugin.playerTracker.stored[plrname].fields.push(newField);
                }
            else
                {
                var flds = playerData.fields;
                var i;
                for(i = 0; i < flds.length; i++) 
                    { if((flds[i].time == json[1]) && (flds[i].mu == valMU)) break; }
                if (i >= flds.length)
                    {
                    // (Ray) we didn't find a field with a matching time and mu 
                    // put the new field in the right time position
                    for(i = 0; i < flds.length; i++) 
                        { if(flds[i].time > json[1]) break; }
                    if (i >= flds.length)
                        { flds.push(newField); }
                    else
                        { flds.splice(i, 0,  newField); }
                    }

                // update player data
                plugin.playerTracker.stored[plrname].fields = flds;
                }
            } //end isField

                
        } );
    }


window.plugin.playerTracker.getLatLngFromEvent = function(ev) {
//TODO' add weight to certain events, or otherwise prefer them, to give better locations'
  var lats = 0;
  var lngs = 0;
  $.each(ev.latlngs, function(i, latlng) {
    lats += latlng[0];
    lngs += latlng[1];
  });

  return L.latLng(lats / ev.latlngs.length, lngs / ev.latlngs.length);
}

window.plugin.playerTracker.ago = function(time, now) {
  var s = (now-time) / 1000;
  var h = Math.floor(s / 3600);
  var m = Math.floor((s % 3600) / 60);
  var returnVal = m + 'm';
  if(h > 0) {
    returnVal = h + 'h' + returnVal;
  }
  return returnVal;
}


window.plugin.playerTracker.drawData = function() {
  var isTouchDev = window.isTouchDevice();

  var gllfe = plugin.playerTracker.getLatLngFromEvent;

  var polyLineByAgeEnl = [[], [], [], []];
  var polyLineByAgeRes = [[], [], [], []];

  var split = PLAYER_TRACKER_MAX_EVENT_TIME / 4;
  var now = new Date().getTime();
    
  $.each(plugin.playerTracker.stored, function(plrname, playerData) {
    if(!playerData || playerData.events.length === 0) {
      console.warn('broken player data for plrname=' + plrname);
      return true;
    }

    // gather line data and put them in buckets so we can color them by
    // their age
    var playerLine = [];
    for(var i = 1; i < playerData.events.length; i++) {
      var p = playerData.events[i];
      var ageBucket = Math.min(parseInt((now - p.time) / split), 4-1);
      var line = [gllfe(p), gllfe(playerData.events[i-1])];

      if(playerData.team === 'RESISTANCE')
        polyLineByAgeRes[ageBucket].push(line);
      else
        polyLineByAgeEnl[ageBucket].push(line);
    }

    var evtsLength = playerData.events.length;
    var last = playerData.events[evtsLength-1];
    var ago = plugin.playerTracker.ago;

    // tooltip for marker - no HTML - and not shown on touchscreen devices
    var tooltip = isTouchDev ? '' : (playerData.nick+', '+ago(last.time, now)+' ago');

    // popup for marker
    //-----------------  
    var popup = $('<div>')
      .addClass('plugin-player-tracker-popup');

    // player name  
    $('<span>')
      .addClass('nickname ' + (playerData.team === 'RESISTANCE' ? 'res' : 'enl'))
      .css('font-weight', 'bold')
      .text(playerData.nick)
      .appendTo(popup);

    // player level
    if(window.plugin.guessPlayerLevels !== undefined &&
       window.plugin.guessPlayerLevels.fetchLevelDetailsByPlayer !== undefined) {
      function getLevel(lvl) {
        return $('<span>')
          .css({
            padding: '4px',
            color: 'white',
            backgroundColor: COLORS_LVL[lvl],
          })
          .text(lvl);
      }
      var level = $('<span>')
        .css({'font-weight': 'bold', 'margin-left': '10px'})
        .appendTo(popup);
      var playerLevelDetails = window.plugin.guessPlayerLevels.fetchLevelDetailsByPlayer(plrname);
      level
        .text('Min level ')
        .append(getLevel(playerLevelDetails.min));
      if(playerLevelDetails.min != playerLevelDetails.guessed)
        level
          .append(document.createTextNode(', guessed level: '))
          .append(getLevel(playerLevelDetails.guessed));
    }

    // show most recent event
    popup
      .append('<br>')
      .append(document.createTextNode(ago(last.time, now)))
      .append('<br>')
      .append(plugin.playerTracker.getPortalLink(last))
      .append('<br>');


    // show previous events in popup
    if(evtsLength >= 2) 
        {
        var eventtable = $('<table>') .css('border-spacing', '0');
        for(var i = evtsLength - 2; i >= 0 && i >= evtsLength - window.PLAYER_TRACKER_MAX_EVENT_DISPLAY; i--) 
            {
            var ev = playerData.events[i];
            $('<tr>')
              .append($('<td>') .text(ago(ev.time, now) + ' ago '))
              .append($('<td>') .append(plugin.playerTracker.getPortalLink(ev)))
            .appendTo(eventtable);
            }

        popup
          .append('<br>')
          .append(document.createTextNode('previous locations:'))
          .append('<br>');

        eventtable.appendTo(popup);
        }
      
    // (Ray) field data for popup
    if (playerData.fields.length > 0)
        {
        var plusMU = 0;
        var plusFields = 0;
        var plusLines = 0;   // count lines output in popup
        var minusMU = 0;
        var minusFields = 0;
        var minusLines = 0;  // count lines output in popup
        var plustable = $('<table>')   .css('border-spacing', '0');
        var minustable = $('<table>')  .css('border-spacing', '0');
            
        for(var i = playerData.fields.length-1; i >= 0; i--)
            {
            if ((playerData.fields[i].mutype == '+') && (plusLines < window.PLAYER_TRACKER_MAX_FIELD_DISPLAY))
                { 
                ++plusFields; 
                plusMU += playerData.fields[i].mu; 
                $('<tr>')
                  .append($('<td>') .text(ago(playerData.fields[i].time, now) + ' ago'))
                  .append($('<td>') .append(plugin.playerTracker.getPortalLink(playerData.fields[i])))
                  .appendTo(plustable);
                ++plusLines;
                }
            if ((playerData.fields[i].mutype == '-') && (minusLines < window.PLAYER_TRACKER_MAX_FIELD_DISPLAY))
                { 
                ++minusFields; 
                minusMU += playerData.fields[i].mu; 
                $('<tr>')
                  .append($('<td>') .text(ago(playerData.fields[i].time, now) + ' ago'))
                  .append($('<td>') .text(' - '+playerData.fields[i].mu.toLocaleString()+' MU'))
                  .appendTo(minustable);
                ++minusLines;
                }
            } // each field 
            
        if (plusFields > 0)
            {
            popup
              .append('<br>')
              .append('+ '+plusMU.toLocaleString()+' MU &nbsp; ('+plusFields+' fields)')
              .append('<br>');
            plustable.appendTo(popup);
            }
            
        if (minusFields > 0)
            {
            popup
              .append('<br>')
              .append('- '+minusMU.toLocaleString()+' MU &nbsp; ('+minusFields+' fields)')
              .append('<br>');
            minustable.appendTo(popup);
            }
            
        } // if we had fields

    // done with popup (Ray)  
      
    // calculate the closest portal to the player
    var eventPortal = []
    var closestPortal;
    var mostPortals = 0;
    $.each(last.ids, function(i, id) {
      if(eventPortal[id]) {
        eventPortal[id]++;
      } else {
        eventPortal[id] = 1;
      }
      if(eventPortal[id] > mostPortals) {
        mostPortals = eventPortal[id];
        closestPortal = id;
      }
    });

    // marker opacity
    var relOpacity = 1 - (now - last.time) / window.PLAYER_TRACKER_MAX_EVENT_TIME
    var absOpacity = window.PLAYER_TRACKER_MIN_OPACITY + (1 - window.PLAYER_TRACKER_MIN_OPACITY) * relOpacity;

    // marker itself
    var icon = playerData.team === 'RESISTANCE' ?  new plugin.playerTracker.iconRes() :  new plugin.playerTracker.iconEnl();
    // as per OverlappingMarkerSpiderfier docs, click events (popups, etc) must be handled via it rather than the standard
    // marker click events. so store the popup text in the options, then display it in the oms click handler
    var m = L.marker(gllfe(last), {icon: icon, referenceToPortal: closestPortal, opacity: absOpacity, desc: popup[0], title: tooltip});
    m.addEventListener('spiderfiedclick', plugin.playerTracker.onClickListener);

    // m.bindPopup(title);

    if (tooltip) {
      // ensure tooltips are closed, sometimes they linger
      m.on('mouseout', function() { $(this._icon).tooltip('close'); });
    }

    playerData.marker = m;

    m.addTo(playerData.team === 'RESISTANCE' ? plugin.playerTracker.drawnTracesRes : plugin.playerTracker.drawnTracesEnl);
    window.registerMarkerForOMS(m);

    // jQueryUI doesn’t automatically notice the new markers
    if (!isTouchDev) {
      window.setupTooltips($(m._icon));
    }
  });

  // draw the poly lines to the map
  $.each(polyLineByAgeEnl, function(i, polyLine) {
    if(polyLine.length === 0) return true;

    var opts = {
      weight: 2-0.25*i,
      color: PLAYER_TRACKER_LINE_COLOUR,
      clickable: false,
      opacity: 1-0.2*i,
      dashArray: "5,8"
    };

    $.each(polyLine,function(ind,poly) {
      L.polyline(poly, opts).addTo(plugin.playerTracker.drawnTracesEnl);
    });
  });
  $.each(polyLineByAgeRes, function(i, polyLine) {
    if(polyLine.length === 0) return true;

    var opts = {
      weight: 2-0.25*i,
      color: PLAYER_TRACKER_LINE_COLOUR,
      clickable: false,
      opacity: 1-0.2*i,
      dashArray: "5,8"
    };

    $.each(polyLine, function(ind,poly) {
      L.polyline(poly, opts).addTo(plugin.playerTracker.drawnTracesRes);
    });
  });
}

window.plugin.playerTracker.getPortalLink = function(data) {
  var position = data.latlngs[0];
  var ll = position.join(',');
  return $('<a>')
    .addClass('text-overflow-ellipsis')
    .css('max-width', '15em')
    .text(window.chat.getChatPortalName(data))
    .prop({
      title: window.chat.getChatPortalName(data),
      href: '/intel?ll=' + ll + '&pll=' + ll,
    })
    .click(function(event) {
      window.selectPortalByLatLng(position);
      event.preventDefault();
      return false;
    })
    .dblclick(function(event) {
      map.setView(position, 17)
      window.selectPortalByLatLng(position);
      event.preventDefault();
      return false;
    });
}

window.plugin.playerTracker.handleData = function(data) {
  if(window.map.getZoom() < window.PLAYER_TRACKER_MIN_ZOOM) return;

  plugin.playerTracker.discardOldData();
  plugin.playerTracker.processNewData(data);
  if (!window.isTouchDevice()) plugin.playerTracker.closeIconTooltips();

  plugin.playerTracker.drawnTracesEnl.clearLayers();
  plugin.playerTracker.drawnTracesRes.clearLayers();
  plugin.playerTracker.drawData();
}

window.plugin.playerTracker.findUser = function(nick) {
  nick = nick.toLowerCase();
  var foundPlayerData = false;
  $.each(plugin.playerTracker.stored, function(plrname, playerData) {
    if (playerData.nick.toLowerCase() === nick) {
      foundPlayerData = playerData;
      return false;
    }
  });
  return foundPlayerData;
}

window.plugin.playerTracker.findUserPosition = function(nick) {
  var data = window.plugin.playerTracker.findUser(nick);
  if (!data) return false;

  var last = data.events[data.events.length - 1];
  return plugin.playerTracker.getLatLngFromEvent(last);
}

window.plugin.playerTracker.centerMapOnUser = function(nick) {
  var data = plugin.playerTracker.findUser(nick);
  if(!data) return false;

  var last = data.events[data.events.length - 1];
  var position = plugin.playerTracker.getLatLngFromEvent(last);

  if(window.isSmartphone()) window.show('map');
  window.map.setView(position, map.getZoom());

  if(data.marker) {
    window.plugin.playerTracker.onClickListener({target: data.marker});
  }
  return true;
}

window.plugin.playerTracker.onNicknameClicked = function(info) {
  if (info.event.ctrlKey || info.event.metaKey) {
    return !plugin.playerTracker.centerMapOnUser(info.nickname);
  }
  return true; // don't interrupt hook
}

window.plugin.playerTracker.onSearchResultSelected = function(result, event) {
  event.stopPropagation(); // prevent chat from handling the click

  if(window.isSmartphone()) window.show('map');

  // if the user moved since the search was started, check if we have a new set of data
  if(false === window.plugin.playerTracker.centerMapOnUser(result.nickname))
    map.setView(result.position);

  if(event.type == 'dblclick')
    map.setZoom(17);

  return true;
};

window.plugin.playerTracker.onSearch = function(query) {
  var term = query.term.toLowerCase();

  if (term.length && term[0] == '@') term = term.substr(1);

  $.each(plugin.playerTracker.stored, function(nick, data) {
    if(nick.toLowerCase().indexOf(term) === -1) return;

    var event = data.events[data.events.length - 1];

    query.addResult({
      title: '<mark class="nickname help '+TEAM_TO_CSS[getTeam(data)]+'">' + nick + '</mark>',
      nickname: nick,
      description: data.team.substr(0,3) + ', last seen ' + unixTimeToDateTimeString(event.time),
      position: plugin.playerTracker.getLatLngFromEvent(event),
      onSelected: window.plugin.playerTracker.onSearchResultSelected,
    });
  });
}

window.plugin.playerTracker.setupUserSearch = function() {
  addHook('nicknameClicked', window.plugin.playerTracker.onNicknameClicked);
  addHook('search', window.plugin.playerTracker.onSearch);
}


var setup = plugin.playerTracker.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
