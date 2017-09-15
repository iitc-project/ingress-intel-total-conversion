// ==UserScript==
// @id             force-https@altertobi
// @name           IITC plugin: force www in hostname
// @category       Tweaks
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Force force www in hostname for intel because of localStorage
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @include        https://*.ingress.com/mission/*
// @include        http://*.ingress.com/mission/*
// @match          https://*.ingress.com/mission/*
// @match          http://*.ingress.com/mission/*
// @grant          none
// ==/UserScript==


// this is a fix for #1226

//NOTE: plugin authors - due to the unique requirements of this plugin, it doesn't use the standard IITC
//plugin architecture. do NOT use it as a template for other plugins

if(window.location.host !== 'www.ingress.com') {
  window.location.host = 'www.ingress.com';
  throw('Need to load WWW host');
}
