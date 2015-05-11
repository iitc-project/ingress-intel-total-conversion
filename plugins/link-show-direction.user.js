// ==UserScript==
// @id             iitc-plugin-link-show-direction
// @name           IITC plugin: Show the direction of links on the map
// @category       Tweaks
// @version        0.2.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Show the direction of links on the map by adding short dashes to the line at the origin portal.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @include        https://www.ingress.com/mission/*
// @include        http://www.ingress.com/mission/*
// @match          https://www.ingress.com/mission/*
// @match          http://www.ingress.com/mission/*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.linkShowDirection = function() {};
window.plugin.linkShowDirection.ANIMATE_UPDATE_TIME = 1000; // 1000ms = 1s

window.plugin.linkShowDirection.styles = {
  'Disabled': [null],
  'Static *': [
    '30,5,15,5,15,5,2,5,2,5,2,5,2,5,30,0',
  ],
  'Static near origin': [
    '10,5,5,5,5,5,5,5,100%',
  ],
  'Animate near origin': [
    '10,5,5,5,5,5,5,5,100%',
    '12,5,5,5,5,5,5,3,100%',
    '14,5,5,5,5,5,5,1,100%',
    '10,1,5,5,5,5,5,5,100%',
    '10,3,5,5,5,5,5,5,100%',
  ],
  'Animate full link': [
    '4,6,4,6,4,6,4,6',
    '0,2,4,6,4,6,4,4',
    '0,4,4,6,4,6,4,2',
    '0,6,4,6,4,6,4,0',
    '2,6,4,6,4,6,2,0',
  ],
};
window.plugin.linkShowDirection.dashArray = null;
window.plugin.linkShowDirection.frame = 0;
window.plugin.linkShowDirection.moving = false;


window.plugin.linkShowDirection.animateLinks = function() {
  var frames = window.plugin.linkShowDirection.styles[window.plugin.linkShowDirection.mode];
  if(!frames) frames = [null];

  if(!window.plugin.linkShowDirection.moving) {
    var frame = window.plugin.linkShowDirection.frame;
    frame = (frame + 1) % frames.length;
    window.plugin.linkShowDirection.frame = frame;

    window.plugin.linkShowDirection.dashArray = frames[frame];
    window.plugin.linkShowDirection.addAllLinkStyles();
  }

  if(frames.length < 2) return; // no animation needed

  // browsers don't render the SVG style changes until after the timer function has finished.
  // this means if we start the next timeout in here a lot of the delay time will be taken by the browser itself
  // re-rendering the screen. in the worst case, the timer will run out before the render completes, and fire immediately
  // this would mean the user has no chance to interact with IITC
  // to prevent this, create a short timer that then sets the timer for the next frame. if the browser is slow to render,
  // the short timer should fire later, at which point the desired ANIMATE_UPDATE_TIME timer is started
  clearTimeout(window.plugin.linkShowDirection.timer);
  window.plugin.linkShowDirection.timer = setTimeout(function() {
    clearTimeout(window.plugin.linkShowDirection.timer);
    window.plugin.linkShowDirection.timer = setTimeout(
      window.plugin.linkShowDirection.animateLinks,
      window.plugin.linkShowDirection.ANIMATE_UPDATE_TIME);
  }, 10);
};

window.plugin.linkShowDirection.addAllLinkStyles = function() {
  $.each(links,function(guid,link) { window.plugin.linkShowDirection.addLinkStyle(link); });

  if(window.plugin.drawTools && localStorage['plugin-linkshowdirection-drawtools'] == "true") {
    window.plugin.drawTools.drawnItems.eachLayer(function(layer) {
      if(layer instanceof L.GeodesicPolyline)
        window.plugin.linkShowDirection.addLinkStyle(layer);
    });
  }
};

window.plugin.linkShowDirection.addLinkStyle = function(link) {
  link.setStyle({dashArray: window.plugin.linkShowDirection.dashArray});
};

window.plugin.linkShowDirection.removeDrawToolsStyle = function() {
  if(!window.plugin.drawTools) return;

  window.plugin.drawTools.drawnItems.eachLayer(function(layer) {
    if(layer instanceof L.GeodesicPolyline)
      layer.setStyle({dashArray: null});
  });
};

window.plugin.linkShowDirection.showDialog = function() {
  var div = document.createElement('div');

  $.each(window.plugin.linkShowDirection.styles, function(style) {
    var label = div.appendChild(document.createElement('label'));
    var input = label.appendChild(document.createElement('input'));
    input.type = 'radio';
    input.name = 'plugin-link-show-direction';
    input.value = style;
    if(style == window.plugin.linkShowDirection.mode) {
      input.checked = true;
    }

    input.addEventListener('click', function() {
      window.plugin.linkShowDirection.mode = style;
      localStorage['plugin-linkshowdirection-mode'] = style;
      window.plugin.linkShowDirection.animateLinks();
    }, false);

    label.appendChild(document.createTextNode(' ' + style));

    div.appendChild(document.createElement('br'));
  });

  div.appendChild(document.createTextNode(
    ' * Static: six segments will indicate each link\'s direction. ' +
    'Two long segments are on the origin\'s side, follow by four short segments on the destination\'s side.'));

  if(window.plugin.drawTools) {
    div.appendChild(document.createElement('br'));

    var label = div.appendChild(document.createElement('label'));
    var input = label.appendChild(document.createElement('input'));
    input.type = 'checkbox';
    input.checked = localStorage['plugin-linkshowdirection-drawtools'] == "true";

    input.addEventListener('click', function() {
      localStorage['plugin-linkshowdirection-drawtools'] = input.checked.toString();
      
      if(input.checked)
        window.plugin.linkShowDirection.animateLinks();
      else
        window.plugin.linkShowDirection.removeDrawToolsStyle();
    }, false);

    label.appendChild(document.createTextNode(' Apply to DrawTools'));
  }

  dialog({
    id: 'plugin-link-show-direction',
    html: div,
    title: 'Show link direction',
  });
};

window.plugin.linkShowDirection.setup  = function() {
  $('#toolbox').append(' <a onclick="window.plugin.linkShowDirection.showDialog()">LinkDirection Opt</a>');

  addHook('linkAdded', function(data) { window.plugin.linkShowDirection.addLinkStyle(data.link); });

  try {
    window.plugin.linkShowDirection.mode = localStorage['plugin-linkshowdirection-mode'];
  } catch(e) {
    console.warn(e);
    window.plugin.linkShowDirection.mode = 'Disabled';
  }

  // only start the animation timer of the paths support SVG
  if(L.Path.SVG) {
    window.plugin.linkShowDirection.animateLinks();

    // set up move start/end handlers to pause animations while moving
    map.on('movestart', function() { window.plugin.linkShowDirection.moving = true; });
    map.on('moveend', function() { window.plugin.linkShowDirection.moving = false; });
  } else {
    console.warn('link-show-direction: not using SVG, visualization of link direction is not supported!');
  }
};

var setup =  window.plugin.linkShowDirection.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
