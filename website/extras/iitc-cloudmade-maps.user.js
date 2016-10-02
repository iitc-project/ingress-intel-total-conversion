// ==UserScript==
// @id             iitc-plugin-cloudmade-maps
// @name           IITC plugin: CloudMade.com maps
// @version        0.0.1
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @description    Adds back CloudMade.com map layers - 
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// ==/UserScript==

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////

window.plugin.mapCloudMade = function() {};

window.plugin.mapCloudMade.setup = function() {
  //**** CloudMade settings start ****
  //set this to your API key - get an API key by registering at www.cloudmade.com
  //e.g. var cmApiKey = '8ee2a50541944fb9bcedded5165f09d9';
  var cmApiKey = 'YOUR_API_KEY';
  //the list of styles you'd like to see
  var cmStyles = {
    '999': "Midnight",
    '22677': "Minimal",
    '78603': "Armageddon",
  };
  //**** CloudMade settings end ****

  var osmAttribution = 'Map data © OpenStreetMap contributors';
  var cmOpt = {attribution: osmAttribution+', Imagery © CloudMade', maxZoom: 18, apikey: cmApiKey};

  $.each(cmStyles, function(key,value) {
    cmOpt['style'] = key;
    var cmMap = new L.TileLayer('http://{s}.tile.cloudmade.com/{apikey}/{style}/256/{z}/{x}/{y}.png', cmOpt);
    layerChooser.addBaseLayer(cmMap, 'CloudMade '+value);
  });

};

var setup = window.plugin.mapCloudMade.setup;

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
