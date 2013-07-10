// created to start cleaning up "window" interaction
//
window.show = function(id) {
        window.hideall();
        if (typeof android !== 'undefined' && android && android.switchToPane) {
          android.switchToPane(id);
        }
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
                        window.smartphone.mapButton.click();
                        $('#portal_highlight_select').show();
                        break;
                case 'info':
                        window.smartphone.sideButton.click();
                        break;
                default:
                        window.smartphone.mapButton.click();
                        break;
        }
}

window.hideall = function() {
    $('#chatcontrols, #chat, #chatinput, #sidebartoggle, #scrollwrapper, #updatestatus, #portal_highlight_select').hide();
    $('#map').css('visibility', 'hidden');
}
