// Portal Highlighter //////////////////////////////////////////////////////////
// these functions handle portal highlighters


window._highlighters = null;
window._current_highlighter = localStorage.portal_highlighter;
window.changing_highlighters = false;
window._no_highlighter = 'No Highlights';

window.addPortalHighlighter = function(name, callback) {
  if(_highlighters === null) {
    _highlighters = {};
  }
  _highlighters[name] = callback;
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
    $(".leaflet-top.leaflet-left").css('padding-top', window.isSmartphone ? '55px' : '20px');
    $(".leaflet-control-scale-line").css('margin-top','25px');
  }
}

window.changePortalHighlights = function(name) {
  changing_highlighters = true;
  _current_highlighter = name;
  resetHighlightedPortals();
  changing_highlighters = false;
  localStorage.portal_highlighter = name;
}

window.highlightPortal = function(p) {
  
  if(_highlighters !== null && _highlighters[_current_highlighter] !== undefined) {
    p.options.highligher = _current_highlighter;
    _highlighters[_current_highlighter]({portal: p});
  }
}

window.resetHighlightedPortals = function() {
  $.each(portals, function(ind, portal) {
    try {
      renderPortal(portal.options.ent);
    }
    catch(e) {}
  }); 
}
