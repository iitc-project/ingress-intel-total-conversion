// ==UserScript==
// @id             iitc-plugin-coolclock@amsdams
// @name           IITC plugin: coolclock
// @category       Highlighter
// @version        0.0.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] displays ticking clock 
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==
@@PLUGINSTART@@
//PLUGIN START ////////////////////////////////////////////////////////
/* use own namespace for plugin */
window.plugin.coolClock = function () {};
window.plugin.coolClock.init = function () {
  var jqCookie = document.createElement('script');
  jqCookie.type = 'text/javascript';
  jqCookie.src = '//cdn.jsdelivr.net/jquery.cookie/1.3.1/jquery.cookie.js';
  jqCookie.appendChild(document.createTextNode('(' + wrapper + ')();'));
  (document.body || document.head || document.documentElement).appendChild(jqCookie);
  var jqCoolClock = document.createElement('script');
  jqCoolClock.type = 'text/javascript';
  jqCoolClock.src = '//cdn.jsdelivr.net/coolclock/2.1.4/coolclock.min.js';
  jqCoolClock.appendChild(document.createTextNode('(' + wrapper + ')();'));
  (document.body || document.head || document.documentElement).appendChild(jqCoolClock);
  /*PREPARE DIALOG, SO AFTERDRAGGING AND UPDATE DIALOG STAYS AT SAME LOCATION*/
  dialog({
    html: '<div>Loading...</div>',
    dialogClass: window.plugin.coolClock.dialogClass,
    title: window.plugin.coolClock.dialogName,
    draggable: true,
    id: window.plugin.coolClock.dialogId
  });
};
window.plugin.coolClock.updateDateTime = function () {
  window.plugin.coolClock.renderDialog();
};
window.plugin.coolClock.dialogId = 'coolclock';
window.plugin.coolClock.dialogClass = 'ui-dialog-' + window.plugin.coolClock.dialogId;
window.plugin.coolClock.dialogName = 'CoolClock Date time Info';
window.plugin.coolClock.renderDialog = function () {
  var lat = parseFloat($.cookie('ingress.intelmap.lat')) || 0.0,
    lng = parseFloat($.cookie('ingress.intelmap.lng')) || 0.0,
    timestamp = new Date().getTime() / 1000;
  /*USE GOOGLE SERVICE TIMEZONE INFO*/
  $.get('https://maps.googleapis.com/maps/api/timezone/json', {
    location: lat + ',' + lng,
    timestamp: timestamp,
    sensor: false
  }).done(
    function (json) {
      console.warn("data" + JSON.stringify(json));
      if (json.status=="OK"){
      /* DO SOME DATETIME TINKERING*/
        var offsetInSeconds = json.dstOffset + json.rawOffset,
          offsetInHours = offsetInSeconds / 60 / 60,
          now = new Date(),
          utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000),
          remoteDateTime = new Date(utc.getTime() + (offsetInHours * 60) * 60000);
        /* CALL METHOD TO FILL TE PREPARED DIALOG*/
        window.plugin.coolClock.updateDialog(remoteDateTime, json.timeZoneId, json.timeZoneName, offsetInHours);
      }else{
        $('#dialog-coolclock').html("<p>Response Wrong: " + json.status+"</p>");
      }
    }).fail(function (jqxhr, textStatus, error) {
      var err = textStatus + ', ' + error;
      $('#dialog-coolclock').html("<p>Request Failed: " + err+"</p>");
  });
};
window.plugin.coolClock.updateDialog = function (date, timeZoneId, timeZoneName, offset) {
  var coolClockMenuContainer = $('<div>')
    .append($('<canvas id=\'clk2\' style=\'display:block;background-color:#FFF\' class=\'CoolClock:swissRail:138:1:' + (offset) + '\'></canvas>'))
    .append($('<span class=\"canvas_caption">' + date.toLocaleString() + '<br/>' + timeZoneId + '<br/>' + timeZoneName + '</span>'));
  
  $('#dialog-coolclock').html(coolClockMenuContainer.clone().wrap('<div>').parent());
  /* IS SOMEHOW NEEDED TO RENDER THE COOLCLOCK CANVAS*/
  CoolClock.findAndCreateClocks();
};
var setup = function () {
  window.plugin.coolClock.init();
  /* BIND EVENT TO CALL COOLCLOCK*/
  window.addHook('mapDataRefreshStart', window.plugin.coolClock.updateDateTime);
};
// PLUGIN END //////////////////////////////////////////////////////////
@@PLUGINEND@@