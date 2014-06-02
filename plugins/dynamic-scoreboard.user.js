// ==UserScript==
// @id             iitc-plugin-Dynamic-Scoreboard@Costaspap
// @name           IITC plugin: Create a local scoreboard
// @category       Info
// @version        0.1.0.20140524.214738
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      https://secure.jonatkins.com/iitc/release/total-conversion-build.meta.js
// @downloadURL    https://secure.jonatkins.com/iitc/release/total-conversion-build.user.js
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==


// A plug in by Costaspap and harisbitsakou
function wrapper(plugin_info) {
    // ensure plugin framework is there, even if iitc is not yet loaded
    if(typeof window.plugin !== 'function') window.plugin = function() {};
    
    //PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
    //(leaving them in place might break the 'About IITC' page or break update checks)
    plugin_info.buildName = 'jonatkins';
    plugin_info.dateTimeVersion = '20140524.214738';
    plugin_info.pluginId = 'Dynamic Scoreboard';
    //END PLUGIN AUTHORS NOTE
    
    // PLUGIN START //
    
    // use own namespace for plugin
    window.plugin.scoreboard = function() {};
    
    
    
    
    
    //gets data of all the visible portals on the screen
    window.plugin.scoreboard.getPortals = function() {
        
        var retval=false;
        
        var displayBounds = map.getBounds();
        
        //variable declaration and set to zero
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
                case TEAM_RES:   //if the portal is captured by the resistance,increase each counter's value for resistance counters
                    window.plugin.scoreboard.healthRes += d.health;
                    window.plugin.scoreboard.resP++;
                    window.plugin.scoreboard.resPorLevels = window.plugin.scoreboard.resPorLevels + portal.options.level;
                    if(portal.options.level===8){window.plugin.scoreboard.resEightLevelP++;}
                    if(portal.options.level>window.plugin.scoreboard.maxRes){window.plugin.scoreboard.maxRes = portal.options.level;}
                    break;
                case TEAM_ENL:  //if the portal is captured by the enlightened,increase each counter's value for resistance counters
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
    
    //-----------------------------------------------------------
	
	var setup =  function() {
        if(window.useAndroidPanes()) { // use android panes,texture and style
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
                         '#scoreboard table tr.neutral td { background-color: #000000; }' +
                         '#scoreboard table th { text-align: center; }' +
                         '#scoreboard table td { text-align: center; }' +
                         '#scoreboard table.portals td { white-space: nowrap; }' +
                         '#scoreboard table td.portalTitle { text-align: left;}' +
                         '#scoreboard table th.sortable { cursor:pointer;}' +
                         '#scoreboard table th.portalTitle { text-align: left;}' +
                         '#scoreboard table .portalTitle { min-width: 120px !important; max-width: 240px !important; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }' +
                         '#scoreboard table .apGain { text-align: right !important; }' +
                         '#scoreboard .firstColumn { margin-top: 10px;}' +
                         '#scoreboard .disclaimer { margin-top: 10px; font-size:10px; }' +
                         '</style>');
    }
    
    
    // PLUGIN END //////////////////////////////////////////////////////////
    
    
    setup.info = plugin_info; //add the script info data to the function as a property
    if(!window.bootPlugins) window.bootPlugins = [];
    window.bootPlugins.push(setup);
    // if IITC has already booted, immediately run the 'setup' function
    if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);
    