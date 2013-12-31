// ==UserScript==
// @id             iitc-export-import-draw@tomle
// @name           IITC plugin: export and import data from draw tools
// @version        0.0.1
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @description    Import/Export Data from draw tools
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// ==/UserScript==


function wrapper() {
    // ensure plugin framework is there, even if iitc is not yet loaded
    if(typeof window.plugin !== 'function'){ window.plugin = function() {}; }
    
    // ===[ PLUGIN START ]==========================================================================================================================================
    
    // use own namespace for plugin
    var thisplugin = window.plugin.drawtools_export = function() {};
    // function to import
    window.plugin.drawtools_export.import_drawdata = function() {
    localStorage['plugin-draw-tools-layer'] = prompt('Bitte geben sie die Daten ein:');
    window.location.reload()
    }
    // funcion to export
    window.plugin.drawtools_export.export_drawdata = function() {
    prompt("Copy to clipboard: Ctrl+C, Enter", localStorage['plugin-draw-tools-layer']);
//    GM_setClipboard( localStorage['plugin-draw-tools-layer'] )
//    GM_setClipboard("bla");
    }
    // ===[ Settings ]==========================================================================================================================================
var setup = function () {
	content = "<a onclick='window.plugin.drawtools_export.import_drawdata();' >Import draw-data</a>"
        content += "<a onclick='window.plugin.drawtools_export.export_drawdata();' >Export draw-data</a>"
        $('#toolbox').append(content);
}

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
