// ==UserScript==
// @name           IITC Favicon
// @namespace      
// @version        0.1.0.00000000.000000
// @description    Replaces the Ingress Icon with IITC icon
// @include        http://www.ingress.com/intel*
// @include        https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

(function(d, h) {
  var ss = d.createElement('link');
	ss.rel = 'shortcut icon';
	ss.type = 'image/x-icon';
	ss.href = 'http://iitc.jonatkins.com/assets/img/logo.png';
	var links = h.getElementsByTagName('link');
	for (var i=0; i<links.length; i++) {
		if (links[i].href == ss.href) return;
		if (links[i].rel == "shortcut icon" || links[i].rel=="icon")
			h.removeChild(links[i]);
	}

	h.appendChild(ss);
	var shim = document.createElement('iframe');
	shim.width = shim.height = 0;
	document.body.appendChild(shim);
	shim.src = "icon";
	document.body.removeChild(shim);

})(document, document.getElementsByTagName('head')[0]);
