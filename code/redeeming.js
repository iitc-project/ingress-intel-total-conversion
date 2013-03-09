

// REDEEMING /////////////////////////////////////////////////////////

window.handleRedeemResponse = function(data, textStatus, jqXHR) {
  if(data.error) {
    var error = '';
    if(data.error === 'ALREADY_REDEEMED') {
      error = 'The passcode has already been redeemed.';
    } else if(data.error === 'ALREADY_REDEEMED_BY_PLAYER') {
      error = 'You have already redeemed this passcode.';
    } else if(data.error === 'INVALID_PASSCODE') {
      error = 'This passcode is invalid.';
    } else {
      error = 'There was a problem redeeming the passcode. Try again?';
    }
    alert('<strong>' + data.error + '</strong>\n' + error);
  } else if(data.result) {
    var tblResult = $('<table class="redeem-result" />');
    tblResult.append($('<tr><th colspan="2">Passcode accepted!</th></tr>'));
  
    if(data.result.apAward)
      tblResult.append($('<tr><td>+</td><td>' + data.result.apAward + 'AP</td></tr>'));
    if(data.result.xmAward)
      tblResult.append($('<tr><td>+</td><td>' + data.result.xmAward + 'XM</td></tr>'));
  
    var resonators = {};
    var bursts = {};
    var shields = {};
     
    for(var i in data.result.inventoryAward) {
      var acquired = data.result.inventoryAward[i][2];
      if(acquired.modResource) {
        if(acquired.modResource.resourceType === 'RES_SHIELD') {
          var rarity = acquired.modResource.rarity.split('_').map(function (i) {return i[0]}).join('');
          if(!shields[rarity]) shields[rarity] = 0;
          shields[rarity] += 1;
        }
      } else if(acquired.resourceWithLevels) {
        if(acquired.resourceWithLevels.resourceType === 'EMITTER_A') {
          var level = acquired.resourceWithLevels.level
          if(!resonators[level]) resonators[level] = 0;
          resonators[level] += 1;
        } else if(acquired.resourceWithLevels.resourceType === 'EMP_BURSTER') {
          var level = acquired.resourceWithLevels.level
          if(!bursts[level]) bursts[level] = 0;
          bursts[level] += 1;
        }
      }
    }
    
    $.each(resonators, function(lvl, count) {
      var text = 'Resonator';
      if(count >= 2) text += ' ('+count+')';
      tblResult.append($('<tr ><td style="color: ' +window.COLORS_LVL[lvl]+ ';">L' +lvl+ '</td><td>' + text + '</td></tr>'));
    });
    $.each(bursts, function(lvl, count) {
      var text = 'Xmp Burster';
      if(count >= 2) text += ' ('+count+')';
      tblResult.append($('<tr ><td style="color: ' +window.COLORS_LVL[lvl]+ ';">L' +lvl+ '</td><td>' + text + '</td></tr>'));
    });
    $.each(shields, function(lvl, count) {
      var text = 'Portal Shield';
      if(count >= 2) text += ' ('+count+')';
      tblResult.append($('<tr><td>'+lvl+'</td><td>'+text+'</td></tr>'));
    });

    alert(tblResult, true);
  }
}

window.setupRedeem = function() {
  $("#redeem").keypress(function(e) {
    if((e.keyCode ? e.keyCode : e.which) != 13) return;
    var data = {passcode: $(this).val()};
    window.postAjax('redeemReward', data, window.handleRedeemResponse,
      function(response) {
        var extra = '';
        if(response && response.status) {
          if(response.status === 429) {
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
