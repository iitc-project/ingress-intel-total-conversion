

// REDEEMING /////////////////////////////////////////////////////////

window.handleRedeemResponse = function(data, textStatus, jqXHR) {
  if(data.error) {
    alert('Couldn’t redeem code. It may be used up, invalid or you have redeemed it already. (Code: '+data.error+')');
    return;
  }

  var text = 'Success! However, pretty display is not implemented.\nMaybe you can make sense of the following:\n';
  alert(text + JSON.stringify(data));
}

window.setupRedeem = function() {
  $("#redeem").keypress(function(e) {
    if((e.keyCode ? e.keyCode : e.which) != 13) return;
    var data = {passcode: $(this).val()};
    window.postAjax('redeemReward', data, window.handleRedeemResponse,
      function() { alert('HTTP request failed. Maybe try again?'); });
  });
}
