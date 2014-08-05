// ==UserScript==
// @id             iitc-plugin-fix-bad-version-code@jonatkins
// @name           IITC plugin: Fix bad version codes
// @category       Tweaks
// @version        0.2.0.@@DATETIMEVERSION@@
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


@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.badVersionCodeFix = function() {};

window.plugin.badVersionCodeFix.setup  = function() {

  var fixes = {
    // 2014-08-02 - broken for 24h+
    '81ad679ab5bc219ef3bcf7ca9b760e917cf0c558': 'afdb91368730a906bae38b2837cc411f880350fa',

  };


  var fixed = fixes[nemesis.dashboard.config.CURRENT_VERSION];

  if (fixed) {
    console.warn('IITC VersionCodeFixer: bad nemesis.dashboard.config.CURRENT_VERSION: is '+nemesis.dashboard.config.CURRENT_VERSION+', should be '+fixed);
    nemesis.dashboard.config.CURRENT_VERSION = fixed;
  } else {
    console.log('IITC VersionCodeFixer: no known fixes needed');
  }


};

var setup =  window.plugin.badVersionCodeFix.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
