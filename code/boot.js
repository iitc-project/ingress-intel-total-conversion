/// SETUP /////////////////////////////////////////////////////////////
// these functions set up specific areas after the boot function
// created a basic framework. All of these functions should only ever
// be run once.

// Used to disable on multitouch devices
window.showZoom = true;
window.showLayerChooser = true;

window.setupLargeImagePreview = function() {
  $('#portaldetails').on('click', '.imgpreview', function() {
    var img = $(this).find('img')[0];
    var details = $(this).find('div.portalDetails')[0];
    //dialogs have 12px padding around the content
    var dlgWidth = Math.max(img.naturalWidth+24,500);
    if (details) {
      dialog({
        html: '<div style="text-align: center">' + img.outerHTML + '</div>' + details.outerHTML,
        title: $(this).parent().find('h3.title').text(),
        width: dlgWidth,
      });
    } else {
      dialog({
        html: '<div style="text-align: center">' + img.outerHTML + '</div>',
        title: $(this).parent().find('h3.title').text(),
        width: dlgWidth,
      });
    }
  });
}

// adds listeners to the layer chooser such that a long press hides
// all custom layers except the long pressed one.
window.setupLayerChooserSelectOne = function() {
  $('.leaflet-control-layers-overlays').on('click taphold', 'label', function(e) {
    if(!e) return;
    if(!(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.type === 'taphold')) return;
    var m = window.map;

    var add = function(layer) {
      if(!m.hasLayer(layer.layer)) m.addLayer(layer.layer);
    };
    var rem = function(layer) {
      if(m.hasLayer(layer.layer)) m.removeLayer(layer.layer);
    };

    var isChecked = $(e.target).find('input').is(':checked');
    var checkSize = $('.leaflet-control-layers-overlays input:checked').length;
    if((isChecked && checkSize === 1) || checkSize === 0) {
      // if nothing is selected or the users long-clicks the only
      // selected element, assume all boxes should be checked again
      $.each(window.layerChooser._layers, function(ind, layer) {
        if(!layer.overlay) return true;
        add(layer);
      });
    } else {
      // uncheck all
      var keep = $.trim($(e.target).text());
      $.each(window.layerChooser._layers, function(ind, layer) {
        if(layer.overlay !== true) return true;
        if(layer.name === keep) { add(layer);  return true; }
        rem(layer);
      });
    }
    e.preventDefault();
  });
}

// Setup the function to record the on/off status of overlay layerGroups
window.setupLayerChooserStatusRecorder = function() {
  // Record already added layerGroups
  $.each(window.layerChooser._layers, function(ind, chooserEntry) {
    if(!chooserEntry.overlay) return true;
    var display = window.map.hasLayer(chooserEntry.layer);
    window.updateDisplayedLayerGroup(chooserEntry.name, display);
  });

  // Record layerGroups change
  window.map.on('layeradd layerremove', function(e) {
    var id = L.stamp(e.layer);
    var layerGroup = this._layers[id];
    if (layerGroup && layerGroup.overlay) {
      var display = (e.type === 'layeradd');
      window.updateDisplayedLayerGroup(layerGroup.name, display);
    }
  }, window.layerChooser);
}

window.setupStyles = function() {
  $('head').append('<style>' +
    [ '#largepreview.enl img { border:2px solid '+COLORS[TEAM_ENL]+'; } ',
      '#largepreview.res img { border:2px solid '+COLORS[TEAM_RES]+'; } ',
      '#largepreview.none img { border:2px solid '+COLORS[TEAM_NONE]+'; } ',
      '#chatcontrols { bottom: '+(CHAT_SHRINKED+22)+'px; }',
      '#chat { height: '+CHAT_SHRINKED+'px; } ',
      '.leaflet-right { margin-right: '+(SIDEBAR_WIDTH+1)+'px } ',
      '#updatestatus { width:'+(SIDEBAR_WIDTH+2)+'px;  } ',
      '#sidebar { width:'+(SIDEBAR_WIDTH + HIDDEN_SCROLLBAR_ASSUMED_WIDTH + 1 /*border*/)+'px;  } ',
      '#sidebartoggle { right:'+(SIDEBAR_WIDTH+1)+'px;  } ',
      '#scrollwrapper  { width:'+(SIDEBAR_WIDTH + 2*HIDDEN_SCROLLBAR_ASSUMED_WIDTH)+'px; right:-'+(2*HIDDEN_SCROLLBAR_ASSUMED_WIDTH-2)+'px } ',
      '#sidebar > * { width:'+(SIDEBAR_WIDTH+1)+'px;  }'].join("\n")
    + '</style>');
}

