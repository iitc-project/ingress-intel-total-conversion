// ==UserScript==
// @id             iitc-plugin-portals-count@yenky
// @name           IITC plugin: Show total counts of portals
// @version        0.0.2.20130325.135610
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Display a list of all localized portals by level and faction
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// ==/UserScript==

/* whatsnew
* 0.0.1 : initial release, show count of portals
* todo : 
*/ 

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalcounts = function() {};
    

//count portals for each level avalaible on the map
window.plugin.portalcounts.getPortals = function(){
    //console.log('** getPortals');
    var retval=false;
    window.plugin.portalcounts.enlP = 0;
    window.plugin.portalcounts.resP = 0;
    window.plugin.portalcounts.neuP = 0;
    
    window.plugin.portalcounts.PortalsEnl = new Array();
    window.plugin.portalcounts.PortalsEnl[1] = 0;
    window.plugin.portalcounts.PortalsEnl[2] = 0;
    window.plugin.portalcounts.PortalsEnl[3] = 0;
    window.plugin.portalcounts.PortalsEnl[4] = 0;
    window.plugin.portalcounts.PortalsEnl[5] = 0;
    window.plugin.portalcounts.PortalsEnl[6] = 0;
    window.plugin.portalcounts.PortalsEnl[7] = 0;
    window.plugin.portalcounts.PortalsEnl[8] = 0;
    window.plugin.portalcounts.PortalsRes= new Array();
    window.plugin.portalcounts.PortalsRes[1] = 0;
    window.plugin.portalcounts.PortalsRes[2] = 0;
    window.plugin.portalcounts.PortalsRes[3] = 0;
    window.plugin.portalcounts.PortalsRes[4] = 0;
    window.plugin.portalcounts.PortalsRes[5] = 0;
    window.plugin.portalcounts.PortalsRes[6] = 0;
    window.plugin.portalcounts.PortalsRes[7] = 0;
    window.plugin.portalcounts.PortalsRes[8] = 0;
    //get portals informations from IITC
    $.each(window.portals, function(i, portal) {
        
        retval=true;
	var d = portal.options.details;
        var team = portal.options.team;
        var level = getPortalLevel(d).toFixed();
        switch (team){
            case 1 :
                window.plugin.portalcounts.resP++;
		window.plugin.portalcounts.PortalsRes[level]++;
                break;
            case 2 :
                window.plugin.portalcounts.enlP++;
		window.plugin.portalcounts.PortalsEnl[level]++;
                break;
	    default:
		window.plugin.portalcounts.neuP++;
		break;
        }
        
    });
    var counts = '<table>';
    if(retval) {
	    counts += '<tr class="enl"><th colspan="2">Enlightment: '+window.plugin.portalcounts.enlP+' Portal(s)</th></tr>';
	    for (level in window.plugin.portalcounts.PortalsEnl) {
		counts += '<tr><td class="L'+level+'">Level '+level+'</td><td>'+window.plugin.portalcounts.PortalsEnl[level]+'</td></tr>';
	    }
	    counts += '<tr><td colspan="2">&nbsp</td></tr>';
	    counts += '<tr class="res"><th colspan="2">Resistance: '+window.plugin.portalcounts.resP+' Portal(s)</th></tr>';
	    for (level in window.plugin.portalcounts.PortalsRes) {
	        counts += '<tr><td class="L'+level+'">Level '+level+'</td><td>'+window.plugin.portalcounts.PortalsRes[level]+'</td></tr>';
	    }
	    counts += '<tr><td colspan="2">&nbsp</td></tr>';
	    counts += '<tr class="neutral"><th colspan="2">Neutral: '+window.plugin.portalcounts.neuP+' Portal(s)</th></tr>';
    } else
	counts += '<tr><td>No Portals in range !</td></tr>';
    counts += '</table>';
    counts += '<div class="disclaimer">Thanks to @teo96 for his plugin as base for me. Work done by <a href="https://plus.google.com/u/0/117983231123575373020">@yenky</a>. Be enlightened!</div>';
    alert('<div id="portalcounts">'+counts+'</div>');
}

var setup =  function() {
  $('body').append('<div id="portalcounts" style="display:none;"></div>');
  $('#toolbox').append('<a onclick="window.plugin.portalcounts.getPortals()">Portalcounts</a>');
  $('head').append('<style>' + 
    '#portalcounts table {margin-top:5px;	border-collapse: collapse; empty-cells: show; width:100%; clear: both;}' +
    '#portalcounts table td, #portalcounts table th {border-bottom: 1px solid #0b314e; padding:3px; color:white; background-color:#1b415e}' +
    '#portalcounts table tr.res th {  background-color: #005684; }' +
    '#portalcounts table tr.enl th {  background-color: #017f01; }' +
    '#portalcounts table tr.neutral th {  background-color: #000000; }' +
    '#portalcounts table th { text-align:center;}' +
    '#portalcounts table td { text-align: center;}' +
    '#portalcounts table td.L0 { background-color: #000000 !important;}' +
    '#portalcounts table td.L1 { background-color: #FECE5A !important;}' +
    '#portalcounts table td.L2 { background-color: #FFA630 !important;}' +
    '#portalcounts table td.L3 { background-color: #FF7315 !important;}' +
    '#portalcounts table td.L4 { background-color: #E40000 !important;}' +
    '#portalcounts table td.L5 { background-color: #FD2992 !important;}' +
    '#portalcounts table td.L6 { background-color: #EB26CD !important;}' +
    '#portalcounts table td.L7 { background-color: #C124E0 !important;}' +
    '#portalcounts table td.L8 { background-color: #9627F4 !important;}' + 
    '#portalcounts table td:nth-child(1) { text-align: left;}' +
    '#portalcounts table th:nth-child(1) { text-align: left;}' +
    '#portalcounts .disclaimer { margin-top:10px; font-size:10px; }' +
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
