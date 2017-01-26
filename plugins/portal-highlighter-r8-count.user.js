// ==UserScript==
// @id             iitc-plugin-portal-highlighter-portals-r8-count@amsdams
// @name           IITC plugin: highlight portals count r8 count
// @category       Highlighter
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] highlight portals count level 8 resonators
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==


@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

	window.plugin.portalHighlighterR8Count = function() {
	};
	window.plugin.portalHighlighterR8Count.PORTAL_FILL_OPACITY = 0.7;
	window.plugin.portalHighlighterR8Count.getR8Count = function(portalDetails) {
		return window.plugin.portalHighlighterR8Count.getResoCount(portalDetails, window.MAX_PORTAL_LEVEL);
	}

	window.plugin.portalHighlighterR8Count.getResoCount = function(portalDetails, level) {
		var count = 0;
		$.each(portalDetails.resonatorArray.resonators, function(ind, reso) {
			if (reso && reso.level == level) {
				count++;
			}
		});
		return count;
	}

	window.plugin.portalHighlighterR8Count.highlight = function(data) {
		var portal = data.portal;
		
		var portalLevel = Math.floor(window.plugin.portalHighlighterR8Count.getR8Count(portal.options.details));
		portal.setStyle({
			fillColor : window.COLORS_LVL[portalLevel],
			fillOpacity : window.plugin.portalHighlighterR8Count.PORTAL_FILL_OPACITY
		});
	}

	var setup = function() {
		window.addPortalHighlighter('Portal R8 count in colors', window.plugin.portalHighlighterR8Count.highlight);
	}
	// PLUGIN END //////////////////////////////////////////////////////////
	
	@@PLUGINEND@@
