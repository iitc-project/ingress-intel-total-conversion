// ==UserScript==
// @id             iitc-plugin-hide-ui@insane210
// @name           IITC plugin: Hide UI
// @category       Misc
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Hide user interface elements
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.hideUI = function() {};

// store current state of screenshot mode
window.plugin.hideUI.ScreenshotMode = false;


// write settings to local storage
window.plugin.hideUI.saveSettings = function () {
  localStorage.setItem('hideUI', JSON.stringify(window.plugin.hideUI.options));
};


// load settings from local storage
window.plugin.hideUI.loadSettings = function () {
  // if settings not available, create new object with default values
  if (localStorage.getItem('hideUI') === null) {
    var options = {
      // id: [boolean enabled, string name],
      chatwrapper: [true, 'Chat'],
      sidebarwrapper: [true, 'Sidebar'],
      updatestatus: [true, 'Statusbar'],
      bookmarksBox: [true, 'Bookmarks Box'],
      portal_highlight_select: [true, 'Portal highlighter'],
      drawtools: [true, 'Drawtools'],
    };

    localStorage.setItem('hideUI', JSON.stringify(options));
  };

  window.plugin.hideUI.options = JSON.parse(localStorage.getItem('hideUI'));
};


// reset settings back to default values
window.plugin.hideUI.resetSettings = function () {
  localStorage.removeItem('hideUI');

  window.plugin.hideUI.loadSettings();
};


// hide or show UI elements depending on settings
window.plugin.hideUI.applySettings = function () {
  for (var key in window.plugin.hideUI.options) {
    if (window.plugin.hideUI.options.hasOwnProperty(key)) {
      var option = window.plugin.hideUI.options[key];

      if (option.hasOwnProperty('0')){
        if (option[0] === true) {
          $('#'+key).show();
        } else {
          $('#'+key).hide();
        };
      }
    }
  }
};


// switch screenshot mode on or off
window.plugin.hideUI.toggleScreenshotMode = function () {
  if (window.plugin.hideUI.ScreenshotMode) {
    $('#chatwrapper').show();
    $('#sidebarwrapper').show();
    $('#updatestatus').show();
    $('#bkmrksTrigger').show();
    $('#bookmarksBox').show();
    $('#portal_highlight_select').show();
    $('#leaflet-control-container').show();

    $('*').css({'cursor': ''});

    window.plugin.hideUI.ScreenshotMode = false;
  } else {
    $('#chatwrapper').hide();
    $('#sidebarwrapper').hide();
    $('#updatestatus').hide();
    $('#bkmrksTrigger').hide();
    $('#bookmarksBox').hide();
    $('#portal_highlight_select').hide();
    $('#leaflet-control-container').hide();

    $('*').css({'cursor': 'none'});

    window.plugin.hideUI.ScreenshotMode = true;
  }
};


window.plugin.hideUI.showOptions = function() {

  var html = '<a onclick="window.plugin.hideUI.resetSettings(); return false;">Reset Settings</a>' +
             '<hr>' +
             '<div class="bold">Always hide:</div>';

  for (var key in window.plugin.hideUI.options) {
    if (window.plugin.hideUI.options.hasOwnProperty(key)) {
      var option = window.plugin.hideUI.options[key];

      if (option.hasOwnProperty('0')){
        html += '<label for="hideUI-'+key+'">' +
                '<input type="checkbox" id="hideUI-'+key+'" ' +
                'onclick="window.plugin.hideUI.options.'+key+'[0]=this.checked; ' +
                'window.plugin.hideUI.saveSettings(); ' +
                'window.plugin.hideUI.applySettings();"';

        if (option[0] === true) {
          html += ' checked';
        };

        html += '> '+option[1]+'</label>';
      }
    }
  };

  dialog({
    html: html,
    id: 'plugin-hideUI-options',
    dialogClass: 'ui-dialog',
    title: 'Custom UI Options'
  });
};


var setup =  function() {
  $('head').append('<style>' +
    '#dialog-plugin-hideUI-options a {display: block; color: #ffce00; border: 1px solid #ffce00; padding: 3px 0; margin: 10px auto; width: 80%; text-align: center; background: rgba(8,48,78,.9); }' +
    '#dialog-plugin-hideUI-options label { display: block; }' +
    '#dialog-plugin-hideUI-options input { vertical-align: middle; }' +
    '.bold { font-weight: bold; }' +
    '</style>');

  $('#sidebartoggle, #scrollwrapper').wrapAll('<div id="sidebarwrapper"></div>');
  $('#chatcontrols, #chat, #chatinput').wrapAll('<div id="chatwrapper"></div>');
  $('.leaflet-control-container').attr('id', 'leaflet-control-container');

  window.plugin.hideUI.loadSettings();

  document.addEventListener('keydown', function(e) {
    // pressed alt+h
    if (e.keyCode == 72 && !e.shiftKey && !e.ctrlKey && e.altKey && !e.metaKey) {
      window.plugin.hideUI.toggleScreenshotMode();
    }
  }, false);

  $('#toolbox').append(' <a onclick="window.plugin.hideUI.showOptions()" title="Show custom UI settings">Custom UI Opt</a>');
};

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
