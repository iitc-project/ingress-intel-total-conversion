// The code below needs to be run on the m-dot-betaspike.appspot.com domain.
// As such, it needs to be outside of the standard IITC plugin wrapper.
(function(){
function inventoryCallback(event)
{
  if (event.target.readyState == 4) {
    if (event.target.status == 200) {
      var json_text = event.target.response;
      var result = window.JSON.parse(json_text);
      var inventory = result['gameBasket']['inventory'];
      var hash = {};
      for (var i = 0; i < inventory.length; i++) {
        if (inventory[i][2]['portalCoupler']) {
          var guid = inventory[i][2]['portalCoupler']['portalGuid'];
          if (hash[guid]) {
            hash[guid]++;
          } else {
            hash[guid] = 1;
          }
        }
      }
      var json_out = window.JSON.stringify({'keys':hash});
      if (window.targetDomain == undefined) {
        window.targetDomain = 'http://www.ingress.com/';
      }
      window.top.postMessage(json_out, window.targetDomain);
    } else {
      alert('An error was received from the server\n' + event.target.statusText);
    }
  }
}

if (window.location.host == 'm-dot-betaspike.appspot.com') {
  if (window.location.pathname == '/handshake') {
    var xsrf;
    var re_match = document.body.innerHTML.match(/"xsrfToken":"((?:\\"|[^"])*)"/);
    if (!re_match) {
      alert("Error: Couldn't parse XSRF Token from Ingress handshake reply");
      xsrf = '';
    } else {
      xsrf = re_match[1];
    }
    var xhr = new XMLHttpRequest();
    var url = 'https://m-dot-betaspike.appspot.com/rpc/playerUndecorated/getInventory';
    var params = {'lastQueryTimestamp': 0};
    var body = window.JSON.stringify({'params': params});
    xhr.onreadystatechange = inventoryCallback;
    xhr.open('POST', url, true);
    xhr.setRequestHeader('X-XsrfToken', xsrf);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.setRequestHeader('Accept-Encoding', 'gzip');
    xhr.setRequestHeader('User-Agent', 'Nemesis (gzip)');
    xhr.send(body);
  }
}
})();
