// ==UserScript==
// @id             iitc-plugin-portals-list@teo96
// @name           IITC plugin: show list of portals
// @version        0.0.10.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Display a sortable list of all localized portails with team, level, resonators informations
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// ==/UserScript==

/* whatsnew
* 0.0.9 : bugs hunt
* 0.0.8 : Aborted to avoid problems with Niantic (export portals informations as csv or kml file)
* 0.0.7 : more informations avalaible via tooltips (who deployed, energy, ...), new E/AP column 
* 0.0.6 : Add power charge information into a new column + bugfix
* 0.0.5 : Filter portals by clicking on 'All portals', 'Res Portals' or 'Enl Portals'
* 0.0.4 : Add link to portals name, one click to display full information in portal panel, double click to zoom on portal, hover to show address
* 0.0.3 : sorting ascending/descending and add numbers of portals by faction on top on table
* 0.0.2 : add sorting feature when click on header column
* 0.0.1 : initial release, show list of portals with level, team, resonators and shield information
*
* Display code inspired from @vita10gy's scoreboard plugin : iitc-plugin-scoreboard@vita10gy - https://github.com/breunigs/ingress-intel-total-conversion
* Portal link code from xelio - iitc: AP List - https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/ap-list.user.js
*
* todo : export as GPX, Open in Google Maps, more statistics in the header, what else ?
*/ 

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalslist = function() {};
    
window.plugin.portalslist.listPortals = []; // structure : name, team, level, resonators = Array, Shields = Array, APgain
window.plugin.portalslist.sortOrder=-1;    
window.plugin.portalslist.enlP = 0;
window.plugin.portalslist.resP = 0;
window.plugin.portalslist.filter=0;

//fill the listPortals array with portals avalaible on the map (level filtered portals will not appear in the table)
window.plugin.portalslist.getPortals = function(){
    //filter : 0 = All, 1 = Res, 2 = Enl
    //console.log('** getPortals');
    var retval=false;
    
    window.plugin.portalslist.listPortals = [];
    //get portals informations from IITC
    $.each(window.portals, function(i, portal) {
        
        retval=true;
        var d = portal.options.details;   
        var name =  d.portalV2.descriptiveText.TITLE;
        var address = d.portalV2.descriptiveText.ADDRESS;
        var img = d.imageByUrl && d.imageByUrl.imageUrl ? d.imageByUrl.imageUrl : DEFAULT_PORTAL_IMG;
        var team = portal.options.team;
        switch (team){
            case 1 :
                window.plugin.portalslist.resP++;
                break;
            case 2 :
                window.plugin.portalslist.enlP++;
                break;
        }
        var level = getPortalLevel(d).toFixed(2);
        var guid = portal.options.guid;
        
        
        //get resonators informations
        var resonators = []; // my local resonator array : reso level, reso deployed by, distance to portal, energy total, max 
        var energy = 0;
        var maxenergy=0;
        $.each(portal.options.details.resonatorArray.resonators, function(ind, reso) {
            if(reso) {  
                resonators[ind] = [reso.level, window.getPlayerName(reso.ownerGuid), reso.distanceToPortal, reso.energyTotal, RESO_NRG[reso.level]];
                energy += reso.energyTotal;
                maxenergy += RESO_NRG[reso.level];
            } else { resonators[ind] = [0,'',0,0,0]; }
        }); 
        // Sort resonators array by resonator level
        resonators.sort(function (a, b) {return b[0] - a[0]});
        
        //get shield informations 
        var shields = [];
        $.each(d.portalV2.linkedModArray, function(ind, mod) {
            if (mod) 
                //shields[ind] = mod.rarity.capitalize().replace('_', ' ');
                shields[ind] = [mod.rarity.substr(0,1).capitalize(), getPlayerName(mod.installingUser)] ;
            else
                shields[ind] = ['', '']; 
        });
        
        var APgain= getAttackApGain(d).enemyAp;
        var thisPortal = {'portal':d,'name':name,'team':team,'level':level,'guid':guid, 'resonators':resonators,'energyratio' : Math.floor(energy/maxenergy*100), 'shields':shields, 'APgain':APgain, 'EAP' : (energy/APgain).toFixed(2), 'energy': energy, 'maxenergy':maxenergy, 'lat':portal._latlng.lat, 'lng':portal._latlng.lng, 'address': address, 'img' : img};
        window.plugin.portalslist.listPortals.push(thisPortal);
    });
    
    return retval;
}

