// ==UserScript==
// @id             iitc-plugin-basemap-gmaps-gray@jacob1123
// @name           IITC plugin: Gray Google Roads
// @category       Map Tiles
// @version        0.1.0.20130724.0
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @description    Add a simplified gray Version of Google map tiles as an optional layer
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==


function wrapper() {
	// ensure plugin framework is there, even if iitc is not yet loaded
	if(typeof window.plugin !== 'function') window.plugin = function() {};

    // PLUGIN START ////////////////////////////////////////////////////////
    
    // use own namespace for plugin
    window.plugin.grayGMaps = function() {};
	window.plugin.grayGMaps.addLayer = function() {
        var grayGMaps = new L.Google('ROADMAPS',{maxZoom:20});
        grayGMaps._styles = [{featureType:"landscape.natural",stylers:[{visibility:"simplified"},{saturation:-100},{lightness:-80},{gamma:2.44}]},{featureType:"road",stylers:[{visibility:"simplified"},{color:"#bebebe"},{weight:.6}]},{featureType:"poi",stylers:[{saturation:-100},{visibility:"on"},{gamma:.14}]},{featureType:"water",stylers:[{color:"#32324f"}]},{featureType:"transit",stylers:[{visibility:"off"}]},{featureType:"road",elementType:"labels",stylers:[{visibility:"off"}]},{featureType:"poi",elementType:"labels",stylers:[{visibility:"off"}]},{featureType:"poi"},{featureType:"landscape.man_made",stylers:[{saturation:-100},{gamma:.13}]},{featureType:"water",elementType:"labels",stylers:[{visibility:"off"}]}]

  		layerChooser.addBaseLayer(grayGMaps, "Google Gray");
	};

	var setup =  window.plugin.grayGMaps.addLayer;
	
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

