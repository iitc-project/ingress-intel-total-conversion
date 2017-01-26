// ==UserScript==
// @id             iitc-plugin-eight-res-needed@cymric
// @name           IITC plugin: Eight Resonators Needed
// @category       Layer
// @version        0.1.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Shows how many lvl 8 resonators are missing to make a lvl 8 portal
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
window.plugin.eightResNeeded = function() {};

window.plugin.eightResNeeded.neededLayers = {};
window.plugin.eightResNeeded.neededLayerGroup = null;
window.plugin.eightResNeeded.DETAIL_MAP_ZOOM = 14;
window.plugin.eightResNeeded.DisplayEnum = {
  OFF : 0,
  ON : 1
};
    
// Use portal add and remove event to control render of needed resonators numbers
window.plugin.eightResNeeded.portalAdded = function(data) {
  data.portal.on('add', function() {
    plugin.eightResNeeded.renderNeeded(this.options.guid, this.getLatLng());
  });

  data.portal.on('remove', function() {
    plugin.eightResNeeded.removeNeeded(this.options.guid);
  });
}

window.plugin.eightResNeeded.getDisplay = function() {
  if (map.getZoom() >= window.plugin.eightResNeeded.DETAIL_MAP_ZOOM) {
    return window.plugin.eightResNeeded.DisplayEnum.OFF;
  }
  return window.plugin.eightResNeeded.DisplayEnum.ON;
}

window.plugin.eightResNeeded.renderNeeded = function(guid,latLng) {
    plugin.eightResNeeded.removeNeeded(guid);
    var d = window.portals[guid].options.details;
    var has_L8 = 0;
	var owner_res = "";
    var team = "";
	// only of the same team: && d.controllingTeam.team == PLAYER.team
	if(getTeam(d) !== 0) {
        team = d.controllingTeam.team ;
		$.each(d.resonatorArray.resonators, function(ind, reso) {
			  if(reso) {       
					var level = parseInt(reso.level);
					if(level == 8)
					{
						has_L8+=1;
						if ( reso.ownerGuid == PLAYER.guid ) {
							owner_res = "-own";
						}
					}
			  }
		});
    
		var resNeeded = 8-has_L8;
		if( resNeeded > 0) {
			var level = L.marker(latLng, {
			  icon: L.divIcon({
				className: 'plugin-eight-res-needed-'+team+owner_res,
				iconAnchor: [30,10],
				html:  "<div class='plugin-eight-res-label-"+team+owner_res+"'>-"+resNeeded+"</div>"
				}),
			  guid: guid
			  });
			plugin.eightResNeeded.neededLayers[guid] = level;
			level.addTo(plugin.eightResNeeded.neededLayerGroup);
        }
   }   
}

window.plugin.eightResNeeded.removeNeeded = function(guid) {
    var previousLayer = plugin.eightResNeeded.neededLayers[guid];
    if(previousLayer) {
      plugin.eightResNeeded.neededLayerGroup.removeLayer(previousLayer);
      delete plugin.eightResNeeded.neededLayers[guid];
    }
}

var setup =  function() {
  $("<style>")
    .prop("type", "text/css")
    .html(".plugin-eight-res-needed {\
            font-size: 12px;\
            color: #FFFFFF;\
            font-family: monospace;\
            text-align: center;\
            text-shadow: 2px 2px 1px rgba(0, 0, 0, 1), -2px -2px 1px rgba(0, 0, 0, 1) , -2px 2px 1px rgba(0, 0, 0, 1), 2px -2px 1px rgba(0, 0, 0, 1);\
            pointer-events: none;\
            -webkit-text-size-adjust:none;\
          }\
          .plugin-eight-res-needed-own {\
            font-size: 12px;\
            color: #FFD700;\
            font-family: monospace;\
            text-align: center;\
            text-shadow: 2px 2px 1px rgba(0, 0, 0, 1), -2px -2px 1px rgba(0, 0, 0, 1) , -2px 2px 1px rgba(0, 0, 0, 1), 2px -2px 1px rgba(0, 0, 0, 1);\
            pointer-events: none;\
            -webkit-text-size-adjust:none;\
          }\
		  .plugin-eight-res-label-ENLIGHTENED {\
            position:relative;\
            background-color:#014201;\
            opacity:.8;\
            border:0.5px solid #FFCE00;\
            width:22px;\
            text-align:center;\
            color:#FFFFFF;\
            text-align:center;\
            border-radius:6px;\
           }\
		  .plugin-eight-res-label-ENLIGHTENED-own {\
            position:relative;\
            background-color:#014201;\
            opacity:.8;\
            border:0.5px solid #FFCE00;\
            width:22px;\
            text-align:center;\
            color:#FFD700;\
            text-align:center;\
            border-radius:6px;\
           }\
		  .plugin-eight-res-label-RESISTANCE {\
            position:relative;\
            background-color:#003666;\
            opacity:.8;\
            border:0.5px solid #FFCE00;\
            width:22px;\
            text-align:center;\
            color:#FFFFFF;\
            text-align:center;\
            border-radius:6px;\
           }\
		  .plugin-eight-res-label-RESISTANCE-own {\
            position:relative;\
            background-color:#003666;\
            opacity:.8;\
            border:0.5px solid #FFCE00;\
            width:22px;\
            text-align:center;\
            color:#FFD700;\
            text-align:center;\
            border-radius:6px;\
           }")
  .appendTo("head");

  window.plugin.eightResNeeded.currentDisplay = window.plugin.eightResNeeded.getDisplay();
    
  window.plugin.eightResNeeded.neededLayerGroup = new L.LayerGroup();

  window.addLayerGroup('Still needed L8', window.plugin.eightResNeeded.neededLayerGroup, true);

  window.addHook('portalAdded', window.plugin.eightResNeeded.portalAdded);
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