window.setupMap = function() {
  $('#map').text('');

  //OpenStreetMap attribution - required by several of the layers
  osmAttribution = 'Map data © OpenStreetMap contributors';

  //MapQuest offer tiles - http://developer.mapquest.com/web/products/open/map
  //their usage policy has no limits (except required notification above 4000 tiles/sec - we're perhaps at 50 tiles/sec based on CloudMade stats)
  var mqSubdomains = [ 'otile1','otile2', 'otile3', 'otile4' ];
  var mqTileUrlPrefix = window.location.protocol !== 'https:' ? 'http://{s}.mqcdn.com' : 'https://{s}-s.mqcdn.com';
  var mqMapOpt = {attribution: osmAttribution+', Tiles Courtesy of MapQuest', maxZoom: 18, subdomains: mqSubdomains};
  var mqMap = new L.TileLayer(mqTileUrlPrefix+'/tiles/1.0.0/map/{z}/{x}/{y}.jpg',mqMapOpt);
  //MapQuest satellite coverage outside of the US is rather limited - so not really worth having as we have google as an option
  //var mqSatOpt = {attribution: 'Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency', mazZoom: 18, subdomains: mqSubdomains};
  //var mqSat = new L.TileLayer('http://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg',mqSatOpt);

  var views = [
    /*0*/ mqMap,
    /*1*/ new L.Google('INGRESS',{maxZoom:20}),
    /*2*/ new L.Google('ROADMAP',{maxZoom:20}),
    /*3*/ new L.Google('SATELLITE',{maxZoom:20}),
    /*4*/ new L.Google('HYBRID',{maxZoom:20}),
    /*5*/ new L.Google('TERRAIN',{maxZoom:15})
  ];


  window.map = new L.Map('map', $.extend(getPosition(),
    {zoomControl: window.showZoom, minZoom: 1}
  ));

  // add empty div to leaflet control areas - to force other leaflet controls to move around IITC UI elements
  // TODO? move the actual IITC DOM into the leaflet control areas, so dummy <div>s aren't needed
  if(!isSmartphone()) {
    // chat window area
    $(window.map._controlCorners['bottomleft']).append($('<div>').width(708).height(108).addClass('leaflet-control').css('margin','0'));
  }

  var addLayers = {};
  var hiddenLayer = [];

  portalsLayers = [];
  for(var i = 0; i <= 8; i++) {
    portalsLayers[i] = L.layerGroup([]);
    map.addLayer(portalsLayers[i]);
    var t = (i === 0 ? 'Unclaimed' : 'Level ' + i) + ' Portals';
    addLayers[t] = portalsLayers[i];
    // Store it in hiddenLayer to remove later
    if(!isLayerGroupDisplayed(t, true)) hiddenLayer.push(portalsLayers[i]);
  }

  fieldsLayer = L.layerGroup([]);
  map.addLayer(fieldsLayer, true);
  addLayers['Fields'] = fieldsLayer;
  // Store it in hiddenLayer to remove later
  if(!isLayerGroupDisplayed('Fields', true)) hiddenLayer.push(fieldsLayer);

  linksLayer = L.layerGroup([]);
  map.addLayer(linksLayer, true);
  addLayers['Links'] = linksLayer;
  // Store it in hiddenLayer to remove later
  if(!isLayerGroupDisplayed('Links', true)) hiddenLayer.push(linksLayer);

  window.layerChooser = new L.Control.Layers({
    'MapQuest OSM': views[0],
    'Default Ingress Map': views[1],
    'Google Roads':  views[2],
    'Google Satellite':  views[3],
    'Google Hybrid':  views[4],
    'Google Terrain': views[5]
    }, addLayers);

  // Remove the hidden layer after layerChooser built, to avoid messing up ordering of layers 
  $.each(hiddenLayer, function(ind, layer){
    map.removeLayer(layer);
  });

  map.addControl(window.layerChooser);

  map.attributionControl.setPrefix('');
  // listen for changes and store them in cookies
  map.on('moveend', window.storeMapPosition);
  map.on('zoomend', function() {
    window.storeMapPosition();

    // remove all resonators if zoom out to < RESONATOR_DISPLAY_ZOOM_LEVEL
    if(isResonatorsShow()) return;
    for(var i = 1; i < portalsLayers.length; i++) {
      portalsLayers[i].eachLayer(function(item) {
        var itemGuid = item.options.guid;
        // check if 'item' is a resonator
        if(getTypeByGuid(itemGuid) != TYPE_RESONATOR) return true;
        portalsLayers[i].removeLayer(item);
      });
    }

    console.log('Remove all resonators');
  });


  // map update status handling & update map hooks
  // ensures order of calls
  map.on('movestart zoomstart', function() { window.mapRunsUserAction = true; window.requests.abort(); window.startRefreshTimeout(-1); });
  map.on('moveend zoomend', function() { window.mapRunsUserAction = false; window.startRefreshTimeout(ON_MOVE_REFRESH*1000); });

  window.addResumeFunction(function() { window.startRefreshTimeout(ON_MOVE_REFRESH*1000); });
  window.requests.addRefreshFunction(window.requestData);

  // start the refresh process with a small timeout, so the first data request happens quickly
  // (the code originally called the request function directly, and triggered a normal delay for the nxt refresh.
  //  however, the moveend/zoomend gets triggered on map load, causing a duplicate refresh. this helps prevent that
  window.startRefreshTimeout(ON_MOVE_REFRESH*1000);

};

