// ==UserScript==
// @id             force-www
// @name           IITC plugin: force ingress.com/intel to load https://www.ingress.com/intel
// @category       Tweaks
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Force intel map to load from www.ingress.com. If the intel map is accessed via ingress.com, it redirects to the www version.
// @include        https://ingress.com/intel
// @include        http://ingress.com/intel
// @match          https://ingress.com/intel
// @match          http://ingress.com/intel
// @grant          none
// ==/UserScript==

//NOTE: plugin authors - due to the unique requirements of this plugin, it doesn't use the standard IITC
//plugin architecture. do NOT use it as a template for other plugins

window.location = 'https://www.ingress.com/intel';
throw('Need to load ' + window.location + '.');
