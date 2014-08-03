// this script can be loaded by an IITC plugin, to fix known bad version codes when Niantic have a bad deployment

(function(){

  var fixes = {
    // 2014-08-02 - broken for 24h+
    '81ad679ab5bc219ef3bcf7ca9b760e917cf0c558': 'afdb91368730a906bae38b2837cc411f880350fa',

  };


  var fixed = fixes[nemesis.dashboard.config.CURRENT_VERSION];

  if (fixed) {
    console.warn('VersionCodeFixer: bad nemesis.dashboard.config.CURRENT_VERSION: is '+nemesis.dashboard.config.CURRENT_VERSION+', should be '+fixed);
    nemesis.dashboard.config.CURRENT_VERSION = fixed;
  } else {
    console.log('VersionCodeFixer: no known fixes needed');
  }

})();
