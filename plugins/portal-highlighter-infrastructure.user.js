// ==UserScript==
// @id             iitc-plugin-highlight-portal-infrastructure@vita10gy
// @name           IITC plugin: highlight portals with infrastructure problems
// @category       Highlighter
// @version        0.2.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Red - No Picture, Yellow - Potential title issue, Orange - both of these
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalInfrastructure = function() {};

window.plugin.portalInfrastructure.badTitles = ['^statue$',
                                                '^fountain$',
                                                '^sculpture$',
                                                '^post office$',
                                                '^us post office$',
                                                '^church$',
                                                'untitled',
                                                'no title'];

window.plugin.portalInfrastructure.highlight = function(data) {
  var d = data.portal.options.data;
  var color = '';
  var opa = .75;

  if(!(d.image)) {
    color = 'red';
  }

  if((new RegExp(window.plugin.portalInfrastructure.badTitles.join("|"),'i')).test(d.title)) {
    color = color == 'red' ? 'orange' : 'yellow';
    opa = .9;
  }
  
  if(color !== '') {
    var params = {fillColor: color, fillOpacity: opa};
    data.portal.setStyle(params);  
  }
 
}

var setup =  function() {
  window.addPortalHighlighter('Infrastructure', window.plugin.portalInfrastructure.highlight);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