window.plugin.portalslist.displayPL = function() {   
    // debug tools
    //var start = new Date().getTime();
    //console.log('***** Start ' + start);
    
    var html = '';
    window.plugin.portalslist.sortOrder=-1;
    window.plugin.portalslist.enlP = 0;
    window.plugin.portalslist.resP = 0;

    if (window.plugin.portalslist.getPortals()) {
       html += window.plugin.portalslist.portalTable('level', window.plugin.portalslist.sortOrder,window.plugin.portalslist.filter);
    } else {
    	html = '<table><tr><td>Nothing to Show !</td></tr></table>';
    };
    alert('<div id="portalslist">' + html + '</div>', true, function() {$(".ui-dialog").removeClass('ui-dialog-portalslist');});
    $(".ui-dialog").addClass('ui-dialog-portalslist');
  
    // Setup sorting
    $(document).on('click', '#portalslist table th', function() {    	
        $('#portalslist').html(window.plugin.portalslist.portalTable($(this).data('sort'),window.plugin.portalslist.sortOrder,window.plugin.portalslist.filter));
    });
    $(document).on('click', '#portalslist .filterAll', function() {    	
        $('#portalslist').html(window.plugin.portalslist.portalTable($(this).data('sort'),window.plugin.portalslist.sortOrder,0));
    });
    $(document).on('click', '#portalslist .filterRes', function() {    	
        $('#portalslist').html(window.plugin.portalslist.portalTable($(this).data('sort'),window.plugin.portalslist.sortOrder,1));
    });
    $(document).on('click', '#portalslist .filterEnl', function() {    	
        $('#portalslist').html(window.plugin.portalslist.portalTable($(this).data('sort'),window.plugin.portalslist.sortOrder,2));
    });
    
    //debug tools
    //end = new Date().getTime();
    //console.log('***** end : ' + end + ' and Elapse : ' + (end - start));
 }
    
