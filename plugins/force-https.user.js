// ==UserScript==
// @id             force-https@jonatkins
// @name           IITC plugin: force https access for ingress.com/intel
// @category       Tweaks
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Force https access for the intel map. If the intel map is accessed via http, it redirects to the https version.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @include        https://www.ingress.com/mission/*
// @include        http://www.ingress.com/mission/*
// @match          https://www.ingress.com/mission/*
// @match          http://www.ingress.com/mission/*
// @grant          none
// ==/UserScript==



//NOTE: plugin authors - due to the unique requirements of this plugin, it doesn't use the standard IITC
//plugin architecture. do NOT use it as a template for other plugins


if(window.location.protocol !== 'https:') {
  var redir = window.location.href.replace(/^http:/, 'https:');
  window.location = redir;
  throw('Need to load HTTPS version.');
}
