
// REDEEMING /////////////////////////////////////////////////////////

window.REDEEM_RES_LONG = {'RES_SHIELD'  : 'Portal Shield',
                          'EMITTER_A'   : 'Resonator',
                          'EMP_BURSTER' : 'XMP Burster',
                          'POWER_CUBE'  : 'Power Cube'};

window.REDEEM_RES_SHORT = {'RES_SHIELD'  : 'S',
                           'EMITTER_A'   : 'R',
                           'EMP_BURSTER' : 'X',
                           'POWER_CUBE'  : 'C'};

window.REDEEM_ERRORS = {'ALREADY_REDEEMED' : 'The passcode has already been redeemed.',
                        'ALREADY_REDEEMED_BY_PLAYER' : 'You have already redeemed this passcode.',
                        'INVALID_PASSCODE' : 'This passcode is invalid.'};

window.REDEEM_STATUSES = {429 : 'You have been rate-limited by the server. Wait a bit and try again.'};

window.handleRedeemResponse = function(data, textStatus, jqXHR) {
  if (data.error) {
    // Errors are now in window.REDEEM_ERRORS.
    var error = window.REDEEM_ERRORS[data.error] || 'There was a problem redeeming the passcode. Try again?';

    // Show an alert and add a console log
    alert('<strong>' + data.error + '</strong>\n' + error);
    console.log(this.passcode + ' => [ERROR] ' + data.error);
  } else if(data.result) {
    // Successful redemption
    var payload      = {};
    var table_result = ['<th colspan="2"><strong>Passcode accepted!</strong></th>'], plain_result = [];
    var table = '', plain = '';

    // Get AP, XM, and other static quantities
    var scores = [[parseInt(data.result.apAward), 'AP'], [parseInt(data.result.xmAward), 'XM']];
    for (var i in scores) {
      if (scores[i][0] > 0) {
        table_result.push('<td>+</td><td>' + scores[i][0] + ' ' + scores[i][1] + '</td>');
        plain_result.push(scores[i][0] + ' ' + scores[i][1]);
      }
    }

    // Track frequencies and levels of items
    for (var i in data.result.inventoryAward) {
      var acquired = data.result.inventoryAward[i][2], primary, secondary, type;
      if (acquired.modResource) {
        primary   = acquired.modResource.resourceType;
        secondary = acquired.modResource.rarity;
        type = 'mod';
      } else if (acquired.resourceWithLevels) {
        primary   = acquired.resourceWithLevels.resourceType;
        secondary = parseInt(acquired.resourceWithLevels.level);
        type = 'leveled';
      }

      payload[primary] = payload[primary] || {};
      payload[primary][secondary] = payload[primary][secondary] || {};
      payload[primary][secondary].type = payload[primary][secondary].type || type;
      payload[primary][secondary].count = payload[primary][secondary].count || 0;
      payload[primary][secondary].count += 1;
    }

    // Build the table and plaintext arrays
    var keys = Object.keys(payload).sort();
    for (var k in keys) {
      var primary = payload[keys[k]], long_name = window.REDEEM_RES_LONG[keys[k]] || keys[k], short_name = window.REDEEM_RES_SHORT[keys[k]] || '?';
      var table_array = [], plain_array = [];
      for (var secondary in primary) {
        var acquired = primary[secondary];
        var span_prefix = acquired.type === 'leveled' ? '<span style="color: ' + window.COLORS_LVL[secondary] + ';">' : '<span style="color: ' + window.COLORS_MOD[secondary] + ';">';
        var span_infix  = acquired.type === 'leveled' ? secondary : secondary.split('_').map(function (i) {return i[0];}).join('');
        var span_suffix = '</span>'
        table_array.push('<td>' + span_prefix + (acquired.type === 'leveled' ? 'L' : '') + span_infix + span_suffix + '</td><td>' + long_name + ' [' + primary[secondary].count + ']</td>');
        plain_array.push(primary[secondary].count + '@' + (acquired.type === 'leveled' ? short_name : '') + span_prefix + span_infix + span_suffix);
      }
      table_result.push(table_array.join(''));
      plain_result.push(plain_array.join('/'));
    }

    // Add more HTML tags
    plain = '<span style="font-family: monospace;">' + plain_result.join('/') + '</span>';
    table_result.push('<td style="font-family: monospace;">&gt;&gt;</td><td><a href="javascript:alert(\'' + escape(plain) + '\', true);" style="font-family: monospace;">[plaintext]</a>');
    table = '<table class="redeem-result">' + table_result.map(function(a) {return '<tr>' + a + '</tr>';}).join("\n") + '</table>';

    // Display formatted versions in a table, plaintext, and the console log
    alert(table, true);
    console.log(this.passcode + ' => ' + $(plain).text());
  }
}

window.setupRedeem = function() {
  $("#redeem").keypress(function(e) {
    if((e.keyCode ? e.keyCode : e.which) != 13) return;
    var data = {passcode: $(this).val()};

    window.postAjax('redeemReward', data, window.handleRedeemResponse,
      function(response) {
        var extra = ''
        if (response.status) {
          extra = (window.REDEEM_STATUSES[response.status] || 'The server indicated an error.') + ' (HTTP ' + response.status + ')';
        } else {
          extra = 'No status code was returned.';
        }
        alert('<strong>The HTTP request failed.</strong> ' + extra);
      });
  });
}