window.plugin.portalslist.portalTable = function(sortBy, sortOrder, filter) {
    // sortOrder <0 ==> desc, >0 ==> asc, i use sortOrder * -1 to change the state
    window.plugin.portalslist.filter=filter;
    var portals=window.plugin.portalslist.listPortals;
        
    //Array sort
    window.plugin.portalslist.listPortals.sort(function(a, b) {
        var retVal = 0;
        switch (sortBy) {
            case 'names':
                retVal = a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
                break;
            case 'r1':
                retVal = b.resonators[0][0] - a.resonators[0][0];
                break;
            case 'r2':
                retVal = b.resonators[1][0] - a.resonators[1][0];
                break;
            case 'r3':
                retVal = b.resonators[2][0] - a.resonators[2][0];
                break;
            case 'r4':
                retVal = b.resonators[3][0] - a.resonators[3][0];
                break;
            case 'r5':
                retVal = b.resonators[4][0] - a.resonators[4][0];
                break;
            case 'r6':
                retVal = b.resonators[5][0] - a.resonators[5][0];
                break;
            case 'r7':
                retVal = b.resonators[6][0] - a.resonators[6][0];
                break;
            case 'r8':
                retVal = b.resonators[7][0] - a.resonators[7][0];
                break;
            case 's1':
                retVal = a.shields[0].toLowerCase() > b.shields[0].toLowerCase() ? -1 : 1;
                break;
            case 's2':
                retVal = a.shields[1].toLowerCase() > b.shields[1].toLowerCase() ? -1 : 1;
                break;
            case 's3':
                retVal = a.shields[2].toLowerCase() > b.shields[2].toLowerCase() ? -1 : 1;
                break;
            case 's4':
                retVal = a.shields[3].toLowerCase() > b.shields[3].toLowerCase() ? -1 : 1;
                break;
            default:
                retVal = b[sortBy] - a[sortBy];    
                break;
        } 
        if (sortOrder > 0) { retVal = -retVal} //thx @jonatkins
        return retVal;
    });  
    
    var sort = window.plugin.portalslist.portalTableSort;
    var html = window.plugin.portalslist.stats();
    html += '<table>'
    + '<tr><th ' + sort('names', sortBy, -1) + '>Portal</th>' 
    + '<th ' + sort('level', sortBy, -1) + '>Level</th>'
    + '<th title="Team" ' + sort('team', sortBy, -1) + '>T</th>'
    + '<th ' + sort('r1', sortBy, -1) + '>R1</th>'
    + '<th ' + sort('r2', sortBy, -1) + '>R2</th>'
    + '<th ' + sort('r3', sortBy, -1) + '>R3</th>'
    + '<th ' + sort('r4', sortBy, -1) + '>R4</th>'
    + '<th ' + sort('r5', sortBy, -1) + '>R5</th>'
    + '<th ' + sort('r6', sortBy, -1) + '>R6</th>'
    + '<th ' + sort('r7', sortBy, -1) + '>R7</th>'
    + '<th ' + sort('r8', sortBy, -1) + '>R8</th>'
    + '<th ' + sort('energyratio', sortBy, -1) + '>Energy</th>'
    + '<th ' + sort('s1', sortBy, -1) + '>S1</th>'
    + '<th ' + sort('s2', sortBy, -1) + '>S2</th>'
    + '<th ' + sort('s3', sortBy, -1) + '>S3</th>'
    + '<th ' + sort('s4', sortBy, -1) + '>S4</th>'
    + '<th ' + sort('APgain', sortBy, -1) + '>AP Gain</th>'
    + '<th title="Energy / AP Gain ratio" ' + sort('EAP', sortBy, -1) + '>E/AP</th></tr>';
    
    
    $.each(portals, function(ind, portal) {
        
        if (filter === 0 || filter === portal.team){
            html += '<tr class="' + (portal.team === 1 ? 'res' : (portal.team === 2 ? 'enl' : 'neutral')) + '">'
            + '<td style="">' + window.plugin.portalslist.getPortalLink(portal.portal, portal.guid) + '</td>'
            + '<td class="L' + Math.floor(portal.level) +'">' + portal.level + '</td>'
            + '<td style="text-align:center;">' + portal.team + '</td>';
            
            $.each([0, 1, 2, 3 ,4 ,5 ,6 ,7], function(ind, slot) {
                
                var title = 'title="owner: <b>' + portal.resonators[slot][1] + '</b><br>'
                + 'energy: ' + portal.resonators[slot][3] + ' / ' + portal.resonators[slot][4] + ' (' + Math.floor(portal.resonators[slot][3]/portal.resonators[slot][4]*100) + '%)<br>'
                + 'distance: ' + portal.resonators[slot][2] + 'm';
                
                html += '<td class="L' + portal.resonators[slot][0] +'" ' + title + '">' + portal.resonators[slot][0] + '</td>';
                
            });
            
            html += '<td style="cursor:help" title="' + portal.energy + ' / ' + portal.maxenergy +'">' + portal.energyratio  + '%</td>'
            + '<td style="cursor:help" title="'+ portal.shields[0][1] +'">' + portal.shields[0][0] + '</td>'
            + '<td style="cursor:help" title="'+ portal.shields[1][1] +'">' + portal.shields[1][0] + '</td>'
            + '<td style="cursor:help" title="'+ portal.shields[2][1] +'">' + portal.shields[2][0] + '</td>'
            + '<td style="cursor:help" title="'+ portal.shields[3][1] +'">' + portal.shields[3][0] + '</td>'
            + '<td>' + portal.APgain + '</td>'
            + '<td>' + portal.EAP + '</td>';
 
            html+= '</tr>';
        }
    });
    html += '</table>';
    
    //html += window.plugin.portalslist.exportLinks();
    
    html += '<div class="disclaimer">Click on portals table headers to sort by that column. '
      + 'Click on <b>All Portals, Resistant Portals, Enlightened Portals</b> to filter<br>'
      + 'Thanks to @vita10gy & @xelio for their IITC plugins who inspired me. A <a href="https://plus.google.com/113965246471577467739">@teo96</a> production. Vive la Résistance !</div>';

    window.plugin.portalslist.sortOrder = window.plugin.portalslist.sortOrder*-1;
    return html;
}

window.plugin.portalslist.stats = function(sortBy) {
    //console.log('** stats');
    var html = '<table><tr>'
    + '<td class="filterAll" style="cursor:pointer"  onclick="window.plugin.portalslist.portalTable(\'level\',-1,0)"><a href=""></a>All Portals : (click to filter)</td><td class="filterAll">' + window.plugin.portalslist.listPortals.length + '</td>'
    + '<td class="filterRes" style="cursor:pointer" class="sorted" onclick="window.plugin.portalslist.portalTable(\'level\',-1,1)">Resistant Portals : </td><td class="filterRes">' + window.plugin.portalslist.resP +' (' + Math.floor(window.plugin.portalslist.resP/window.plugin.portalslist.listPortals.length*100) + '%)</td>' 
    + '<td class="filterEnl" style="cursor:pointer" class="sorted" onclick="window.plugin.portalslist.portalTable(\'level\',-1,2)">Enlightened Portals : </td><td class="filterEnl">'+ window.plugin.portalslist.enlP +' (' + Math.floor(window.plugin.portalslist.enlP/window.plugin.portalslist.listPortals.length*100) + '%)</td>'  
    + '</tr>'
    + '</table>';
    return html;
}

