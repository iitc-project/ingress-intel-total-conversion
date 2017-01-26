//==UserScript==
//@id             iitc-plugin-highlight-by-age@3ch01c
//@name           IITC plugin: highlight old portals
//@category       Highlighter
//@version        0.1.0.20130928.61935
//@namespace      https://github.com/jonatkins/ingress-intel-total-conversion
//@updateURL      none
//@downloadURL    none
//@description    [local-2013-09-28-061935] Uses the fill color of the portals to show old portals. Red = over 20 days, orange = over 10 days, yellow = over 5 days
//@include        https://www.ingress.com/intel*
//@include        http://www.ingress.com/intel*
//@match          https://www.ingress.com/intel*
//@match          http://www.ingress.com/intel*
//@grant          none
//==/UserScript==


function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};



//PLUGIN START ////////////////////////////////////////////////////////

//use own namespace for plugin
window.plugin.portalHighlighterByAge = function() {};

window.plugin.portalHighlighterByAge.highlight = function(data) {
	var d = data.portal.options.details;
	if(getTeam(d) !== 0) {
		// get portal age
		var age_in_days =  Math.floor((new Date().getTime() - d.captured.capturedTime)/(24*60*60*1000));
		var color = 'red';
		var fill_opacity = age_in_days*.85/20 + .15;
		// Apply colour to portal.
		var params = {fillColor: color, fillOpacity: fill_opacity};
		data.portal.setStyle(params);
	}
}

var setup =  function() {
	window.addPortalHighlighter('Age', window.plugin.portalHighlighterByAge.highlight);
}

//PLUGIN END //////////////////////////////////////////////////////////


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


