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
    $('#map').css('visibility', 'visible');
    $('#updatestatus').show();
    $('#chatcontrols a .active').removeClass('active');
    $("#chatcontrols a:contains('map')").addClass('active');
  });

  window.smartphone.sideButton = $('<a>info</a>').click(function() {
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

window.smartphoneInfo = function(data) {
  var d = data.portalDetails;
  var lvl = Math.floor(getPortalLevel(d));
  if(lvl == 0)
    var t = '<span class="portallevel">L' + lvl + '</span>';
  else
    var t = '<span class="portallevel" style="background: '+COLORS_LVL[lvl]+';">L' + lvl + '</span>';
  var percentage = '0%';
  var totalEnergy = getTotalPortalEnergy(d);
  if(getTotalPortalEnergy(d) > 0) {
    percentage = Math.floor((getCurrentPortalEnergy(d) / getTotalPortalEnergy(d) * 100)) + '%';
  }
  t += ' ' + percentage + ' ';
  t += d.portalV2.descriptiveText.TITLE;

  var l,v,max,perc;
  for(var i=0;i<8;i++)
  {
    var reso = d.resonatorArray.resonators[i];
    if(reso) {
      l = parseInt(reso.level);
      v = parseInt(reso.energyTotal);
      max = RESO_NRG[l];
      perc = v/max*100;
    }
    else {
      l = 0;
      v = 0;
      max = 0;
      perc = 0;
    }

    t += '<div class="resonator '+TEAM_TO_CSS[getTeam(d)]+'" style="border-top-color: '+COLORS_LVL[l]+';left: '+(100*i/8.0)+'%;">';
    t += '<div class="filllevel" style="width:'+perc+'%;"></div>';
    t += '</div>'
  }

  $('#mobileinfo').html(t);
}

window.runOnSmartphonesAfterBoot = function() {
  if(!isSmartphone()) return;
  console.warn('running smartphone post boot stuff');

  window.show('map');

  // add a div/hook for updating mobile info
  $('#updatestatus').prepend('<div id="mobileinfo" onclick="show(\'info\')"></div>');
  window.addHook('portalDetailsUpdated', window.smartphoneInfo);
  // init msg of status bar. hint for the user that a tap leads to the info screen
  $('#mobileinfo').html('<div style="text-align: center"><b>tap here for info screen</b></div>');

  // disable img full view
  $('#portaldetails').off('click', '**');

  // make buttons in action bar flexible
  var l = $('#chatcontrols a:visible');
  l.css('width', 100/l.length + '%');

  // notify android that a select spinner is enabled.
  // this disables javascript injection on android side.
  // if android is not notified, the spinner closes on the next JS call
  if (typeof android !== 'undefined' && android && android.spinnerEnabled) {
    $("body").on("click", "select", function() {
      android.spinnerEnabled(true);
    });
    $("body").on("focus", "select", function() {
      android.spinnerEnabled(false);
    });
  }

  // add event to portals that allows long press to switch to sidebar
  window.addHook('portalAdded', function(data) {
    data.portal.on('add', function() {
      if(!this._container || this.options.addedTapHoldHandler) return;
      this.options.addedTapHoldHandler = true;
      var guid = this.options.guid;

      // this is a hack, accessing Leaflet’s private _container is evil
      $(this._container).on('taphold', function() {
        window.renderPortalDetails(guid);
        window.show('info');
      });
    });
  });

  // Force lower render limits for mobile
  window.VIEWPORT_PAD_RATIO = 0.1;
  window.MAX_DRAWN_PORTALS = 500;
  window.MAX_DRAWN_LINKS = 200;
  window.MAX_DRAWN_FIELDS = 100;
}
