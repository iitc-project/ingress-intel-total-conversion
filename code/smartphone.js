window.isSmartphone = function() {
  // this check is also used in main.js. Note it should not detect
  // tablets because their display is large enough to use the desktop
  // version.
  return navigator.userAgent.match(/Android.*Mobile/);
}

window.smartphone = function() {};

window.runOnSmartphonesBeforeBoot = function() {
  if(!isSmartphone()) return;
  console.warn('running smartphone pre boot stuff');

  // disable zoom buttons to see if they are really needed
  window.localStorage['iitc.zoom.buttons'] = 'false';

  // don’t need many of those
  window.setupStyles = function() {
    $('head').append('<style>' +
      [ '#largepreview.enl img { border:2px solid '+COLORS[TEAM_ENL]+'; } ',
        '#largepreview.res img { border:2px solid '+COLORS[TEAM_RES]+'; } ',
        '#largepreview.none img { border:2px solid '+COLORS[TEAM_NONE]+'; } '].join("\n")
      + '</style>');
  }

  // this also matches the expand button, but it is hidden via CSS
  $('#chatcontrols a').click(function() {
    $('#scrollwrapper, #updatestatus').hide();
    // not displaying the map causes bugs in Leaflet
    $('#map').css('visibility', 'hidden');
    $('#chat, #chatinput').show();
  });

  window.smartphone.mapButton = $('<a>map</a>').click(function() {
    $('#chat, #chatinput, #scrollwrapper').hide();
    $('#map').css('visibility', 'visible');
    $('#updatestatus').show();
    $('.active').removeClass('active');
    $(this).addClass('active');
  });

  window.smartphone.sideButton = $('<a>info</a>').click(function() {
    $('#chat, #chatinput, #updatestatus').hide();
    $('#map').css('visibility', 'hidden');
    $('#scrollwrapper').show();
    $('.active').removeClass('active');
    $(this).addClass('active');
  });

  $('#chatcontrols').append(smartphone.mapButton).append(smartphone.sideButton);

  window.addHook('portalDetailsUpdated', function(data) {
    var x = $('.imgpreview img').removeClass('hide');

    if(!x.length) {
      $('.fullimg').remove();
      return;
    }

    if($('.fullimg').length) {
      $('.fullimg').replaceWith(x.addClass('fullimg'));
    } else {
      x.addClass('fullimg').appendTo('#sidebar');
    }
  });
}

window.runOnSmartphonesAfterBoot = function() {
  if(!isSmartphone()) return;
  console.warn('running smartphone post boot stuff');

  chat.toggle();
  smartphone.mapButton.click();

  // disable img full view
  $('#portaldetails').off('click', '**');

  $('.leaflet-right').addClass('leaflet-left').removeClass('leaflet-right');

  // make buttons in action bar flexible
  var l = $('#chatcontrols a:visible');
  l.css('width', 100/l.length + '%');

  // add event to portals that allows long press to switch to sidebar
  window.addHook('portalAdded', function(data) {
    data.portal.on('add', function() {
      if(!this._container || this.options.addedTapHoldHandler) return;
      this.options.addedTapHoldHandler = true;
      var guid = this.options.guid;

      // this is a hack, accessing Leaflet’s private _container is evil
      $(this._container).on('taphold', function() {
        window.renderPortalDetails(guid);
        window.smartphone.sideButton.click();
      });
    });
  });
}
