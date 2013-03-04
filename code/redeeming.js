

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
    alert('<strong>' + data.error + "</strong>\n" + error);
  } else if (data.result) {
	var tblResult = $('<table />', {'class': 'redeem-result' }).append($('<tr />').append($('<th />', {colspan: 2}).append("Passcode redeemed!")));
  
	if (data.result.apAward)
	  tblResult.append($('<tr />').append($('<td />')).append($('<td />').append('AP (' + data.result.apAward + ')')));
	if (data.result.xmAward)
	  tblResult.append($('<tr />').append($('<td />')).append($('<td />').append('XM (' + data.result.xmAward + ')')));
  
	var resonators = {};
	var bursts = {};
	var shields = {};
	 
    for (var i in data.result.inventoryAward) {
      var acquired = data.result.inventoryAward[i][2];
      if (acquired.modResource) {
        if (acquired.modResource.resourceType === 'RES_SHIELD') {
		  var rarity = acquired.modResource.rarity.split('_').map(function (i) {return i[0]}).join('');
		  if (!shields[rarity])
			shields[rarity] = 0;
		  shields[rarity] += 1;
        }
      } else if (acquired.resourceWithLevels) {
        if (acquired.resourceWithLevels.resourceType === 'EMITTER_A') {
		  var level = acquired.resourceWithLevels.level
		  if (!resonators[level])
			resonators[level] = 0;
		  resonators[level] += 1;
        } else if (acquired.resourceWithLevels.resourceType === 'EMP_BURSTER') {
		  var level = acquired.resourceWithLevels.level
		  if (!bursts[level])
			bursts[level] = 0;
		  bursts[level] += 1;
        }
      }
    }
	
	for (var lvl in resonators) {
	  var text = 'Resonator';
	  if (resonators[lvl] > 1)
		text += ' ('+resonators[lvl]+')';
	  tblResult.append($('<tr />').append($('<td />', { 'class' : ('level-'+lvl)}).append('L' + lvl)).append($('<td />').append(text)));
	}
	for (var lvl in bursts) {
	  var text = 'Xmp Burster';
	  if (bursts[lvl] > 1)
		text += ' ('+bursts[lvl]+')';
	  tblResult.append($('<tr />').append($('<td />', { 'class' : ('level-'+lvl)}).append('L' + lvl)).append($('<td />').append(text)));
	}
	for (var lvl in shields) {
	  var text = 'Portal Shield';
	  if (shields[lvl] > 1)
		text += ' ('+shields[lvl]+')';
	  tblResult.append($('<tr />').append($('<td />').append(lvl)).append($('<td />').append(text)));
	}

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
        if (response && response.status) {
          if (response.status === 429) {
            extra = "You have been rate-limited by the server. Wait a bit and try again.";
          } else {
            extra = "The server indicated an error.";
          }
          extra += "\n" + 'Response: HTTP <a href="http://httpstatus.es/' + jq.status + '" alt="HTTP ' + jq.status + '"target="_blank">' + jq.status + "</a>.";
        } else {
          extra = "No status code was returned.";
        }
        alert('<strong>The HTTP request failed.</strong> ' + extra);
      });
  });
}
