// Portal Highlighter //////////////////////////////////////////////////////////
// these functions handle portal highlighters


window._highlighters = null;
window._data_refreshing = false;
window._current_highlighter = localStorage.portal_highlighter;
window._no_highlighter = 'No Highlights';

window.addPortalHighlighter = function(name, callback, reset_function) {
  if(_highlighters === null) {
    _highlighters = {};
    window.addHook('mapDataRefreshStart', function() { window._data_refreshing = true;});
    window.addHook('mapDataRefreshEnd', window.portalHighligherRefreshEnd);
  }
  _highlighters[name] = {highlighter_callback: callback, reset_function:reset_function};
  if(localStorage.portal_highlighter === undefined) {
    _current_highlighter = name;
    localStorage.portal_highlighter = name;
  }
  portalHighlighterControl();
}

window.portalHighlighterControl = function() {
  if(_highlighters !== null) {
    if($('#portal_highlight_select').length === 0) {
      $("body").append("<select id='portal_highlight_select'></select>");
    }
    $("#portal_highlight_select").html('');
    $("#portal_highlight_select").append($("<option>").attr('value',_no_highlighter).text(_no_highlighter));
    var h_names = Object.keys(_highlighters).sort();
    
    $.each(h_names, function(i, name) {  
      $("#portal_highlight_select").append($("<option>").attr('value',name).text(name));
    });
    $("#portal_highlight_select").val(_current_highlighter);
    $("#portal_highlight_select").change(function(){ changePortalHighlights($(this).val());});
    $(".leaflet-top.leaflet-left").css('padding-top', '20px');
    $(".leaflet-control-scale-line").css('margin-top','25px');
  }
}

window.changePortalHighlights = function(name) {
  _current_highlighter = name;
  resetHighlightedPortals();
  localStorage.portal_highlighter = name;
}

//Skip highlighting if a relative highlighter will just blow it away
window.highlightPortal = function(p) {
  if(_highlighters !== null &&
     _highlighters[_current_highlighter].highlighter_callback !== undefined &&
     (_highlighters[_current_highlighter].reset_function === undefined ||
      _highlighters[_current_highlighter].reset_function !== undefined &&
      !window._data_refreshing)) { 
    p.options.highligher = _current_highlighter;
    _highlighters[_current_highlighter].highlighter_callback({portal: p});

  }
}

window.portalHighligherRefreshEnd = function(){
  window._data_refreshing = false;
  if(_highlighters[_current_highlighter].reset_function !== undefined)
  {
    window.resetHighlightedPortals();
  }
}

window.resetHighlightedPortals = function() {
  if(_highlighters[_current_highlighter].reset_function !== undefined) {
    _highlighters[_current_highlighter].reset_function();
  }
  $.each(portals, function(guid, portal) {
    setMarkerStyle(portal, guid === selectedPortal);
  });
}
