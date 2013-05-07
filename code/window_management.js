// created to start cleaning up "window" interaction
//
window.show = function(id) {
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
                        break;
                case 'info':
                        window.smartphone.sideButton.click();
                        break;
                default:
                        window.smartphone.mapButton.click();
                        break;
        }
}
