var rebuidAttemptCount=0;
var iitcReadyCount=0;
var iitcURL;

function rebuildUI() {
  // this is sub-optimal, but we need a way to know if we're on a login page, or the real page.
  if(document.getElementById('dashboard_container')) {
    var dash = document.getElementById('dashboard_container');
    // dashboard is there, not conclusive
    if(dash.childNodes[0].innerHTML == 'Welcome to Ingress') {
      // not really 'ready', but the user needs the page for login purposes
      android.pageReady(1);
      return;
    } else if(!document.getElementById('map_canvas')) {
      // not loaded yet? we'll wait
      if(rebuidAttemptCount < 10) { // wait up to 5 seconds, then assume failure and show the page
        setTimeout(rebuildUI, 500);
        rebuidAttemptCount++;
        if(window.console) { console.log('Looking for Ingress Intel UI elements: ' + rebuidAttemptCount); }
        return;
      } else {
        if(window.console) { console.log('Something is wrong, flipping views'); }
        android.pageReady(1);
        return;
      }
    } else {
      window.UIDone = true;
    }

    window.console.log(window.deviceID);
    window.console.log(navigator.userAgent);

    switch(window.deviceID) {
      case '41ddb619ea1fe75a': // blakjakau - TABLET
      iitcURL = 'http://mathphys.fsk.uni-heidelberg.de:8000/test.js';
      break;

      case 'f30c2cce86c1c7': // breunigs
      iitcURL = 'http://mathphys.fsk.uni-heidelberg.de:8000/test.js';
      break;

      default:
      iitcURL = 'http://mathphys.fsk.uni-heidelberg.de:8000/test.js';
    }
    window.loadJS(iitcURL); // load iitc and let it do its thing.
    window.iitcReadyTimer = setInterval(function() {
      if(window.iitcLoaded == true || iitcReadyCount > 10) {
        //wait up to 10 seconds from calling iitc to fliping the webviews
        //if for some reason iitc isn't loading, the user will just get the vanila ingres.com/intel experience
        try {
          android.pageReady(1); // tell the app to flip the webviews
          clearInterval(window.iitcReadyTimer); // and we're done.
        } catch(e) { if(window.console) { console.log(e.message); } }
      }
      iitcReadyCount++;
    }, 500);
  }
}
rebuildUI();
