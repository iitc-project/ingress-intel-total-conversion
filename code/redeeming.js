

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
      error = 'The passcode cannot be redeemed.';
    }
    alert("Error: " + data.error + "\n" + error);
  } else if (data.result) {
    var res_level = 0, res_count = 0;
    var xmp_level = 0, xmp_count = 0;
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
        if (acquired.resourceWithLevels.resourceType === 'EMITTER_A') {
          res_level = acquired.resourceWithLevels.level;
          res_count++;
        } else if (acquired.resourceWithLevels.resourceType === 'EMP_BURSTER') {
          xmp_level = acquired.resourceWithLevels.level;
          xmp_count++;
        }
      }
    }

    alert("Passcode redeemed!\n" + [data.result.apAward + 'AP', data.result.xmAward + 'XM', res_count + 'xL' + res_level + ' RES', xmp_count + 'xL' + xmp_level + ' XMP', shield_count + 'x' + shield_rarity + ' SHIELD'].join('/'));
  }
}

window.setupRedeem = function() {
  $("#redeem").keypress(function(e) {
    if((e.keyCode ? e.keyCode : e.which) != 13) return;
    var data = {passcode: $(this).val()};
    window.postAjax('redeemReward', data, window.handleRedeemResponse,
      function() { alert('The HTTP request failed. Either your code is invalid or their servers are down. No way to tell.'); });
  });
}