//adds a base layer to the map. done separately from the above, so that plugins that add base layers can be the default
window.setMapBaseLayer = function() {
  //create a map name -> layer mapping - depends on internals of L.Control.Layers
  var nameToLayer = {};
  var firstLayer = null;

  for (i in window.layerChooser._layers) {
    var obj = window.layerChooser._layers[i];
    if (!obj.overlay) {
      nameToLayer[obj.name] = obj.layer;
      if (!firstLayer) firstLayer = obj.layer;
    }
  }

  var baseLayer = nameToLayer[localStorage['iitc-base-map']] || firstLayer;
  map.addLayer(baseLayer);

  //after choosing a base layer, ensure the zoom is valid for this layer
  //(needs to be done here - as we don't know the base layer zoom limit before this)
  map.setZoom(map.getZoom());


  //event to track layer changes and store the name
  map.on('baselayerchange', function(info) {
    for(i in window.layerChooser._layers) {
      var obj = window.layerChooser._layers[i];
      if (info.layer === obj.layer) {
        localStorage['iitc-base-map'] = obj.name;
        break;
      }
    }

    //also, leaflet no longer ensures the base layer zoom is suitable for the map (a bug? feature change?), so do so here
    map.setZoom(map.getZoom());


  });


}

// renders player details into the website. Since the player info is
// included as inline script in the original site, the data is static
// and cannot be updated.
window.setupPlayerStat = function() {
  PLAYER.guid = playerNameToGuid(PLAYER.nickname);
  var level;
  var ap = parseInt(PLAYER.ap);
  for(level = 0; level < MIN_AP_FOR_LEVEL.length; level++) {
    if(ap < MIN_AP_FOR_LEVEL[level]) break;
  }
  PLAYER.level = level;

  var thisLvlAp = MIN_AP_FOR_LEVEL[level-1];
  var nextLvlAp = MIN_AP_FOR_LEVEL[level] || ap;
  var lvlUpAp = digits(nextLvlAp-ap);
  var lvlApProg = Math.round((ap-thisLvlAp)/(nextLvlAp-thisLvlAp)*100);


  var xmMax = MAX_XM_PER_LEVEL[level];
  var xmRatio = Math.round(PLAYER.energy/xmMax*100);

  var cls = PLAYER.team === 'RESISTANCE' ? 'res' : 'enl';


  var t = 'Level:\t' + level + '\n'
        + 'XM:\t' + PLAYER.energy + ' / ' + xmMax + '\n'
        + 'AP:\t' + digits(ap) + '\n'
        + (level < 8 ? 'level up in:\t' + lvlUpAp + ' AP' : 'Congrats! (neeeeerd)')
        + '\n\Invites:\t'+PLAYER.available_invites
        + '\n\nNote: your player stats can only be updated by a full reload (F5)';

  $('#playerstat').html(''
    + '<h2 title="'+t+'">'+level+'&nbsp;'
    + '<div id="name">'
    + '<span class="'+cls+'">'+PLAYER.nickname+'</span>'
    + '<a href="/_ah/logout?continue=https://www.google.com/accounts/Logout%3Fcontinue%3Dhttps://appengine.google.com/_ah/logout%253Fcontinue%253Dhttps://www.ingress.com/intel%26service%3Dah" id="signout">sign out</a>'
    + '</div>'
    + '<div id="stats">'
    + '<sup>XM: '+xmRatio+'%</sup>'
    + '<sub>' + (level < 8 ? 'level: '+lvlApProg+'%' : 'max level') + '</sub>'
    + '</div>'
    + '</h2>'
  );

  $('#name').mouseenter(function() {
    $('#signout').show();
  }).mouseleave(function() {
    $('#signout').hide();
  });
}

