// ==UserScript==
// @id             iitc-plugin-show-address@vita10gy
// @name           iitc: show portal address in sidebar
// @version        0.2.1
// @namespace      https://github.com/breunigs/ingress-intel-total-conversion
// @updateURL      https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/show-address.user.js
// @downloadURL    https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/show-address.user.js
// @description    Portal address will show in the sidebar.
// @include        https://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// ==/UserScript==

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalAddress = function() {};

window.plugin.portalAddress.portalDetail = function(data) {
  // If there's 4 sets of comma delimieted info the last one is the
  // country, so get rid of it. If the country is in the [2] then it
  // doesn't matter because address is usually short enough to fit.
  var d = data.portalDetails.portalV2;
  var address = d.descriptiveText.ADDRESS.split(',').splice(0,3).join(',');
  $('.imgpreview').append('<div id="address">'+address+'</div>');
}

var setup =  function() {
  window.addHook('portalDetailsUpdated', window.plugin.portalAddress.portalDetail);
  $('head').append('<style>' +
    '.res #address { border: 1px solid #0076b6; }' +
    '.enl #address { border: 1px solid #017f01; }' +
    '#address { margin:5px; padding:3px; margin-top:120px; margin-right:8px; font-size:11px; background-color:rgba(0, 0, 0, 0.7); text-align:center; white-space:nowrap; overflow:hidden; }' +
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
