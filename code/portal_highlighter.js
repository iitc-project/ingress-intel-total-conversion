// Portal Highlighter //////////////////////////////////////////////////////////
// these functions handle portal highlighters


window._highlighters = null;
window._current_highlighter = localStorage.portal_highlighter;
window._no_highlighter = 'No Highlights';

if(window._current_highlighter !== undefined) {
  if (typeof android !== 'undefined' && android && android.setActiveHighlighter)
    android.setActiveHighlighter(window._current_highlighter);
}


window.addPortalHighlighter = function(name, callback) {
  if(_highlighters === null) {
    _highlighters = {};
  }
  _highlighters[name] = callback;

  if (typeof android !== 'undefined' && android && android.addPortalHighlighter)
    android.addPortalHighlighter(name);

  if(localStorage.portal_highlighter === undefined) {
    _current_highlighter = name;
    if (typeof android !== 'undefined' && android && android.setActiveHighlighter)
      android.setActiveHighlighter(name);

    localStorage.portal_highlighter = name;
  }
  portalHighlighterControl();
}

window.portalHighlighterControl = function() {
  if (typeof android !== 'undefined' && android && android.addPortalHighlighter) {
    $('#portal_highlight_select').remove();
    return;
  }

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
    // notify android that the select spinner is enabled.
    // this disables javascript injection on android side.
    // if android is not notified, the spinner closes on the next JS call
    if (typeof android !== 'undefined' && android && android.spinnerEnabled) {
      $("#portal_highlight_select").click(function(){ android.spinnerEnabled(true);});
      $("#portal_highlight_select").focus(function(){ android.spinnerEnabled(false);});
    }
    $(".leaflet-top.leaflet-left").css('padding-top', '20px');
    $(".leaflet-control-scale-line").css('margin-top','25px');
  }
}

window.changePortalHighlights = function(name) {
  _current_highlighter = name;
  if (typeof android !== 'undefined' && android && android.setActiveHighlighter)
    android.setActiveHighlighter(name);
  resetHighlightedPortals();
  localStorage.portal_highlighter = name;
}

window.highlightPortal = function(p) {
  
  if(_highlighters !== null && _highlighters[_current_highlighter] !== undefined) {
    p.options.highligher = _current_highlighter;
    _highlighters[_current_highlighter]({portal: p});
  }
}

window.resetHighlightedPortals = function() {
  $.each(portals, function(guid, portal) {
    setMarkerStyle(portal, guid === selectedPortal);
  });
}
