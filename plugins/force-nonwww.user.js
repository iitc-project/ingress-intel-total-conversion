// ==UserScript==
// @id             force-nonwww
// @name           IITC plugin: force www.ingress.com/intel to load https://ingress.com/intel
// @category       Tweaks
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Force intel map to load from ingress.com. If the intel map is accessed via www.ingress.com, it redirects to the non-www version.
// @include        https://www.ingress.com/intel
// @include        http://www.ingress.com/intel
// @match          https://www.ingress.com/intel
// @match          http://www.ingress.com/intel
// @grant          none
// ==/UserScript==

//NOTE: plugin authors - due to the unique requirements of this plugin, it doesn't use the standard IITC
//plugin architecture. do NOT use it as a template for other plugins

window.location = 'https://ingress.com/intel';
throw('Need to load ' + window.location + '.');
