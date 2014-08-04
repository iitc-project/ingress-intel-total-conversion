// ==UserScript==
// @id             iitc-plugin-fix-bad-version-code@jonatkins
// @name           IITC plugin: Fix bad version codes
// @category       Tweaks
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Sometimes Niantic deployments break, causing an old version of the gen_dashboard.js to be served. This has an out-of-date version code. This plugin overrides known bad codes with the one that should be current.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==


// NOTE: non-standard plugin - designed to work with both IITC *and* the standard intel site

// do NOT use as a template for other IITC plugins

var fixUrl = (window.location.protocol!=='https:'?'http://iitc.jonatkins.com':'https://secure.jonatkins.com/iitc')+'/bad-version-code-fix.js';
var script = document.createElement('script');
script.setAttribute('src', fixUrl);
(document.body || document.head || document.documentElement).appendChild(script);
