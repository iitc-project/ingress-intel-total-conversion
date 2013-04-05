// Portal Highlighter //////////////////////////////////////////////////////////
// these functions handle portal highlighters


window._highlighters = null;
window._current_highlighter = localStorage.portal_highlighter;
window.changing_highlighters = false;

window.addPortalHighlighter = function(name, callback) {
  console.log("Regisering Portal Highlighter: " + name);
  if(_highlighters === null) {
    _highlighters = {};
  }
  _highlighters[name] = callback;
  portalHighlighterControl();
}

window.portalHighlighterControl = function() {
  if(_highlighters !== null) {
    if($('#portal_highlight_select').length === 0) {
      $("body").append("<select id='portal_highlight_select'></select>");
    }
    $("#portal_highlight_select").html('');
    $("#portal_highlight_select").append($("<option>").attr('value','No Highlights').text('No Highlights'));
    $.each(_highlighters, function(name, callback) {  
      $("#portal_highlight_select").append($("<option>").attr('value',name).text(name));
    });
    $("#portal_highlight_select").val(localStorage.portal_highlighter);
    $("#portal_highlight_select").change(function(){ changePortalHighlights($(this).val());});
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