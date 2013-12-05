// ==UserScript==
// @id             iitc-plugin-link-show-direction
// @name           IITC plugin: Show the direction of links on the map
// @category       Tweaks
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Show the direction of links on the map by adding short dashes to the line at the origin portal.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.linkShowDirection = function() {};

window.plugin.linkShowDirection.ANIMATE_UPDATE_TIME=1;
window.plugin.linkShowDirection.frames = [
  '10,5,5,5,5,5,5,5,100%',
//  '11,5,5,5,5,5,5,4,100%',
  '12,5,5,5,5,5,5,3,100%',
//  '13,5,5,5,5,5,5,2,100%',
  '14,5,5,5,5,5,5,1,100%',
//  '15,5,5,5,5,5,100%',
  '10,1,5,5,5,5,5,5,100%',
//  '10,2,5,5,5,5,5,5,100%',
  '10,3,5,5,5,5,5,5,100%',
//  '10,4,5,5,5,5,5,5,100%',
];

window.plugin.linkShowDirection.frame = 0;
window.plugin.linkShowDirection.moving = false;


window.plugin.linkShowDirection.animateLinks = function() {
  if (!window.plugin.linkShowDirection.moving) {
    window.plugin.linkShowDirection.frame ++;
    window.plugin.linkShowDirection.frame %= window.plugin.linkShowDirection.frames.length;

    $.each(links,function(guid,link) { window.plugin.linkShowDirection.addLinkStyle(link); });
  }

  // browsers don't render the SVG style changes until after the timer function has finished.
  // this means if we start the next timeout in here a lot of the delay time will be taken by the browser itself
  // re-rendering the screen. in the worst case, the timer will run out before the render completes, and fire immediately
  // this would mean the user has no chance to interact with IITC
  // to prevent this, create a short timer that then sets the timer for the next frame. if the browser is slow to render,
  // the short timer should fire later, at which point the desired ANIMATE_UPDATE_TIME timer is started
  setTimeout ( function() { setTimeout (window.plugin.linkShowDirection.animateLinks, window.plugin.linkShowDirection.ANIMATE_UPDATE_TIME*1000); }, 10);

}


window.plugin.linkShowDirection.addLinkStyle = function(link) {
  link.setStyle ({dashArray: window.plugin.linkShowDirection.frames[window.plugin.linkShowDirection.frame]});
}

window.plugin.linkShowDirection.setup  = function() {

  addHook ('linkAdded', function(data) { window.plugin.linkShowDirection.addLinkStyle (data.link); });

  // only start the animation timer of the paths support SVG
  if (L.Path.SVG) {
    setTimeout (window.plugin.linkShowDirection.animateLinks, window.plugin.linkShowDirection.ANIMATE_UPDATE_TIME*1000);

    // set up move start/end handlers to pause animations while moving
    map.on('movestart', function() { window.plugin.linkShowDirection.moving = true; });
    map.on('moveend', function() { window.plugin.linkShowDirection.moving = false; });

  }
};

var setup =  window.plugin.linkShowDirection.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
