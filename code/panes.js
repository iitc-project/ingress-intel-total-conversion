// created to start cleaning up "window" interaction
//
window.show = function(id) {
  /*
   * disable all map properties when switching to another pane
   * because sometimes (bug?) touch events are passed to the map when
   * other panes are focussed
   */
  window.disableMapProperties();
  window.hideall();

  switch(id) {
    case 'full':
      window.chat.show('full');
      break;
    case 'compact':
      window.chat.show('compact');
      break;
    case 'public':
      window.chat.show('public');
      break;
    case 'faction':
      window.chat.show('faction');
      break;
    case 'debug':
      window.debug.console.show();
      break;
    case 'map':
      window.enableMapProperties();
      window.smartphone.mapButton.click();
      $('#portal_highlight_select').show();
      $('#farm_level_select').show();
      break;
    case 'info':
      window.smartphone.sideButton.click();
      break;
    default:
      window.smartphone.mapButton.click();
      break;
  }

  if (typeof android !== 'undefined' && android && android.switchToPane) {
    android.switchToPane(id);
  }
}

window.enableMapProperties = function() {
  window.map.tap.enable();
  window.map.dragging.enable();
  window.map.touchZoom.enable();
  window.map.doubleClickZoom.enable();
}

window.disableMapProperties = function() {
  window.map.tap.disable();
  window.map.dragging.disable();
  window.map.touchZoom.disable();
  window.map.doubleClickZoom.disable();
}

window.hideall = function() {
  $('#chatcontrols, #chat, #chatinput, #sidebartoggle, #scrollwrapper, #updatestatus, #portal_highlight_select').hide();
  $('#farm_level_select').hide();
  $('#map').css('visibility', 'hidden');
  $('.ui-tooltip').remove();
}
