// ==UserScript==
// @id             iitc-plugin-highlight-bookmarked-portals@zaso
// @name           IITC plugin: Highlight bookmarked portals
// @category       Highlighter
// @version        0.1.2@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Uses the fill color of the portals to highlight bookmarked portals.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

  // use own namespace for plugin
  window.plugin.portalHighligherBookmarkedPortals =function(){};

  window.plugin.portalHighligherBookmarkedPortals.highlight = function(data) {
    var guid = data.portal.options.ent[0];
    if(window.plugin.bookmarks) {
      if(window.plugin.bookmarks.findByGuid(guid)) {
        data.portal.setStyle({fillColor:'red'});
      }
    }
  }

  window.plugin.portalHighligherBookmarkedPortals.highlightRefresh = function(data) {
    if(_current_highlighter === 'Bookmarked Portals' && window.plugin.bookmarks && data) {
      if(data.target === 'portal' || (data.target === 'folder' && data.action === 'remove') || (data.target === 'all' && data.action === 'import') || (data.target === 'all' && data.action === 'reset')) {
          resetHighlightedPortals();
      }
    }
  }

  var setup = function() {
    if($.inArray('pluginBkmrksEdit', window.VALID_HOOKS) < 0) { window.VALID_HOOKS.push('pluginBkmrksEdit'); }
    window.addHook('pluginBkmrksEdit', window.plugin.portalHighligherBookmarkedPortals.highlightRefresh);
    window.addPortalHighlighter('Bookmarked Portals', window.plugin.portalHighligherBookmarkedPortals.highlight);
  }

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@