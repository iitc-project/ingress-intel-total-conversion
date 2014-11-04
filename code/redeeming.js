// REDEEMING ///////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////

window.REDEEM_SHORT_NAMES = {
  'portal shield':'S',
  'force amp':'FA',
  'link amp':'LA',
  'heatsink':'H',
  'multihack':'M',
  'turret':'T',
  'unusual object':'U',
  'resonator':'R',
  'xmp burster':'X',
  'power cube':'C',
  'media':'M',
  'ultra strike':'US',
}

/* These are HTTP status codes returned by the redemption API.
 * TODO: Move to another file? Use more generally across IITC?
 */
window.REDEEM_STATUSES = {
  429: 'You have been rate-limited by the server. Wait a bit and try again.',
  500: 'Internal server error'
};

window.handleRedeemResponse = function(data, textStatus, jqXHR) {
  var passcode = jqXHR.passcode;

  if(data.error) {
    console.error('Error redeeming passcode "'+passcode+'": ' + data.error)
    dialog({
      title: 'Error: ' + passcode,
      html: '<strong>' + data.error + '</strong>'
    });
    return;
  }
  if(!data.rewards) {
    console.error('Error redeeming passcode "'+passcode+'": ', data)
    dialog({
      title: 'Error: ' + passcode,
      html: '<strong>An unexpected error occured</strong>'
    });
    return;
  }

  if(data.playerData) {
    window.PLAYER = data.playerData;
    window.setupPlayerStat();
  }

  var format = "long";
  try {
    format = localStorage["iitc-passcode-format"];
  } catch(e) {}

  var formatHandlers = {
    "short": formatPasscodeShort,
    "long": formatPasscodeLong
  }
  if(!formatHandlers[format])
    format = "long";

  var html = formatHandlers[format](data.rewards);

  var buttons = {};
  Object.keys(formatHandlers).forEach(function(label) {
    if(label == format) return;

    buttons[label.toUpperCase()] = function() {
      $(this).dialog("close");
      localStorage["iitc-passcode-format"] = label;
      handleRedeemResponse(data, textStatus, jqXHR);
    }
  });

  // Display it
  dialog({
    title: 'Passcode: ' + passcode,
    html: html,
    buttons: buttons
  });
};

window.formatPasscodeLong = function(data) {
  var html = '<p><strong>Passcode confirmed. Acquired items:</strong></p><ul class="redeemReward">';

  if(data.other) {
    data.other.forEach(function(item) {
      html += '<li>' + window.escapeHtmlSpecialChars(item) + '</li>';
    });
  }

  if(0 < data.xm)
    html += '<li>' + window.escapeHtmlSpecialChars(data.xm) + ' XM</li>';
  if(0 < data.ap)
    html += '<li>' + window.escapeHtmlSpecialChars(data.ap) + ' AP</li>';

  if(data.inventory) {
    data.inventory.forEach(function(type) {
      type.awards.forEach(function(item) {
        html += '<li>' + item.count + 'x ';

        var l = item.level;
        if(0 < l) {
          l = parseInt(l);
          html += '<span class="itemlevel" style="color:' + COLORS_LVL[l] + '">L' + l + '</span> ';
        }

        html += window.escapeHtmlSpecialChars(type.name) + '</li>';
      });
    });
  }

  html += '</ul>'
  return html;
}

window.formatPasscodeShort = function(data) {

  if(data.other) {
    var awards = data.other.map(window.escapeHtmlSpecialChars);
  } else {
    var awards = [];
  }

  if(0 < data.xm)
    awards.push(window.escapeHtmlSpecialChars(data.xm) + ' XM');
  if(0 < data.ap)
    awards.push(window.escapeHtmlSpecialChars(data.ap) + ' AP');

  if(data.inventory) {
    data.inventory.forEach(function(type) {
      type.awards.forEach(function(item) {
        var str = "";
        if(item.count > 1)
          str += item.count + "&nbsp;";

        if(window.REDEEM_SHORT_NAMES[type.name.toLowerCase()]) {
          var shortName = window.REDEEM_SHORT_NAMES[type.name.toLowerCase()];

          var l = item.level;
          if(0 < l) {
            l = parseInt(l);
            str += '<span class="itemlevel" style="color:' + COLORS_LVL[l] + '">' + shortName + l + '</span>';
          } else {
            str += shortName;
          }
        } else { // no short name known
          var l = item.level;
          if(0 < l) {
            l = parseInt(l);
            str += '<span class="itemlevel" style="color:' + COLORS_LVL[l] + '">L' + l + '</span> ';
          }
          str += type.name;
        }

        awards.push(str);
      });
    });
  }

  return '<p class="redeemReward">' + awards.join(', ') + '</p>'
}

window.setupRedeem = function() {
  $("#redeem").keypress(function(e) {
    if((e.keyCode ? e.keyCode : e.which) !== 13) return;

    var passcode = $(this).val();
    if(!passcode) return;

    var jqXHR = window.postAjax('redeemReward', {passcode:passcode}, window.handleRedeemResponse, function(response) {
      var extra = '';
      if(response.status) {
        extra = (window.REDEEM_STATUSES[response.status] || 'The server indicated an error.') + ' (HTTP ' + response.status + ')';
      } else {
        extra = 'No status code was returned.';
      }
      dialog({
        title: 'Request failed: ' + data.passcode,
        html: '<strong>The HTTP request failed.</strong> ' + extra
      });
    });
    jqXHR.passcode = passcode;
  });
};
