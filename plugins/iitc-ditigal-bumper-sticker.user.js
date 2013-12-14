// ==UserScript==
// @id             iitc-plugin-portals-list@teo96
// @name           IITC Digital Bumper Sticker
// @category       Stock
// @version        0.1.0
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Adds a "I'd rather be using IITC" logo to the standard intel map.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

var logoDiv = document.createElement('div');
logoDiv.setAttribute('style', "position: fixed; left: 30px; top: 130px; z-index: 100; pointer-events: none;");

var img = document.createElement('img');
img.setAttribute('src', 'http://iitc.jonatkins.com/assets/img/prefer-iitc-small.png');

logoDiv.appendChild(img);

var targetContainer = document.getElementById('dashboard_container');
targetContainer.appendChild(logoDiv);
