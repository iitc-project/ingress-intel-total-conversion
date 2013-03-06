

// REDEEMING /////////////////////////////////////////////////////////

window.handleRedeemResponse = function(data, textStatus, jqXHR) {
  if (data.error) {
    var error = '';
    if (data.error === 'ALREADY_REDEEMED') {
      error = 'The passcode has already been redeemed.';
    } else if (data.error === 'ALREADY_REDEEMED_BY_PLAYER') {
      error = 'You have already redeemed this passcode.';
    } else if (data.error === 'INVALID_PASSCODE') {
      error = 'This passcode is invalid.';
    } else {
      error = 'There was a problem redeeming the passcode. Try again?';
    }
    alert('<strong>' + data.error + '</strong>\n' + error);
  } else if (data.result) {
    var xmp_level = 0, xmp_count = 0;
    var res_level = 0, res_count = 0;
    var shield_rarity = '', shield_count = 0;

    // This assumes that each passcode gives only one type of resonator/XMP/shield.
    // This may break at some point, depending on changes to passcode functionality.
    for (var i in data.result.inventoryAward) {
      var acquired = data.result.inventoryAward[i][2];
      if (acquired.modResource) {
        if (acquired.modResource.resourceType === 'RES_SHIELD') {
          shield_rarity = acquired.modResource.rarity.split('_').map(function (i) {return i[0]}).join('');
          shield_count++;
        }
      } else if (acquired.resourceWithLevels) {
        if (acquired.resourceWithLevels.resourceType === 'EMP_BURSTER') {
          xmp_level = acquired.resourceWithLevels.level;
          xmp_count++;
        } else if (acquired.resourceWithLevels.resourceType === 'EMITTER_A') {
          res_level = acquired.resourceWithLevels.level;
          res_count++;
        }
      }
    }

    alert('<strong>Passcode accepted!</strong>\n' + [data.result.apAward + 'AP', data.result.xmAward + 'XM', xmp_count + 'xL' + xmp_level + ' XMP', res_count + 'xL' + res_level + ' RES', shield_count + 'x' + shield_rarity + ' SH'].join('/'));
  }
}

window.setupRedeem = function() {
  $("#redeem").keypress(function(e) {
    if((e.keyCode ? e.keyCode : e.which) != 13) return;
    var data = {passcode: $(this).val()};
    window.postAjax('redeemReward', data, window.handleRedeemResponse,
      function(response) {
        var extra = '';
        if (response && response.status) {
          if (response.status === 429) {
            extra = 'You have been rate-limited by the server. Wait a bit and try again.';
          } else {
            extra = 'The server indicated an error.';
          }
          extra += '\nResponse: HTTP <a href="http://httpstatus.es/' + response.status + '" alt="HTTP ' + response.status + '">' + response.status + '</a>.';
        } else {
          extra = 'No status code was returned.';
        }
        alert('<strong>The HTTP request failed.</strong> ' + extra);
      });
  });
}
