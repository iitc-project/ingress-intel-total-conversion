// ==UserScript==
// @id             iitc-plugin-highlight-portals-with-L8-resonators@superd
// @name           IITC plugin: highlight portals with L8 resonators
// @category       Highlighter
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Uses the fill red of the portals, if portal has L8 res
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalsWithL8Resonators = function() {};

window.plugin.portalsWithL8Resonators.highlight = function(data) {
  var d = data.portal.options.details;
  var has_L8 = 0;
  if(getTeam(d) !== 0) {
    $.each(d.resonatorArray.resonators, function(ind, reso) {
      if(reso) {
        var level = parseInt(reso.level);
        if(level == 8)
        {
          has_L8+=1;
        }
      }
    });
  }   
    
  if(has_L8 > 0)
  {
    var color = 'red';
    var opa = has_L8 * 0.125;
    var params = {fillColor: color, fillOpacity: opa};
    data.portal.setStyle(params);  
  }
}

var setup =  function() {
  window.addPortalHighlighter('Portals with L8 Resonators', window.plugin.portalsWithL8Resonators.highlight);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
