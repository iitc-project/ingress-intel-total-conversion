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
  $('.linkdetails').append('<aside><a onclick="window.plugin.rawdata.showPortalData(\''+window.selectedPortal+'\')" title="Display raw data of the portal">Raw Data</a></aside>');
}

window.plugin.rawdata.showPortalData = function(guid) {
  if (!window.portals[guid]) {
    console.warn ('Error: failed to find portal details for guid '+guid+' - failed to show debug data');
    return;
  }


  var d = window.portals[guid].options.details;
  var ts = window.portals[guid].options.timestamp;

  var title = 'Raw portal data: ' + (d.portalV2.descriptiveText.TITLE || '<no title>') + ' ('+guid+')';

  var body =
    '<b>Portal GUID</b>: <code>'+guid+'</code><br />' +
    '<b>Entity timestamp</b>: <code>'+ts+'</code> - '+new Date(ts).toLocaleString()+'<br />' + 
    '<pre>'+JSON.stringify(d,null,2)+'</pre>';

  body += '<p><b>Links referencing this portal</b></p>';
  var haslinks = false;
  for (var lguid in window.links) {
    var l = window.links[lguid];
    var ld = l.options.details;
    if (ld.edge.originPortalGuid == guid || ld.edge.destinationPortalGuid == guid) {
      body += '<b>Link GUID</b>: <code>'+l.options.guid+'</code><br /><pre>'+JSON.stringify(ld,null,2)+'</pre>';
      haslinks = true;
    }
  }
  if (!haslinks) body += '<p>No links to/from this portal</p>';

  body += '<p><b>Fields referencing this portal</b></p>';
  var hasfields = false;
  for (var fguid in window.fields) {
    var f = window.fields[fguid];
    var fd = f.options.details;
    if (fd.capturedRegion.vertexA.guid == guid ||
        fd.capturedRegion.vertexB.guid == guid ||
        fd.capturedRegion.vertexC.guid == guid) {
      body += '<b>Field guid</b>: <code>'+f.options.guid+'</code><br /><pre>'+JSON.stringify(fd,null,2)+'</pre>';
      hasfields = true;
    }
  }
  if (!hasfields) body += '<p>No fields linked to this portal</p>';

  dialog({
    title: title,
    html: body,
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