window.setupSidebarToggle = function() {
  $('#sidebartoggle').on('click', function() {
    var toggle = $('#sidebartoggle');
    var sidebar = $('#scrollwrapper');
    if(sidebar.is(':visible')) {
      sidebar.hide().css('z-index', 1);
      $('.leaflet-right').css('margin-right','0');
      toggle.html('<span class="toggle open"></span>');
      toggle.css('right', '0');
    } else {
      sidebar.css('z-index', 1001).show();
      $('.leaflet-right').css('margin-right', SIDEBAR_WIDTH+1+'px');
      toggle.html('<span class="toggle close"></span>');
      toggle.css('right', SIDEBAR_WIDTH+1+'px');
    }
  });
}

window.setupTooltips = function(element) {
  element = element || $(document);
  element.tooltip({
    // disable show/hide animation
    show: { effect: "hide", duration: 0 } ,
    hide: false,
    open: function(event, ui) {
      ui.tooltip.delay(300).fadeIn(0);
    },
    content: function() {
      var title = $(this).attr('title');
      return window.convertTextToTableMagic(title);
    }
  });

  if(!window.tooltipClearerHasBeenSetup) {
    window.tooltipClearerHasBeenSetup = true;
    $(document).on('click', '.ui-tooltip', function() { $(this).remove(); });
  }
}

window.setupTaphold = function() {
  @@INCLUDERAW:external/taphold.js@@
}


window.setupQRLoadLib = function() {
  @@INCLUDERAW:external/jquery.qrcode.min.js@@
}

