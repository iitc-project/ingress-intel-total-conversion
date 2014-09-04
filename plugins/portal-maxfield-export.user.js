// ==UserScript==
// @id iitc-plugin-ingressmaxfield@stenyg
// @name IITC plugin: Ingress Maxfields
// @category Information
// @version 0.0.0.2
// @namespace https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL http://github.com/itayo/IITC-Ingress-Maxfields-Exporter/raw/master/IngressMaxFields.user.js
// @downloadURL http://github.com/itayo/IITC-Ingress-Maxfields-Exporter/raw/master/IngressMaxFields.user.js
// @description Exports portals in the format for http://www.ingress-maxfield.com/
// @include https://www.ingress.com/intel*
// @include http://www.ingress.com/intel*
// @match https://www.ingress.com/intel*
// @match http://www.ingress.com/intel*
// @grant none
// ==/UserScript==

    function wrapper() {
    // in case IITC is not available yet, define the base plugin object
    if (typeof window.plugin !== "function") {
    window.plugin = function() {};
    }
    // base context for plugin
    window.plugin.ingressmaxfield = function() {};
  var self = window.plugin.ingressmaxfield;
	    // custom dialog wrapper with more flexibility
    self.gen = function gen() {
	var o = [];
	for (var x in window.portals) {
	  var p = window.portals[x];
	  if(map.getBounds().contains(p.getLatLng()))
	  {
		  var href = 'https://www.ingress.com/intel?ll='+p._latlng.lat+','+p._latlng.lng+'&z=17&pll='+p._latlng.lat+','+p._latlng.lng;
		  var str1=p.options.data.title.replace(/\"/g, "\\\"");
		  var str2=str1.replace(',',' ');
		  o.push( str2 + "," + href);
	  }
    }
    var dialog = window.dialog({
	    title: "www.ingress-maxfield.com: CSV export",
    // body must be wrapped in an outer tag (e.g. <div>content</div>)
    html: '<span>Save the data in a textfile or post it on ingress-maxfields.com.</span>'
    + '<textarea id="imfCSVExport" rows="30" style="width: 100%;"></textarea>'
    }).parent();
    $(".ui-dialog-buttonpane", dialog).remove();
    dialog.css("width", "600px")
    .css("top", ($(window).height() - dialog.height()) / 2)
    .css("left", ($(window).width() - dialog.width()) / 2);
    $("#imfCSVExport").val(o.join("\n"));
    return dialog;
    }
    // setup function called by IITC
    self.setup = function init() {
    // add controls to toolbox
    var link = $("<a onclick=\"window.plugin.ingressmaxfield.gen();\" title=\"Generate a CSV list of portals and locations for use with www.ingress-maxfield.com.\">IMF Export</a>");
    $("#toolbox").append(link);
    // delete self to ensure init can't be run again
    delete self.init;
    }
    // IITC plugin setup
    if (window.iitcLoaded && typeof self.setup === "function") {
    self.setup();
    } else if (window.bootPlugins) {
    window.bootPlugins.push(self.setup);
    } else {
    window.bootPlugins = [self.setup];
    }
    }
    // inject plugin into page
    var script = document.createElement("script");
    script.appendChild(document.createTextNode("(" + wrapper + ")();"));
    (document.body || document.head || document.documentElement).appendChild(script);


