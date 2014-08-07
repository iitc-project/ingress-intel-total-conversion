// ==UserScript==
// @id             iitc-plugin-scoreboard@vita10gy
// @name           IITC plugin: show a localized scoreboard.
// @version        0.2.0.@@DATETIMEVERSION@@
// @category       Info
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Display a scoreboard about all visible portals with statistics about both teams,like average portal level,link & field counts etc.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==
    
	
	@@PLUGINSTART@@
    // PLUGIN START //
    
    // use own namespace for plugin
    window.plugin.scoreboard = function() {};
    
    
    
    
    
    //gets data of all the visible portals on the screen
    window.plugin.scoreboard.getPortals = function() {
        
        var retval=false;
        
        var displayBounds = map.getBounds();
        
        
        window.plugin.scoreboard.enlP = 0;
        window.plugin.scoreboard.resP = 0;
        window.plugin.scoreboard.enlEightLevelP = 0;
        window.plugin.scoreboard.resEightLevelP = 0;
        window.plugin.scoreboard.enlPorLevels = 0;
        window.plugin.scoreboard.resPorLevels = 0;
        window.plugin.scoreboard.maxEnl=0;
        window.plugin.scoreboard.maxRes=0; 
        window.plugin.scoreboard.healthEnl = 0;
        window.plugin.scoreboard.healthRes = 0;   
        
        
         //get all portals on screen
        $.each(window.portals, function(i, portal) {
            // eliminate offscreen portals (selected, and in padding)
            if(!displayBounds.contains(portal.getLatLng())) return true;
            //if there are any portals return true
            retval=true;
			
			//variable that contains portal data
            var d = portal.options.data;
			
			//variable that contains each portal's team value
            var teamN = portal.options.team;
            
            switch (teamN) {   
                case TEAM_RES:  //if the portal is captured by the resistance,increase each counter's value for resistance counters
                    window.plugin.scoreboard.healthRes += d.health;
                    window.plugin.scoreboard.resP++;
                    window.plugin.scoreboard.resPorLevels = window.plugin.scoreboard.resPorLevels + portal.options.level;
                    if(portal.options.level===8){window.plugin.scoreboard.resEightLevelP++;}
                    if(portal.options.level>window.plugin.scoreboard.maxRes){window.plugin.scoreboard.maxRes = portal.options.level;}
                    break;
                case TEAM_ENL: //if the portal is captured by the enlightened,increase each counter's value for enlightened counters
                    window.plugin.scoreboard.healthEnl += d.health;
                    window.plugin.scoreboard.enlP++;
                    window.plugin.scoreboard.enlPorLevels = window.plugin.scoreboard.enlPorLevels + portal.options.level;
                    if(portal.options.level===8){window.plugin.scoreboard.enlEightLevelP++;}
                    if(portal.options.level>window.plugin.scoreboard.maxEnl){window.plugin.scoreboard.maxEnl = portal.options.level;}
                    break;
            }
            
            
            
            
            
            
        });
        
        return retval;
    } 
    
	// The final function that displays the scoreboard by calling the portalTable function
    window.plugin.scoreboard.displayScoreboard = function() {
        var html = '';
        
        // If there are not portals on screen,display "Nothing to show!"
        if (window.plugin.scoreboard.getPortals()) {
            html += window.plugin.scoreboard.portalTable();
        } else {
            html = '<table><tr><td>Nothing to show!</td></tr></table>';
        };
        
        if(window.useAndroidPanes()) {
            $('<div id="scoreboard" class="mobile">' + html + '</div>').appendTo(document.body);
        } else {
            dialog({
                html: '<div id="scoreboard">' + html + '</div>',
                dialogClass: 'ui-dialog-scoreboard',
                title: 'Scoreboard',
                id: 'Scoreboard',
                width: 700
            });
        }
    }
    
    
    
    //---- function that gets all visible enlightened links on screen
    window.plugin.scoreboard.getEnlLinks = function() {
        var displayBounds = map.getBounds();
        window.plugin.scoreboard.enlL=0;
        // now every link that starts/ends at a point on screen
        $.each(window.links, function(guid, link) {
            // only consider links that start/end on-screen
            var points = link.getLatLngs();
            if (displayBounds.contains(points[0]) || displayBounds.contains(points[1])) {
                if (link.options.team == TEAM_ENL) {
                    window.plugin.scoreboard.enlL++;
                } 
            }
        });
        return window.plugin.scoreboard.enlL;
    }
    
	
    //----function that gets all visible resistance links on screen
    window.plugin.scoreboard.getResLinks = function() {
        var displayBounds = map.getBounds();
        window.plugin.scoreboard.resL=0;
        // now every link that starts/ends at a point on screen
        $.each(window.links, function(guid, link) {
            // only consider links that start/end on-screen
            var points = link.getLatLngs();
            if (displayBounds.contains(points[0]) || displayBounds.contains(points[1])) {// boroume na kanoume ta 2 if ena
                if (link.options.team == TEAM_RES) {
                    window.plugin.scoreboard.resL++;
                } 
            }
        });
        return window.plugin.scoreboard.resL;
    }
    
    
    
    
    
    //----function that gets all visible enlightened fields on screen
    window.plugin.scoreboard.getEnlFields = function() {
        var displayBounds = map.getBounds();
        window.plugin.scoreboard.enlF=0;
        // and now all fields that have a vertex on screen
        $.each(window.fields, function(guid, field) {
            // only consider fields with at least one vertex on screen
            var points = field.getLatLngs();
            if (displayBounds.contains(points[0]) || displayBounds.contains(points[1]) || displayBounds.contains(points[2])) {
                if (field.options.team == TEAM_ENL) {
                    window.plugin.scoreboard.enlF++;
                } 
            }
        });
        return window.plugin.scoreboard.enlF;
    }
    
    
    
    //----function that gets all visible resistance fields on screen
    window.plugin.scoreboard.getResFields = function() {
        var displayBounds = map.getBounds();
        window.plugin.scoreboard.resF=0;
        // and now all fields that have a vertex on screen
        $.each(window.fields, function(guid, field) {
            // only consider fields with at least one vertex on screen
            var points = field.getLatLngs();
            if (displayBounds.contains(points[0]) || displayBounds.contains(points[1]) || displayBounds.contains(points[2])) {
                if (field.options.team == TEAM_RES) {
                    window.plugin.scoreboard.resF++;
                } 
            }
        });
        return window.plugin.scoreboard.resF;
    }
    
    
    
	// A function that creates the html code for the scoreboard table
	window.plugin.scoreboard.portalTable = function() { 
        

        // html variable declaration
        var html = "";
		// Create the header
        html += '<table class="portals">'
        + '<tr>'
        + '<th class="firstColumn">Metrics</th>'
        + '<th class="enl" >Enlightened</th>'
        + '<th class="res" >Resistance</th>'
        + '</tr>\n';
        
		// if blocks to avoid division by zero
        if(window.plugin.scoreboard.enlP!=0){
            var avgEnl = window.plugin.scoreboard.enlPorLevels/window.plugin.scoreboard.enlP;
                avgEnl = avgEnl.toFixed(1);
            var avgHealthEnl = window.plugin.scoreboard.healthEnl/window.plugin.scoreboard.enlP;
                avgHealthEnl = avgHealthEnl.toFixed(1) }
        else{
        var avgEnl = '-';
        var avgHealthEnl = '0';
            }
        
        if(window.plugin.scoreboard.resP!=0){
            var avgRes = window.plugin.scoreboard.resPorLevels/window.plugin.scoreboard.resP;
                avgRes = avgRes.toFixed(1);
            var avgHealthRes = window.plugin.scoreboard.healthRes/window.plugin.scoreboard.resP;
                avgHealthRes =  avgHealthRes.toFixed(1);
        } 
        else{
        var avgRes = '-';
        var avgHealthRes = '0';
            }
        
        
        // Get field-link count and assign them to variables
        var enlCountOfLinks= window.plugin.scoreboard.getEnlLinks();
        var resCountOfLinks= window.plugin.scoreboard.getResLinks();
        var enlCountOfFields= window.plugin.scoreboard.getEnlFields();
        var resCountOfFields= window.plugin.scoreboard.getResFields();
        
		// Creation of the html code
        html += '<tr><td class="firstColumn" style="text-align:center;">Number of Portals</td>'+'<td class="enl" style="text-align:center;">'
        +window.plugin.scoreboard.enlP+'</td>'+'<td class="res" style="text-align:center;">'+window.plugin.scoreboard.resP+'</td></tr>'
        +'<tr><td class="firstColumn" style="text-align:center;">Average Portal Level</td>'+'<td class="enl" style="text-align:center;">'
        +avgEnl+'</td>'+'<td class="res" style="text-align:center;">'+avgRes+'</td></tr>'
        +'<tr><td class="firstColumn" style="text-align:center;">Number of Level 8 Portals</td>'+'<td class="enl" style="text-align:center;">'
        +window.plugin.scoreboard.enlEightLevelP+'</td>'+'<td class="res" style="text-align:center;">'+window.plugin.scoreboard.resEightLevelP+'</td></tr>'
        +'<tr><td class="firstColumn" style="text-align:center;">Max Portal Level</td>'+'<td class="enl" style="text-align:center;">'
        +window.plugin.scoreboard.maxEnl+'</td>'+'<td class="res" style="text-align:center;">'+window.plugin.scoreboard.maxRes+'</td></tr>'
        +'<tr><td class="firstColumn" style="text-align:center;">Number of Links</td>'+'<td class="enl" style="text-align:center;">'
        +enlCountOfLinks+'</td>'+'<td class="res" style="text-align:center;">'+resCountOfLinks+'</td></tr>'
        +'<tr><td class="firstColumn" style="text-align:center;">Number of Fields</td>'+'<td class="enl" style="text-align:center;">'
        +enlCountOfFields+'</td>'+'<td class="res" style="text-align:center;">'+resCountOfFields+'</td></tr>'
        +'<tr><td class="firstColumn" style="text-align:center;">Average portal Health</td>'+'<td class="enl" style="text-align:center;">'
        +avgHealthEnl+'%</td>'+'<td class="res" style="text-align:center;">'+avgHealthRes+'%</td></tr>';
        
        
        
        html += '</table>';
        
        html += '<div class="disclaimer"><b>Zoom in for a more accurate scoreboard!</b></div>';
        
        return html;
    }
    
    
    
    var setup =  function() {
        if(window.useAndroidPanes()) {  // use android panes,texture and style
            android.addPane("plugin-Scoreboard", "Scoreboard", "ic_action_paste");
            addHook("paneChanged", window.plugin.scoreboard.onPaneChanged);
        } else {
            $('#toolbox').append(' <a onclick="window.plugin.scoreboard.displayScoreboard()" title="Display a dynamic scoreboard in the current view">Scoreboard</a>');
        }
        
        $('head').append('<style>' +   //set style for the scoreboard and its cells
                         '#scoreboard.mobile {background: transparent; border: 0 none !important; height: 100% !important; width: 100% !important; left: 0 !important; top: 0 !important; position: absolute; overflow: auto; }' +
                         '#scoreboard table { margin-top:5px; border-collapse: collapse; empty-cells: show; width: 100%; clear: both; }' +
                         '#scoreboard table td, #scoreboard table th {border-bottom: 1px solid #0b314e; padding:3px; color:white; background-color:#1b415e}' +
                         '#scoreboard table tr.res td { background-color: #005684; }' +
                         '#scoreboard table tr.enl td { background-color: #017f01; }' +
                         '#scoreboard table th { text-align: center; }' +
                         '#scoreboard table td { text-align: center; }' +
                         '#scoreboard table.portals td { white-space: nowrap; }' +
                         '#scoreboard .firstColumn { margin-top: 10px;}' +
                         '#scoreboard .disclaimer { margin-top: 10px; font-size:10px; }' +
                         '</style>');
    }
    
    
    // PLUGIN END //////////////////////////////////////////////////////////
    @@PLUGINEND@@

    