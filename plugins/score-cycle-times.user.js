// ==UserScript==
// @id             iitc-plugin-score-cycle-times@jonatkins
// @name           IITC plugin: Show scoreboard cycle/checkpoint times
// @category       Info
// @version        0.2.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Show the times used for the septicycle and checkpoints for regional scoreboards.
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @include        https://*.ingress.com/mission/*
// @include        http://*.ingress.com/mission/*
// @match          https://*.ingress.com/mission/*
// @match          http://*.ingress.com/mission/*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.scoreCycleTimes = function() {};

window.plugin.scoreCycleTimes.CHECKPOINT = 5*60*60; //5 hours per checkpoint
window.plugin.scoreCycleTimes.CYCLE = 7*25*60*60; //7 25 hour 'days' per cycle


window.plugin.scoreCycleTimes.setup  = function() {

  // add a div to the sidebar, and basic style
  $('#sidebar').append('<div id="score_cycle_times_display"></div>');
  $('#score_cycle_times_display').css({'color':'#ffce00'});


  window.plugin.scoreCycleTimes.update();
};

window.plugin.scoreCycleTimes.formatTime = function(time) {
    var timeStr = unixTimeToString(time,true);
    timeStr = timeStr.replace(/:00$/,''); //FIXME: doesn't remove seconds from AM/PM formatted dates
    return timeStr;
}

window.plugin.scoreCycleTimes.showAllCheckPoints = function() {
  var now = new Date().getTime();

  var ts = Math.floor(now / (window.plugin.scoreCycleTimes.CYCLE*1000)) * (window.plugin.scoreCycleTimes.CYCLE*1000);

  var html = '<div>';
    var oldDat = "";
    for (var i=0;i<36;i++) {
        var tsStr = window.plugin.scoreCycleTimes.formatTime(ts);
        var currDat = tsStr.substring(0, 10);
        var currTime = tsStr.substring(11, 16);
        if (oldDat != currDat) {
            if (oldDat != "") {
                html += "<br/>";
            }
            html += '<span style="color:#bbbbbb">' + currDat + "</span> ";
            oldDat = currDat;
        }
        if (ts < now) {
            html += '<span style="color:#999999">' + currTime + '</span> ';
        } else {
           html += '<span style="color:rgb(255,206,0)">' + currTime + '</span> ';
        }
        ts += window.plugin.scoreCycleTimes.CHECKPOINT*1000;
    }
    html += '</div>';

  dialog({
    html: html,
    dialogClass: 'ui-dialog-scoreCycleTimes',
    title: 'All checkpoints in cycle'
  });
}

window.plugin.scoreCycleTimes.update = function() {

  // checkpoint and cycle start times are based on a simple modulus of the timestamp
  // no special epoch (other than the unix timestamp/javascript's 1970-01-01 00:00 UTC) is required

  // when regional scoreboards were introduced, the first cycle would have started at 2014-01-15 10:00 UTC - but it was
  // a few checkpoints in when scores were first added

  var now = new Date().getTime();

  var cycleStart = Math.floor(now / (window.plugin.scoreCycleTimes.CYCLE*1000)) * (window.plugin.scoreCycleTimes.CYCLE*1000);
  var cycleEnd = cycleStart + window.plugin.scoreCycleTimes.CYCLE*1000;

  var checkpointStart = Math.floor(now / (window.plugin.scoreCycleTimes.CHECKPOINT*1000)) * (window.plugin.scoreCycleTimes.CHECKPOINT*1000);
  var checkpointEnd = checkpointStart + window.plugin.scoreCycleTimes.CHECKPOINT*1000;


  var formatRow = function(label,time) {
    var timeStr = unixTimeToString(time,true);
    timeStr = timeStr.replace(/:00$/,''); //FIXME: doesn't remove seconds from AM/PM formatted dates

    return '<tr><td>'+label+'</td><td>'+timeStr+'</td></tr>';
  };

  var html = '<table>'
           + formatRow('Next checkpoint', checkpointEnd)
           + formatRow('Cycle end', cycleEnd)
           + '<tr><td colspan="2"><a onclick="window.plugin.scoreCycleTimes.showAllCheckPoints();return false;">Show all checkpoints in cycle</a></td></tr>'
           + '</table>';

  $('#score_cycle_times_display').html(html);

  setTimeout ( window.plugin.scoreCycleTimes.update, checkpointEnd-now);
};





var setup =  window.plugin.scoreCycleTimes.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
