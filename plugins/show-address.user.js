// ==UserScript==
// @id             iitc-plugin-show-address@vita10gy
// @name           IITC plugin: show portal address in sidebar
// @category       Deleted
// @version        0.3.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@]
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalAddress = function() {};

window.plugin.portalAddress.portalDetail = function(data) {
  // If there's 4 sets of comma delimited info the last one is the
  // country, so get rid of it. If the country is in the [2] then it
  // doesn't matter because address is usually short enough to fit.
  var d = data.portalDetails;
  $.ajax({url: "http://maps.googleapis.com/maps/api/geocode/json?latlng="+(d.latE6/1e6)+","+(d.lngE6/1e6)+"&sensor=false"})
  .done(function( data ) {
      var address = data.results[0].formatted_address;
      if (address) {
        address = address.split(',').splice(0,3).join(',');
        $('.imgpreview').append('<div id="address">'+address+'</div>');
      }
    });

}

var setup =  function() {
  window.addHook('portalDetailsUpdated', window.plugin.portalAddress.portalDetail);
  $('head').append('<style>' +
    '.res #address { border: 1px solid #0076b6; }' +
    '.enl #address { border: 1px solid #017f01; }' +
    '#address { position: absolute; bottom: 0; left: 5px; right: 8px; padding: 3px; font-size: 11px; background-color: rgba(0, 0, 0, 0.7); text-align: center; overflow: hidden; }' +
    '</style>');
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@