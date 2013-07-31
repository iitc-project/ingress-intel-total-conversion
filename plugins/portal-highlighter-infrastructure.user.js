// ==UserScript==
// @id             iitc-plugin-highlight-portal-infrastructure@vita10gy
// @name           IITC plugin: highlight portals with infrastructure problems
// @category       Highlighter
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Red - No Picture, Orange - More than one picture (probably means the original was bad, upvote new), Yellow - Potential title issue
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
                                                '^church$',
                                                'untitled',
                                                'no title'];

window.plugin.portalInfrastructure.highlight = function(data) {
  var d = data.portal.options.details;
  var color = '';
  var opa = .75;
  
  if(d.photoStreamInfo.photoCount === 0) {
    color = 'red';
  }
  else if(d.photoStreamInfo.photoCount > 1) {
    color = 'orange';
  }
  else if((new RegExp(window.plugin.portalInfrastructure.badTitles.join("|"),'i')).test(d.portalV2.descriptiveText.TITLE)) {
    color = 'yellow';
    opa = .9;
  }
  
  if(color !== '') {
    var params = {fillColor: color, fillOpacity: opa};
    data.portal.setStyle(params);  
    window.COLOR_SELECTED_PORTAL = '#f0f';   
  }
 
}

var setup =  function() {
  window.addPortalHighlighter('Infrastructure', window.plugin.portalInfrastructure.highlight);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
