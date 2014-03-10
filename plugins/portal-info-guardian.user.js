// ==UserScript==
// @id             iitc-plugin-guardian-info@optimator
// @name           IITC plugin: Show information for guardian portal
// @category       Portal Info
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Show information for guardian portal, such as goal dates, days remaining, days held, percentage completion.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.guardianInfo = function() {};
window.plugin.guardianInfo.guardianTxt = '<br />Not Initialized.';
window.plugin.guardianInfo.owner = '';
window.plugin.guardianInfo.capturedDisplay = '';
window.plugin.guardianInfo.portalTitle = '';
window.plugin.guardianInfo.capturedAge = '';
    
//our function for pulling and setting up the needed data (called on portalDetailsUpdated)
window.plugin.guardianInfo.portalDetail = function(data)
{
  var d = data.portalDetails;
  if (d.captured)
  {
    var curDate = Date.now();
    var capturedTS = d.captured.capturedTime;

    window.plugin.guardianInfo.owner = d.captured.capturingPlayerId;
    window.plugin.guardianInfo.portalTitle = d.descriptiveText.map.TITLE;
    window.plugin.guardianInfo.capturedDisplay = unixTimeToDateTimeString(capturedTS, false);
    window.plugin.guardianInfo.capturedAge = formatInterval(Math.floor((curDate - capturedTS)/1000), 3);
	window.plugin.guardianInfo.guardianTxt = '';
      
    //goals data
    var goals = [
                  {days:   3, badge: 'Bronze',   imgURL: 'http://niantic.schlarp.com/_media/investigation:apps:ingress:guardian1.png'},
                  {days:  10, badge: 'Silver',   imgURL: 'http://niantic.schlarp.com/_media/investigation:apps:ingress:guardian2.png'},
                  {days:  20, badge: 'Gold',     imgURL: 'http://niantic.schlarp.com/_media/investigation:apps:ingress:guardian3.png'},
                  {days:  90, badge: 'Platinum', imgURL: 'http://niantic.schlarp.com/_media/investigation:apps:ingress:guardian4.png'},
                  {days: 150, badge: 'Onyx',     imgURL: 'http://niantic.schlarp.com/_media/investigation:apps:ingress:guardian5.png'},
                ];

	
    window.plugin.guardianInfo.guardianTxt += '<tr>';
	window.plugin.guardianInfo.guardianTxt += '<th class="left">Goal</th>';
    window.plugin.guardianInfo.guardianTxt += '<th>Days</th>';
    window.plugin.guardianInfo.guardianTxt += '<th>Date</th>';
    window.plugin.guardianInfo.guardianTxt += '<th>Remaining</th>';
    window.plugin.guardianInfo.guardianTxt += '<th>Completeion</th>';
    window.plugin.guardianInfo.guardianTxt += '</tr>';

    //iterate goals
    for (var goalIndex in goals)
    {
		var goal = goals[goalIndex];
      	var unixTSDay = 60 * 60 * 24 * 1000;  //seconds in a unix day
      	var goalUnixVal = (goal['days'] * unixTSDay);
        var goalDate = +capturedTS + goalUnixVal;
        var goalDateDisplay = unixTimeToDateTimeString(goalDate, false);
        var goalDaysRemaining = goalDate - curDate;
        var goalDaysRemainingDisp = curDate < goalDate ? formatInterval(Math.floor((goalDaysRemaining)/1000), 3) : "ACHIEVED";
        var goalPct = curDate < goalDate ? (goalUnixVal - goalDaysRemaining) / goalUnixVal : 1;
		goalPct = Math.round(goalPct * 100);
        
        //construct the table rows
      	window.plugin.guardianInfo.guardianTxt += '<tr>';
        window.plugin.guardianInfo.guardianTxt += '<td class="left">' + '<img src="' + goal['imgURL'] + '" width="20"> ' + goal['badge'] + '</td>';
        window.plugin.guardianInfo.guardianTxt += '<td>' + goal['days'] + '</td>';
        window.plugin.guardianInfo.guardianTxt += '<td>' + goalDateDisplay + '</td>';
        window.plugin.guardianInfo.guardianTxt += '<td>' + goalDaysRemainingDisp + '</td>';
        window.plugin.guardianInfo.guardianTxt += '<td>' + goalPct + "%" + '</td>';
        window.plugin.guardianInfo.guardianTxt += '</tr>';
        
    }
    //console.log(window.plugin.guardianInfo.guardianTxt);
  }
}

//our function for displaying the data
window.plugin.guardianInfo.display = function()
{
  var html = '';
  html += "Owner: " + window.plugin.guardianInfo.owner + '<br \>';
  html += "Captured: " + window.plugin.guardianInfo.capturedDisplay + '<br \>';
  html += "Held for: " + window.plugin.guardianInfo.capturedAge + '<br \>';

  html += '<table>' + window.plugin.guardianInfo.guardianTxt + '</table>';

  if(window.useAndroidPanes()) {
    //$('<div id="portalslist" class="mobile">' + html + '</div>').appendTo(document.body);
  } else {
    dialog({
      html: '<div id="guardianinfo">' + html + '</div>',
      dialogClass: 'ui-dialog-guardianinfo',
      title: 'Guardian Info - ' + window.plugin.guardianInfo.portalTitle,
      id: 'guardian-info',
      width: 550
    });
  }

}

var setup =  function() {

  //hook the link into the toolbox area- TODO get it in the portal detail area instead?
  if(window.useAndroidPanes()) {
    //android.addPane("plugin-guardianinfo", "Guardian Info", "ic_action_paste");
    //addHook("paneChanged", window.plugin.guardianinfo.onPaneChanged);
  } else {
    $('#toolbox').append(' <a onclick="window.plugin.guardianInfo.display()" title="Display info for guardian">Guardian</a>');
    window.addHook('portalDetailsUpdated', window.plugin.guardianInfo.portalDetail);
  }

  //inject css styling
  $('head').append('<style>' +
    //'#guardianinfo.mobile {background: transparent; border: 0 none !important; height: 100% !important; width: 100% !important; left: 0 !important; top: 0 !important; position: absolute; overflow: auto; }' +
    '#guardianinfo table { margin-top:5px; border-collapse: collapse; empty-cells: show; width: 100%; clear: both; }' +
    '#guardianinfo table td, #guardianinfo table th {border-bottom: 1px solid #0b314e; padding:3px; color:white; background-color:#1b415e}' +
    //'#guardianinfo table tr.res td { background-color: #005684; }' +
    //'#guardianinfo table tr.enl td { background-color: #017f01; }' +
    //'#guardianinfo table tr.neutral td { background-color: #000000; }' +
    '#guardianinfo table th { text-align: center; }' +
    '#guardianinfo table td { text-align: center; }' +
    //'#guardianinfo table.portals td { white-space: nowrap; }' +
    '#guardianinfo table td.left { text-align: left;}' +
    '#guardianinfo table th.left { text-align: left;}' +
    //'#guardianinfo table .portalTitle { min-width: 120px !important; max-width: 240px !important; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }' +
    '#guardianinfo .disclaimer { margin-top: 10px; font-size:10px; }' +
    '</style>');
    
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
