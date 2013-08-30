// ==UserScript==
// @id             iitc-plugin-raw-portal-data
// @name           IITC plugin: Debug: Raw portal JSON data
// @category       Debug
// @version        0.2.1.@@DATETIMEVERSION@@
// @namespace      rawdata
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Developer debugging aid: Adds a link to the portal details to show the raw data of a portal
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.rawdata = function() {};

window.plugin.rawdata.setupCallback = function() {
	addHook('portalDetailsUpdated', window.plugin.rawdata.addLink);
}

window.plugin.rawdata.addLink = function(d) {
    var guidString = JSON.stringify(window.selectedPortal, null, 2);
    guidString = encodeURIComponent('"guid": ' + guidString);

    var detailsString = JSON.stringify(d.portalDetails, null, 2);
    detailsString = encodeURIComponent('"portalDetails": ' + detailsString);

    var linksString = "";
    $.each(window.links, function(it, link) {
        var guid = link.options.guid;
        link = link.options.data;
        if (link.edge.destinationPortalGuid == window.selectedPortal ||
        		link.edge.originPortalGuid == window.selectedPortal) {
        	linksString += encodeURIComponent('"' + guid + '": ' + JSON.stringify(link, null, 2) + '\n');
            if (it != guid) { // assertion
                console.log(error);
            }
        }
    });

    var fieldsString = "";
    $.each(window.fields, function(it, field) {
        var guid = field.options.guid;
        field = field.options.data;
        if (field.capturedRegion.vertexA.guid == window.selectedPortal ||
        		field.capturedRegion.vertexB.guid == window.selectedPortal ||
        		field.capturedRegion.vertexC.guid == window.selectedPortal) {
        	fieldsString += encodeURIComponent('"' + guid + '": ' + JSON.stringify(field, null, 2) + '\n');
            if (it != guid) { // assertion
                console.log(error);
            }
        }
    });
    
    var linkParam = '\'' + d.portalDetails.portalV2.descriptiveText.TITLE + '\',' +
        '\''+ guidString + '\',' +
        '\'' + detailsString + '\',' +
        '\'' + linksString + '\',' +
        '\'' + fieldsString + '\'';
    $('.linkdetails').append('<aside><a onclick="window.plugin.rawdata.getRawData('+ linkParam + ')" title="Display raw data of the portal">Raw Data</a></aside>');
}

window.plugin.rawdata.getRawData = function(title, guid, details, links, fields) {
    dialog({
        title: 'Raw Data: '+
        	title +
        	' (' +
        	decodeURIComponent(guid) +
        	')',
        html: '<pre>' +
        	decodeURIComponent(guid) + '\n' +
        	decodeURIComponent(details) + '\n\n' +
        	decodeURIComponent(links) + '\n\n' +
        	decodeURIComponent(fields) + '\n\n' +
        '</pre>',
        id: 'dialog-rawdata',
        dialogClass: 'ui-dialog-rawdata',
    });
}

var setup = function () {
    window.plugin.rawdata.setupCallback();
    $('head').append('<style>' +
    	'.ui-dialog-rawdata {' +
        	'width: auto !important;' +
        	'min-width: 400px !important;' +
        	//'max-width: 600px !important;' +
        '}' +
    	'#dialog-rawdata {' +
        	'overflow-x: auto;' +
			'overflow-y: auto;' +
        '}' +
		'</style>');
}


// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