//return Html generated to export links
window.plugin.portalslist.exportLinks = function(){
    var html='';
    var stamp = new Date().getTime();
    
    html+='<div><aside><a download="Ingress Export.csv" href="' + window.plugin.portalslist.export('csv') + '">Export as .csv</a></aside>' 
    + '<aside><a download="Ingress Export.kml" href="' + window.plugin.portalslist.export('kml') + '">Export as .kml</a></aside>'
    + '</div>';
    return html;
}

window.plugin.portalslist.export = function(fileformat){
    //alert('format :' + fileformat);
    var file = '';
    var uri = '';
    
    switch (fileformat) {
      case 'csv':
        file = window.plugin.portalslist.exportCSV();
      	break;
      case 'kml':
        file = window.plugin.portalslist.exportKML();
      	break;
    }
    
    if (file !== '') {
       //http://stackoverflow.com/questions/4639372/export-to-csv-in-jquery
       var uri = 'data:application/' + fileformat + 'csv;charset=UTF-8,' + encodeURIComponent(file);
       //window.open(uri);
    }
    return uri;
}
window.plugin.portalslist.exportCSV = function(){
    var csv = '';
    var filter = window.plugin.portalslist.filter;
    var portals = window.plugin.portalslist.listPortals;
   
   //headers
    csv += 'Portal\tLevel\tTeam\tR1\tR2\tR3\tR4\tR5\tR6\tR7\tR8\tEnergy\tS1\tS2\tS3\tS4\tAP Gain\tE/AP\tlat\tlong\n';
    
    $.each(portals, function(ind, portal) {
        
        if (filter === 0 || filter === portal.team){
            csv += portal.name + '\t' 
              + portal.level + '\t'
              + portal.team + '\t';
           
            $.each([0, 1, 2, 3 ,4 ,5 ,6 ,7], function(ind, slot) {
                csv += portal.resonators[slot][0] + '\t';
            });
            
            csv += portal.energyratio + '\t' + portal.shields[0][0] + '\t' + portal.shields[1][0] + '\t' + portal.shields[2][0] + '\t' + portal.shields[3][0] + '\t' + portal.APgain + '\t' + portal.EAP + '\t';
            csv += portal.lat + '\t' + portal.lng;
            csv += '\n';
        }  
    });
    
    return csv;
}

window.plugin.portalslist.exportKML = function(){
    var kml = '';
    var filter = window.plugin.portalslist.filter;
    // all portals informations are avalaible in the listPortals array
    var portals = window.plugin.portalslist.listPortals;
   
   //headers
    kml = '<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document>\n'
    + '<name>Ingress Export</name><description><![CDATA[Ingress Portals\nExported from IITC using the Portals-list plugin\n' + new Date().toLocaleString() + ']]></description>';
    
    // define colored markers as style0 (neutral), style1 (Resistance), style2 (Enlight)
    kml += '<Style id="style1"><IconStyle><Icon><href>http://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png</href></Icon></IconStyle></Style>'
    + '<Style id="style2"><IconStyle><Icon><href>http://maps.gstatic.com/mapfiles/ms2/micons/green-dot.png</href></Icon></IconStyle></Style>'
    + '<Style id="style0"><IconStyle><Icon><href>http://maps.gstatic.com/mapfiles/ms2/micons/pink-dot.png</href></Icon></IconStyle></Style>\n';
    
    $.each(portals, function(ind, portal) {
        // add the portal in the kml file only if part of the filter choice
        if (filter === 0 || filter === portal.team){
            // description contain picture of the portal, address and link to the Intel map
            var description = '<![CDATA['
            + '<div><table><tr><td><img style="width:100px" src="' + portal.img + '"></td><td>' + portal.address 
            + '<br><a href="https://www.ingress.com/intel?latE6=' + portal.lat*1E6 + '&lngE6=' + portal.lng*1E6 + '&z=17">Link to Intel Map</a></td></tr></table>'
            + ']]>';
            
            kml += '<Placemark><name>L' + Math.floor(portal.level) + ' - ' + portal.name + '</name>'
            + '<description>' +  description + '</description>'
            + '<styleUrl>#style' + portal.team + '</styleUrl>';
            
            //coordinates
            kml += '<Point><coordinates>' + portal.lng + ',' + portal.lat + ',0</coordinates></Point>';           
            kml += '</Placemark>\n';
        }  
    });
	kml += '</Document></kml>';
    return kml;
}

