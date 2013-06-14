// ==UserScript==
// @id                      portals-shields@fedepupo.it
// @name                    IITC plugin: portal's mitigation
// @version                 0.2.0.20130615.005000
// @description             The plugins show the portal's mitigation (link+shields) on map  
// @updateURL               http://www.fedepupo.it/ingress/portals-shields.user.js
// @downloadURL             http://www.fedepupo.it/ingress/portals-shields.user.js
// @include                 https://www.ingress.com/intel*
// @include                 http://www.ingress.com/intel*
// @match                   https://www.ingress.com/intel*
// @match                   http://www.ingress.com/intel*
// ==/UserScript==

/*********************************************************************************************************
* Changelog:
*
* 0.2.0 calculating total mitigation = shields + link
* 0.1.2 fix error "Nan"
* 0.1.1 fix label
* 0.1.0 First public release
*********************************************************************************************************/

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
        
    var cent_per_cent = 1;
    var r = d.portalV2.linkedModArray;
    
    //shield's mitigation
    $.each(r, function(ind, shield){
            if (!shield) return true;
            if(Math.floor(shield.stats.MITIGATION) > 0){                   
                cent_per_cent = cent_per_cent*((100-Math.floor(shield.stats.MITIGATION))/100);
            }
    });
    
    var links = d.portalV2.linkedEdges;
    var n_links = 0;
    $.each(links, function(ind, link){
            n_links = n_links+1; 
    });
    //link's mitigation
    var mitigation_links = (100-(Math.log(n_links+1)*25))/100;    
    
      
    var text_mitigation = '';
    if(cent_per_cent*mitigation_links > 0){
        text_mitigation = '~'+(100-cent_per_cent*mitigation_links*100).toFixed(2)+'%'
    }else{
        text_mitigation = '0%'    
    }
    var level = L.marker(latLng, {
      icon: L.divIcon({
        className: 'plugin-portal-shields-mitigation',
        iconAnchor: [6,7],
        iconSize: [12,10],
        html: text_mitigation
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
            font-size: 12px;\
            line-height: 13px;\
            left: -19px;\
            width: 50px !important;\
            color: #FFFFFF;\
            font-family: monospace;\
            font-weigth: bold;\
            text-align: center;\
            text-shadow: 0 0 0.5em black, 0 0 0.5em black, 0 0 0.5em black;\
            pointer-events: none;\
            -webkit-text-size-adjust:none;\
          }")
  .appendTo("head");

  window.addLayerGroup('Portal Shields', window.plugin.portalShieldsMitigation.levelLayerGroup, true);

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


