// ==UserScript==
// @id             iitc-plugin-portal-kml-export@pad
// @name           IITC plugin: Ingress KML Exporter
// @category       Keys
// @version        1.0.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Exports portals currently in view for use with Google Map ( KML Format ).
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

function wrapper() {
    // in case IITC is not available yet, define the base plugin object
    if (typeof window.plugin !== "function") {
        window.plugin = function() {};
    }

    // base context for plugin
    window.plugin.ingressKMLexporter = function() {};
    var self = window.plugin.ingressKMLexporter;
    // custom dialog wrapper with more flexibility

    self.portalInScreen = function portalInScreen( p ) {
        return map.getBounds().contains(p.getLatLng())
    }
    self.gen = function gen() {
        var o = [];
        var inBounds = function( portal ) {
            return self.portalInScreen( portal );
        }
        var string = "Portal selection based on screen boundaries.";
        o.push('<?xml version="1.0" encoding="UTF-8"?>');
        o.push('<kml xmlns="http://www.opengis.net/kml/2.2">');
        o.push('    <Document>');
        o.push('        <name>Import from IITC</name>');
        for (var x in window.portals) {
            var p = window.portals[x];
            if (inBounds(p)) {
                o.push('        <Placemark>');
                o.push('            <styleUrl>#cercle</styleUrl>');
                o.push('            <name>' + p.options.data.title.replace(/\"/g, "\"\"") + '</name>');
                o.push('            <ExtendedData>');
                o.push('            </ExtendedData>');
                o.push('            <Point>');
                o.push('                <coordinates>' + p._latlng.lng + "," + p._latlng.lat + ',0.0</coordinates>');
                o.push('            </Point>');
                o.push('        </Placemark>');
            }
        }
        o.push('        <Style id=\'cercle\'>');
        o.push('            <IconStyle>');
        o.push('                <color>ffF08641</color>');
        o.push('                <scale>1</scale>');
        o.push('                <Icon>');
        o.push('                    <href>http://www.gstatic.com/mapspro/images/stock/959-wht-circle-blank.png</href>');
        o.push('                </Icon>');
        o.push('            </IconStyle>');
        o.push('        </Style>');
        o.push('    </Document>');
        o.push('</kml>');
        var dialog = window.dialog({
            title: "Ingress KML Exporter",
            // body must be wrapped in an outer tag (e.g. <div>content</div>)
            html: '<span>Save the data below to a KML file and import it on <code> https://www.google.com/maps/d </code>.</span><textarea id="idKMLexporter" rows="30" style="width: 100%;"></textarea>'
        }).parent();
        $(".ui-dialog-buttonpane", dialog).remove();
        dialog.css("width", "600px")
            .css("top", ($(window).height() - dialog.height()) / 2)
            .css("left", ($(window).width() - dialog.width()) / 2);
        $("#idKMLexporter").val(o.join("\n"));
        return dialog;
    };
    // setup function called by IITC
    self.setup = function init() {
        // add controls to toolbox
        var link = $("<a onclick=\"window.plugin.ingressKMLexporter.gen();\" title=\"Generate KML list of portals and locations.\">KML Export</a>");
        $("#toolbox").append(link);
        // delete setup to ensure init can't be run again
        delete self.setup;
    };
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