window.setupLayerChooserApi = function() {
  // hide layer chooser on mobile devices running desktop mode
  if (!window.showLayerChooser) {
    $('.leaflet-control-layers').hide();
  }

  //hook some additional code into the LayerControl so it's easy for the mobile app to interface with it
  //WARNING: does depend on internals of the L.Control.Layers code
  window.layerChooser.getLayers = function() {
    var baseLayers = new Array();
    var overlayLayers = new Array();

    for (i in this._layers) {
      var obj = this._layers[i];
      var layerActive = window.map.hasLayer(obj.layer);
      var info = {
        layerId: L.stamp(obj.layer),
        name: obj.name,
        active: layerActive
      }
      if (obj.overlay) {
        overlayLayers.push(info);
      } else {
        baseLayers.push(info);
      }
    }

    var overlayLayersJSON = JSON.stringify(overlayLayers);
    var baseLayersJSON = JSON.stringify(baseLayers);

    if (typeof android !== 'undefined' && android && android.setLayers) {
        android.setLayers(baseLayersJSON, overlayLayersJSON);
    }

    return {
      baseLayers: baseLayers,
      overlayLayers: overlayLayers
    }
  }

  window.layerChooser.showLayer = function(id,show) {
    if (show === undefined) show = true;
    obj = this._layers[id];
    if (!obj) return false;

    if(show) {
      if (!this._map.hasLayer(obj.layer)) {
        //the layer to show is not currently active
        this._map.addLayer(obj.layer);

        //if it's a base layer, remove any others
        if (!obj.overlay) {
          for(i in this._layers) {
            if (i != id) {
              var other = this._layers[i];
              if (!other.overlay && this._map.hasLayer(other.layer)) this._map.removeLayer(other.layer);
            }
          }
        }
      }
    } else {
      if (this._map.hasLayer(obj.layer)) {
        this._map.removeLayer(obj.layer);
      }
    }

    //below logic based on code in L.Control.Layers _onInputClick
    if(!obj.overlay) {
      this._map.setZoom(this._map.getZoom());
      this._map.fire('baselayerchange', {layer: obj.layer});
    }

    return true;
  }
}

// BOOTING ///////////////////////////////////////////////////////////

function boot() {
  window.debug.console.overwriteNativeIfRequired();

  console.log('loading done, booting. Built: @@BUILDDATE@@');
  if(window.deviceID) console.log('Your device ID: ' + window.deviceID);
  window.runOnSmartphonesBeforeBoot();

  var iconDefImage = '@@INCLUDEIMAGE:images/marker-icon.png@@';
  var iconDefRetImage = '@@INCLUDEIMAGE:images/marker-icon-2x.png@@';
  var iconShadowImage = '@@INCLUDEIMAGE:images/marker-shadow.png@@';

  L.Icon.Default = L.Icon.extend({options: {
    iconUrl: iconDefImage,
    iconRetinaUrl: iconDefRetImage,
    shadowUrl: iconShadowImage,
    shadowRetinaUrl: iconShadowImage,
    iconSize: new L.Point(25, 41),
    iconAnchor: new L.Point(12, 41),
    popupAnchor: new L.Point(1, -34),
    shadowSize: new L.Point(41, 41)
  }});

  window.setupIdle();
  window.setupTaphold();
  window.setupStyles();
  window.setupDialogs();
  window.setupMap();
  window.setupGeosearch();
  window.setupRedeem();
  window.setupLargeImagePreview();
  window.setupSidebarToggle();
  window.updateGameScore();
  window.setupPlayerStat();
  window.setupTooltips();
  window.chat.setup();
  window.setupQRLoadLib();
  window.setupLayerChooserSelectOne();
  window.setupLayerChooserStatusRecorder();
  // read here ONCE, so the URL is only evaluated one time after the
  // necessary data has been loaded.
  urlPortalLL = getURLParam('pll');
  if(urlPortalLL) {
    urlPortalLL = urlPortalLL.split(",");
    urlPortalLL = [parseFloat(urlPortalLL[0]) || 0.0, parseFloat(urlPortalLL[1]) || 0.0];
  }
  urlPortal = getURLParam('pguid');

  // load only once
  var n = window.PLAYER['nickname'];
  window.PLAYER['nickMatcher'] = new RegExp('\\b('+n+')\\b', 'ig');

  $('#sidebar').show();

  if(window.bootPlugins)
    $.each(window.bootPlugins, function(ind, ref) {
      try {
        ref();
      } catch(err) {
        console.log("error starting plugin: index "+ind+", error: "+err);
      }
    });

  window.setMapBaseLayer();
  window.setupLayerChooserApi();

  window.runOnSmartphonesAfterBoot();

  // workaround for #129. Not sure why this is required.
  setTimeout('window.map.invalidateSize(false);', 500);

  window.iitcLoaded = true;
  window.runHooks('iitcLoaded');

  if (typeof android !== 'undefined' && android && android.removeSplashScreen) {
    android.removeSplashScreen();
  }

}

