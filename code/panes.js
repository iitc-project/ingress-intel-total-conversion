// created to start cleaning up "window" interaction
//

window.currentPane = '';

window.show = function(id) {
  if(window.currentPane == id) return;
  window.currentPane = id;
  window.hideall();

  runHooks("paneChanged", id);

  switch(id) {
    case 'all':
    case 'faction':
    case 'alerts':
      window.chat.show(id);
      break;
    case 'debug':
      window.debug.console.show();
      break;
    case 'map':
      window.smartphone.mapButton.click();
      $('#portal_highlight_select').show();
      $('#farm_level_select').show();
      break;
    case 'info':
      window.smartphone.sideButton.click();
      break;
  }

  if (typeof android !== 'undefined' && android && android.switchToPane) {
    android.switchToPane(id);
  }
}

window.hideall = function() {
  $('#chatcontrols, #chat, #chatinput, #sidebartoggle, #scrollwrapper, #updatestatus, #portal_highlight_select').hide();
  $('#farm_level_select').hide();
  $('#map').css('visibility', 'hidden');
  $('.ui-tooltip').remove();
}
