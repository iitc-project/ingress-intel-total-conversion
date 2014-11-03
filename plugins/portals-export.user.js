// ==UserScript==
// @id             iitc-plugin-portals-export@vbelozyorov
// @name           IITC plugin: Portals export
// @category       Portal Info
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Add tool to export list of all viewed portals in <title; link> format
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalsExport = function() {};

window.plugin.portalsExport.portals = [];

window.plugin.portalsExport.clear = function () {
    window.plugin.portalsExport.portals = {};
};

window.plugin.portalsExport.portalDetail = function (data) {
    window.plugin.portalsExport.portals[data.guid] = {
        title: data.portalDetails.title,
        lat: data.portalDetails.latE6 / 1000000,
        lng: data.portalDetails.lngE6 / 1000000
    };
};

window.plugin.portalsExport.optCopy = function() {
    var text = "";
    for (var i in window.plugin.portalsExport.portals) {
        var p = window.plugin.portalsExport.portals[i];
        text = text + p.title + "; " + 'https://ingress.com/intel?ll='+p.lat+','+p.lng+'&z=17&pll='+p.lat+','+p.lng + "\n";
    }

    dialog({
        html: '<p><a onclick="$(\'.ui-dialog-portalsExport-copy textarea\').select();">Select all</a> and press CTRL+C to copy it.</p><textarea readonly onclick="$(\'.ui-dialog-portalsExport-copy textarea\').select();">' + text + '</textarea>',
        width: 600,
        dialogClass: 'ui-dialog-portalsExport-copy',
        title: 'Portals export'
    });
}

// Manual export and reset data
window.plugin.portalsExport.manualOpt = function() {

  var html = '<div class="drawtoolsSetbox">'
           + '<a onclick="window.plugin.portalsExport.optCopy();" tabindex="0">Copy Portals info</a>'
           + '<a onclick="window.plugin.portalsExport.clear();return false;" tabindex="0">Clear Portals list</a>'
           + '</div>';

  dialog({
    html: html,
    dialogClass: 'ui-dialog-portalsExport',
    title: 'Portals Export Options'
  });
}

var setup =  function(){
    window.addHook('portalDetailsUpdated', window.plugin.portalsExport.portalDetail);

    //add options menu
    $('#toolbox').append('<a onclick="window.plugin.portalsExport.manualOpt();return false;">Portals export</a>');

    $('head').append('<style>' +
        '.ui-dialog-portalsExport-copy textarea { width:96%; height:250px; resize:vertical; }'+
        '</style>');

};

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
