// ==UserScript==
// @id             iitc-plugin-portallatlng@hsitirb
// @name           IITC plugin: Portal Lat/Long
// @category       Info
// @version        0.0.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Add lat/long info to portal sidebar and portals list
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @include        https://www.ingress.com/mission/*
// @include        http://www.ingress.com/mission/*
// @match          https://www.ingress.com/mission/*
// @match          http://www.ingress.com/mission/*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portlatlng = function() {};

plugin.portlatlng.contentHTML = null

window.plugin.portlatlng.setupCSS = function() {
  $("<style>")
    .prop("type", "text/css")
    .html("#pll-content-outer {\n  display: table;\n  width: 100%;\n  height: 26px;\n  text-align: center;\n}\n\n#keys-content-outer > div{\n  display: inline-block;\n  vertical-align: middle;\n\n}\n\n#pll-label {\n  padding: 0 4px;\n}\n#pll-lat {\n display: inline-block;\n}\n#pll-lng {\n display: inline-block;\n}")
    .appendTo("head");
}

window.plugin.portlatlng.addToSidebar = function() {
  $('#portaldetails > .imgpreview').after(plugin.portlatlng.contentHTML);
  plugin.portlatlng.updateLatLng()
}

plugin.portlatlng.updateLatLng = function() {
  var guid = window.selectedPortal;
  var lat = "UNAVAILABLE"
  var lng = "UNAVAILABLE"
  
  var platlng = window.findPortalLatLng(guid)
  if (platlng !== undefined) 
  {
      lat = platlng.lat.toString();
      lng = platlng.lng.toString();
  } else {
      lat = "UNDEF";
      lng = "UNDEF";
  }

  $('#pll-lat').html(lat);
  $('#pll-lng').html(lng);
}

window.plugin.portlatlng.setupContent = function() {
  plugin.portlatlng.contentHTML = '<div id="pll-content-outer">'
                              + '<div id="pll-label">Lat:'
                              + '<div id="pll-lat">EMPTY</div>'
                              + '</div>'
                              + '<div id="pll-label">Lng:'
                              + '<div id="pll-lng">EMPTY</div>'
                              + '</div>'
                              + '</div>';    
  plugin.portlatlng.updateLatLng();
}

window.plugin.portlatlng.setupPortalsList = function() {
  if(!window.plugin.portalslist) return;

  window.plugin.portalslist.fields.push({
    title: "LatLong",
    value: function(portal) { var guid = portal.options.guid; latlng = window.findPortalLatLng(guid); return latlng; }, 
    sortValue: function(value, portal) {
        lat = value.lat * 1e6;
        lng = value.lng * 1e6;
        return lat ^ lng
    },
    format: function(cell, portal, value) {
      $(cell)
        .append($('<span>')
          .text(value.lat+", "+value.lng)
        );
    },
  });
}

var setup =  function() {
  window.plugin.portlatlng.setupCSS();
  window.plugin.portlatlng.setupContent();
  window.addHook('portalDetailsUpdated', window.plugin.portlatlng.addToSidebar);

  if(window.plugin.portalslist) {
    window.plugin.portlatlng.setupPortalsList();
  } else {
    setTimeout(function() {
      if(window.plugin.portalslist)
        window.plugin.portlatlng.setupPortalsList();
    }, 500);
  }    
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