// A little helper functon so the above isn't so messy
window.plugin.portalslist.portalTableSort = function(name, by) {
  var retVal = 'data-sort="' + name + '"';
  if(name === by) {
    retVal += ' class="sorted"';
  }
  return retVal;
};

// portal link - single click: select portal
//               double click: zoom to and select portal
//               hover: show address
// code from getPortalLink function by xelio from iitc: AP List - https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/ap-list.user.js
window.plugin.portalslist.getPortalLink = function(portal,guid) {
 
    var latlng = [portal.locationE6.latE6/1E6, portal.locationE6.lngE6/1E6].join();
    var jsSingleClick = 'window.renderPortalDetails(\''+guid+'\');return false';
    var jsDoubleClick = 'window.zoomToAndShowPortal(\''+guid+'\', ['+latlng+']);return false';
    var perma = '/intel?latE6='+portal.locationE6.latE6+'&lngE6='+portal.locationE6.lngE6+'&z=17&pguid='+guid;
    
    //Use Jquery to create the link, which escape characters in TITLE and ADDRESS of portal
    var a = $('<a>',{
        "class": 'help',
        text: portal.portalV2.descriptiveText.TITLE,
        title: portal.portalV2.descriptiveText.ADDRESS,
        href: perma,
        onClick: jsSingleClick,
        onDblClick: jsDoubleClick
    })[0].outerHTML;
    var div = '<div style="max-height: 15px !important; min-width:140px !important;max-width:180px !important; overflow: hidden; text-overflow:ellipsis;">'+a+'</div>';
    return div;
}

var setup =  function() {
  $('#toolbox').append(' <a onclick="window.plugin.portalslist.displayPL(0)" title="Display a list of portals in the current view">Portals list</a>');
  $('head').append('<style>' + 
    '.ui-dialog-portalslist {position: absolute !important; top: 10px !important; left: 30px !important;max-width:800px !important; width:733px !important;}' + 
    '#portalslist table {margin-top:5px;	border-collapse: collapse; empty-cells: show; width:100%; clear: both;}' +
    '#portalslist table td, #portalslist table th {border-bottom: 1px solid #0b314e; padding:3px; color:white; background-color:#1b415e}' +
    '#portalslist table tr.res td {  background-color: #005684; }' +
    '#portalslist table tr.enl td {  background-color: #017f01; }' +
    '#portalslist table tr.neutral td {  background-color: #000000; }' +
    '#portalslist table th { text-align:center;}' +
    '#portalslist table td { text-align: center;}' +
    '#portalslist table td.L0 { cursor: help; background-color: #000000 !important;}' +
    '#portalslist table td.L1 { cursor: help; background-color: #FECE5A !important;}' +
	'#portalslist table td.L2 { cursor: help; background-color: #FFA630 !important;}' +
	'#portalslist table td.L3 { cursor: help; background-color: #FF7315 !important;}' +
	'#portalslist table td.L4 { cursor: help; background-color: #E40000 !important;}' +
	'#portalslist table td.L5 { cursor: help; background-color: #FD2992 !important;}' +
	'#portalslist table td.L6 { cursor: help; background-color: #EB26CD !important;}' +
    '#portalslist table td.L7 { cursor: help; background-color: #C124E0 !important;}' +
	'#portalslist table td.L8 { cursor: help; background-color: #9627F4 !important;}' + 
    '#portalslist table td:nth-child(1) { text-align: left;}' +
    '#portalslist table th { cursor:pointer; text-align: right;}' +
    '#portalslist table th:nth-child(1) { text-align: left;}' +
    '#portalslist table th.sorted { color:#FFCE00; }' +
    '#portalslist .filterAll { margin-top:10px;}' +
    '#portalslist .filterRes { margin-top:10px; background-color: #005684  }' +
    '#portalslist .filterEnl { margin-top:10px; background-color: #017f01  }' +
    '#portalslist .disclaimer { margin-top:10px; font-size:10px; }' +
    '</style>');
}

// PLUGIN END //////////////////////////////////////////////////////////

if(window.iitcLoaded && typeof setup === 'function') {
  setup();
} else {
  if(window.bootPlugins)
    window.bootPlugins.push(setup);
  else
    window.bootPlugins = [setup];
}
} // wrapper end
// inject code into site context
var script = document.createElement('script');
script.appendChild(document.createTextNode('('+ wrapper +')();'));
(document.body || document.head || document.documentElement).appendChild(script);
