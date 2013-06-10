// ==UserScript==
// @id                      portals-shields@fedepupo.it
// @name                    IITC plugin: Portal's shields
// @version                 0.1.0.20130609.010500
// @description             The plugins show the portal's shiedls mitigation on map  
// @updateURL               http://www.fedepupo.it/ingress/portals-shields.user.js
// @downloadURL             http://www.fedepupo.it/ingress/portals-shields.user.js
// @include                 https://www.ingress.com/intel*
// @include                 http://www.ingress.com/intel*
// @match                   https://www.ingress.com/intel*
// @match                   http://www.ingress.com/intel*
// ==/UserScript==

function wrapper() {
if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalShieldsMitigation = function() {};

window.plugin.portalShieldsMitigation.levelLayers = {};
window.plugin.portalShieldsMitigation.levelLayerGroup = new L.LayerGroup();

// Use portal add and remove event to control render of portal level numbers
window.plugin.portalShieldsMitigation.portalAdded = function(data) {
  data.portal.on('add', function() {
    plugin.portalShieldsMitigation.renderLevel(this.options.guid, this.getLatLng());
  });

  data.portal.on('remove', function() {
    plugin.portalShieldsMitigation.removeLevel(this.options.guid);
  });
}

window.plugin.portalShieldsMitigation.renderLevel = function(guid,latLng) {
    plugin.portalShieldsMitigation.removeLevel(guid);

    var d = window.portals[guid].options.details;
    var levelNumber = Math.floor(window.getPortalLevel(d));
    
    var mitigation = 0;        
    var r = d.portalV2.linkedModArray;
    $.each(r, function(ind, shield){
            if (!shield) return true;
            mitigation = mitigation + Math.floor(shield.stats.MITIGATION);                       
    });
                
    var level = L.marker(latLng, {
      icon: L.divIcon({
        className: 'plugin-portal-shields-mitigation',
        iconAnchor: [6,7],
        iconSize: [12,10],
        html: mitigation
        }),
      guid: guid
      });

    plugin.portalShieldsMitigation.levelLayers[guid] = level;
    level.addTo(plugin.portalShieldsMitigation.levelLayerGroup);
}

window.plugin.portalShieldsMitigation.removeLevel = function(guid) {
    var previousLayer = plugin.portalShieldsMitigation.levelLayers[guid];
    if(previousLayer) {
      plugin.portalShieldsMitigation.levelLayerGroup.removeLayer(previousLayer);
      delete plugin.portalShieldsMitigation.levelLayers[guid];
    }
}

var setup =  function() {
  $("<style>")
    .prop("type", "text/css")
    .html(".plugin-portal-shields-mitigation {\
            font-size: 10px;\
            left: -4px;\
            width: 20px !important;\
            color: #FFFFBB;\
            font-family: monospace;\
            text-align: center;\
            text-shadow: 0 0 0.5em black, 0 0 0.5em black, 0 0 0.5em black;\
            pointer-events: none;\
            -webkit-text-size-adjust:none;\
          }")
  .appendTo("head");

  window.addLayerGroup('Portal Levels', window.plugin.portalShieldsMitigation.levelLayerGroup, true);

  window.addHook('portalAdded', window.plugin.portalShieldsMitigation.portalAdded);
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

