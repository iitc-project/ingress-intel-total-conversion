window.isSmartphone = function() {
  // this check is also used in main.js. Note it should not detect
  // tablets because their display is large enough to use the desktop
  // version.

  // The stock intel site allows forcing mobile/full sites with a vp=m or vp=f
  // parameter - let's support the same. (stock only allows this for some
  // browsers - e.g. android phone/tablet. let's allow it for all, but
  // no promises it'll work right)
  var viewParam = getURLParam('vp');
  if (viewParam == 'm') return true;
  if (viewParam == 'f') return false;

  return navigator.userAgent.match(/Android.*Mobile/);
}

window.smartphone = function() {};

window.runOnSmartphonesBeforeBoot = function() {
  if(!isSmartphone()) return;
  console.warn('running smartphone pre boot stuff');

  // add smartphone stylesheet
  headHTML = document.getElementsByTagName('head')[0].innerHTML;
  headHTML += '<style>@@INCLUDESTRING:mobile/smartphone.css@@</style>';
  document.getElementsByTagName('head')[0].innerHTML = headHTML;

  // don’t need many of those
  window.setupStyles = function() {
    $('head').append('<style>' +
      [ '#largepreview.enl img { border:2px solid '+COLORS[TEAM_ENL]+'; } ',
        '#largepreview.res img { border:2px solid '+COLORS[TEAM_RES]+'; } ',
        '#largepreview.none img { border:2px solid '+COLORS[TEAM_NONE]+'; } '].join("\n")
      + '</style>');
  }

  window.smartphone.mapButton = $('<a>map</a>').click(function() {
    $('#chat, #chatinput, #scrollwrapper').hide();
    $('#map').css('visibility', 'visible');
    $('#updatestatus').show();
    $('#chatcontrols a .active').removeClass('active');
    $("#chatcontrols a:contains('map')").addClass('active');
  });

  window.smartphone.sideButton = $('<a>info</a>').click(function() {
    $('#chat, #chatinput, #updatestatus').hide();
    $('#map').css('visibility', 'hidden');
    $('#scrollwrapper').show();
    $('.active').removeClass('active');
    $("#chatcontrols a:contains('info')").addClass('active');
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

  smartphone.mapButton.click();

  // disable img full view
  $('#portaldetails').off('click', '**');

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
        if (typeof android !== 'undefined' && android && android.portalLongPressed) {
          android.portalLongPressed();
        } else {
          window.renderPortalDetails(guid);
          window.smartphone.sideButton.click();
        }
      });
    });
  });

  // Force lower render limits for mobile
  window.VIEWPORT_PAD_RATIO = 0.1;
  window.MAX_DRAWN_PORTALS = 500;
  window.MAX_DRAWN_LINKS = 200;
  window.MAX_DRAWN_FIELDS = 100;
}
