// ==UserScript==
// @id             iitc-plugin-pick-maxfield-portals
// @name           IITC plugin: pick portals for the maxfield script
// @category       Info
// @version        0.1.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/rspielmann/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Pick portals for the maxfield script.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
plugin.pickmaxfieldportals = function() {};

plugin.pickmaxfieldportals.resetSelectedPortals = function() {
  plugin.pickmaxfieldportals.selectedPortals = {};
}

plugin.pickmaxfieldportals.getMaxfieldInputLine = function() {
  var portal = window.portals[window.selectedPortal];
  var portalData = portal.options.data;

  var inputLineParts = [];

  // portal title
  inputLineParts.push(portalData.title);

  // permalink
  var lat = portalData.latE6/1E6;
  var lng = portalData.lngE6/1E6;
  var permalink = 'https://www.ingress.com/intel/?ll=' + lat + ',' + lng + '&z=17&pll=' + lat + ',' + lng;
  inputLineParts.push(permalink);

  return inputLineParts.join(';');
}

plugin.pickmaxfieldportals.onAddClick = function() {

  if(!window.selectedPortal) {
    alert("No portal selected!");
    return false;
  }

  var portalId = window.portals[window.selectedPortal].options.ent[0];
  var info = plugin.pickmaxfieldportals.getMaxfieldInputLine();

  // avoid duplicates
  if(!plugin.pickmaxfieldportals.selectedPortals[portalId]) {
    plugin.pickmaxfieldportals.selectedPortals[portalId] = info;
  }

  window.runHooks('pluginPickmaxfieldportalsChange');
};

plugin.pickmaxfieldportals.onDelClick = function() {

  if(!window.selectedPortal) {
    alert("No portal selected!");
    return false;
  }

  var portalId = window.portals[window.selectedPortal].options.ent[0];
  if(plugin.pickmaxfieldportals.selectedPortals[portalId]) {
    delete plugin.pickmaxfieldportals.selectedPortals[portalId];
  }

  window.runHooks('pluginPickmaxfieldportalsChange');
};

plugin.pickmaxfieldportals.onShowClick = function() {

  if($.isEmptyObject(plugin.pickmaxfieldportals.selectedPortals)) {
    alert("You haven't added any portals!");
  } else {
    var maxfieldInput = $.map(plugin.pickmaxfieldportals.selectedPortals, function(inputLine, portalId) {
      return inputLine;
    }).join('\n');

    dialog({
      html: '<p><a onclick="$(\'.ui-dialog-pickmaxfieldportals-copy textarea\').select();">Select all</a> and copy contents.</p><textarea readonly>' + maxfieldInput + '</textarea>',
      dialogClass: 'ui-dialog-pickmaxfieldportals-copy',
      title: 'Maxfield Input Export'
    });
  }
};

plugin.pickmaxfieldportals.onResetClick = function() {

  plugin.pickmaxfieldportals.resetSelectedPortals();
  window.runHooks('pluginPickmaxfieldportalsChange');

  alert("Portal selection has been reset.");
};

plugin.pickmaxfieldportals.createButton = function(title, tooltip, handler) {

	var button = document.createElement("a");
	button.className = "leaflet-bar-part";
	button.title = title;

	var tt = document.createElement("div");
  tt.innerHTML = tooltip;
	button.appendChild(tt);

  button.addEventListener("click", handler, false);

  return button;
}

window.plugin.pickmaxfieldportals.highlight = function(data) {
  var portalId = data.portal.options.ent[0];
  if(plugin.pickmaxfieldportals.selectedPortals[portalId]) {
    data.portal.setStyle({fillColor: 'black', fillOpacity: 100});
  }
}

window.plugin.pickmaxfieldportals.highlightRefresh = function() {

  window.resetHighlightedPortals();
}

var setup =  function() {

  // initialize selected portals
  plugin.pickmaxfieldportals.resetSelectedPortals();

  // define hook for highlight refresh
  if($.inArray('pluginPickmaxfieldportalsChange', window.VALID_HOOKS) < 0) { window.VALID_HOOKS.push('pluginPickmaxfieldportalsChange'); }
  window.addHook('pluginPickmaxfieldportalsChange', plugin.pickmaxfieldportals.highlightRefresh);

  // create toolbar buttons
  var parent = $(".leaflet-top.leaflet-left", window.map.getContainer());

  var container = document.createElement("div");
	container.className = "leaflet-bar leaflet-control";

	container.appendChild(plugin.pickmaxfieldportals.createButton("Add Portal", "A", plugin.pickmaxfieldportals.onAddClick));
  container.appendChild(plugin.pickmaxfieldportals.createButton("Delete Portal", "D", plugin.pickmaxfieldportals.onDelClick));
  container.appendChild(plugin.pickmaxfieldportals.createButton("Show Script Input", "S", plugin.pickmaxfieldportals.onShowClick));
  container.appendChild(plugin.pickmaxfieldportals.createButton("Reset", "R", plugin.pickmaxfieldportals.onResetClick));

  parent.append(container);

  // inject css
  $('<style>').prop('type', 'text/css').html('@@INCLUDESTRING:plugins/pick-maxfield-portals.css@@').appendTo('head');

  // add highlighter
  window.addPortalHighlighter('Maxfield Portals', plugin.pickmaxfieldportals.highlight);
};

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