// this is the minified load.js script that allows us to easily load
// further javascript files async as well as in order.
// https://github.com/chriso/load.js
// Copyright (c) 2010 Chris O'Hara <cohara87@gmail.com>. MIT Licensed
function asyncLoadScript(a){return function(b,c){var d=document.createElement("script");d.type="text/javascript",d.src=a,d.onload=b,d.onerror=c,d.onreadystatechange=function(){var a=this.readyState;if(a==="loaded"||a==="complete")d.onreadystatechange=null,b()},head.insertBefore(d,head.firstChild)}}(function(a){a=a||{};var b={},c,d;c=function(a,d,e){var f=a.halt=!1;a.error=function(a){throw a},a.next=function(c){c&&(f=!1);if(!a.halt&&d&&d.length){var e=d.shift(),g=e.shift();f=!0;try{b[g].apply(a,[e,e.length,g])}catch(h){a.error(h)}}return a};for(var g in b){if(typeof a[g]=="function")continue;(function(e){a[e]=function(){var g=Array.prototype.slice.call(arguments);if(e==="onError"){if(d)return b.onError.apply(a,[g,g.length]),a;var h={};return b.onError.apply(h,[g,g.length]),c(h,null,"onError")}return g.unshift(e),d?(a.then=a[e],d.push(g),f?a:a.next()):c({},[g],e)}})(g)}return e&&(a.then=a[e]),a.call=function(b,c){c.unshift(b),d.unshift(c),a.next(!0)},a.next()},d=a.addMethod=function(d){var e=Array.prototype.slice.call(arguments),f=e.pop();for(var g=0,h=e.length;g<h;g++)typeof e[g]=="string"&&(b[e[g]]=f);--h||(b["then"+d.substr(0,1).toUpperCase()+d.substr(1)]=f),c(a)},d("chain",function(a){var b=this,c=function(){if(!b.halt){if(!a.length)return b.next(!0);try{null!=a.shift().call(b,c,b.error)&&c()}catch(d){b.error(d)}}};c()}),d("run",function(a,b){var c=this,d=function(){c.halt||--b||c.next(!0)},e=function(a){c.error(a)};for(var f=0,g=b;!c.halt&&f<g;f++)null!=a[f].call(c,d,e)&&d()}),d("defer",function(a){var b=this;setTimeout(function(){b.next(!0)},a.shift())}),d("onError",function(a,b){var c=this;this.error=function(d){c.halt=!0;for(var e=0;e<b;e++)a[e].call(c,d)}})})(this);var head=document.getElementsByTagName("head")[0]||document.documentElement;addMethod("load",function(a,b){for(var c=[],d=0;d<b;d++)(function(b){c.push(asyncLoadScript(a[b]))})(d);this.call("run",c)})

try { console.log('Loading included JS now'); } catch(e) {}
@@INCLUDERAW:external/leaflet.js@@
@@INCLUDERAW:external/L.Geodesic.js@@
// modified version of https://github.com/shramov/leaflet-plugins. Also
// contains the default Ingress map style.
@@INCLUDERAW:external/leaflet_google.js@@
@@INCLUDERAW:external/autolink.js@@

try { console.log('done loading included JS'); } catch(e) {}

//note: no protocol - so uses http or https as used on the current page
var JQUERY = '//ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min.js';
var JQUERYUI = '//ajax.googleapis.com/ajax/libs/jqueryui/1.10.2/jquery-ui.min.js';

// after all scripts have loaded, boot the actual app
load(JQUERY).then(JQUERYUI).thenRun(boot);
