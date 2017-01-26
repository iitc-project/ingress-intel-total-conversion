// ==UserScript==
// @id             iitc-plugin-portalpath@dch
// @name           IITC plugin: Create URL nave list of clicked on portals
// @version        0.0.0.1
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @description    [dch-2013-07-10] Create URL nave list of clicked on portals.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

/* whatsnew
* 0.0.0.1 : initial release
*/ 

/* Creates a file that contains a list of portals in the order you clicked on them.
   The file contains a sequence number, the portal name, a URL that should start the
   navigation app on a phone. So click on the portals in the order you want to visit
   them. Save the file. Copy the contents of the file into an email message and send
   to your phone. Then you can click on links and run navigation in the background
   while you ingress.
*/

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalpath = function() {};
window.plugin.portalpath.recording = 0;
window.plugin.portalpath.navData = '';
window.plugin.portalpath.prevPortal = '';
window.plugin.portalpath.count = 0;

window.plugin.portalpath.displayUI = function() {
  var html = '';
  window.plugin.portalpath.navData = '';
  window.plugin.portalpath.recording = 1;
  window.plugin.portalpath.count = 0;
  html += 'Press OK to create file';

  dialog({
    html: '<div id="portalpath">' + html + '</div>',
    dialogClass: 'ui-dialog-portalpath',
    title: 'Recording portals selected',
    id: 'portalpath',
  closeCallback: window.plugin.portalpath.writenavfile
  });
  
 }
 
window.plugin.portalpath.addPortalToList = function(portal) {
  var name = portal.portalDetails.portalV2.descriptiveText.TITLE;
  if((window.plugin.portalpath.recording == 1) && (name != window.plugin.portalpath.prevPortal)) {
    window.plugin.portalpath.prevPortal = name;
    var urlPrefix = 'https://maps.google.com/maps?daddr=';
    var urlSufix = '&t=m&f=d';
    var lat = portal.portalDetails.locationE6.latE6/1000000;
    var lng = portal.portalDetails.locationE6.lngE6/1000000;
//    var address = portal.portalDetails.portalV2.descriptiveText.ADDRESS;
	window.plugin.portalpath.count += 1;
	window.plugin.portalpath.navData += window.plugin.portalpath.count 
	     + ' '
		 + name
         + '\n' 
	     + urlPrefix
         + lat +','
         + lng 
         + urlSufix
//         + ',' + address 
         + '\n\n';
  };
  return true;
}
    
window.plugin.portalpath.writenavfile = function() {
	var textToWrite = window.plugin.portalpath.navData;
    var textFileAsBlob = new Blob([textToWrite], {type:'text/plain'});
    var fileNameToSaveAs = 'Ingress.nav';

    var downloadLink = document.createElement("a");
    downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
    downloadLink.download = fileNameToSaveAs;
    downloadLink.click();    
    window.plugin.portalpath.navData = '';
    window.plugin.portalpath.recording = 0;
	window.plugin.portalpath.count = 0;
}

var setup =  function() {
  $('#toolbox').append(' <a onclick="window.plugin.portalpath.displayUI()" title="Record nav URL list of clicked portals">Portal Record</a>');
  window.addHook('portalDetailsUpdated', function(data) {window.plugin.portalpath.addPortalToList(data)});
  $('head').append('<style>' +
    '.ui-dialog-portalpath {max-width: 800px !important; width: auto !important;}' +
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
