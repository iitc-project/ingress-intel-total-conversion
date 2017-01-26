// ==UserScript==
// @id             iitc-plugin-highlight-portals-linkable@qnstie
// @name           IITC plugin: highlight portals linkable: with keys and with 8 resonators
// @category       Highlighter
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Shows if the portal can be a target of a link. Red: you have a key to the portal, it belongs to your faction and has 8 resonators. Yellow: you have a key, but there are some defects (not your faction or/and missing resonators). Very handy when planning fields.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==


@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////
 
// use own namespace for plugin
window.plugin.portalsLinkable = function() {};

window.plugin.portalsLinkable.highlight = function(data) {
	if (plugin.keys === null || plugin.keys.keys === null) return;
		
  var guid = data.portal.options.guid;
  var keyCount = plugin.keys.keys[guid];
  
  if (keyCount > 0) {
	var color = 'orange';
	var d = data.portal.options.details;
	if ((getTeam(d) !== 0) && (PLAYER.team === d.controllingTeam.team)) {
		var resCount = 0;
		$.each(d.resonatorArray.resonators, function(ind, reso) {
		  if(reso !== null) {
			resCount++;
		  }
		});

		if (resCount === 8) {
		  color = 'red';
		}
	}
	var params = {fillColor: color, fillOpacity: 100};
	data.portal.setStyle(params);
  }
  window.COLOR_SELECTED_PORTAL = '#f0f';
}

var setup =  function() {
  window.addPortalHighlighter('Linkable Portals', window.plugin.portalsLinkable.highlight);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@

