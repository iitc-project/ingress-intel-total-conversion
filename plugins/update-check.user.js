// ==UserScript==
// @id             iitc-plugin-update-check@jonatkins
// @name           IITC plugin: Check for updates
// @category       Tweaks
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Check for updates for IITC and plugins against http://iitc.jonatkins.com/. Can also report status messages for known IITC issues.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.updateCheck = function() {};

window.plugin.updateCheck.url = 'http://iitc.jonatkins.com/versioncheck.php?build=@@BUILDNAME@@';
window.plugin.updateCheck.versionDataLoading = false;


window.plugin.updateCheck.versionCompare = function(a,b) {
  a = a.split('.');
  b = b.split('.');

  // adding dummy -1 entries to both split arrays simplifies comparisons
  a.push(-1);
  b.push(-1);

  var minlen = Math.min(a.length, b.length);

  for (var i=0; i<minlen; i++) {
    var anum = parseInt(a[i]);
    var bnum = parseInt(b[i]);
    if (anum != bnum) {
      return bnum-anum;
    }
  }

  return 0;
}

window.plugin.updateCheck.loadVersionData = function() {
  if (!window.plugin.updateCheck.versionDataLoading) {
    window.plugin.updateCheck.versionDataLoading = true;

    var s = document.createElement('script');
    s.setAttribute('type','text/javascript');
    s.setAttribute('src', window.plugin.updateCheck.url+'&callback=window.plugin.updateCheck.versionDataCallback');
    s.setAttribute('id','update-check-script-tag');
    document.getElementsByTagName("head")[0].appendChild(s);

  } else {
    // else we're already loading the script and it hasn't completed - do nothing
    console.warn('update-check: already loading data - cannot load again');
  }
}

window.plugin.updateCheck.versionDataCallback = function(data) {
  // data loaded - flag it's not loading any more and remove the script tag
  window.plugin.updateCheck.versionDataLoading = false;
  var s = document.getElementById('update-check-script-tag');
  if (s) {
    s.parentNode.removeChild(s);
  }

  dialog({
    text: JSON.stringify(data,null,2),
    title: 'debug version check',
    width: 700
  });

  window.plugin.updateCheck.showReport(data);
}

window.plugin.updateCheck.compareDetails = function(web_version, script_version) {
  // compare the local script version data with the website version data
  // and return an object with the results
  var result = {};

  result.webUrl = web_version.pageUrl;
  result.downloadUrl = web_version.downloadUrl;
  result.webVersion = web_version.version;

  result.localVersion = script_version.script && script_version.script.version;

  if (result.localVersion && result.webVersion) {
    result.comp = window.plugin.updateCheck.versionCompare (result.localVersion, result.webVersion);

    result.outOfDate = result.comp>0;
    result.upToDate = result.comp==0;
    result.localNewer = result.comp<0;


  }

  if (!result.localVersion) {
    
  } else if (!result.webVersion) {
  }

  return result;
}


window.plugin.updateCheck.showReport = function(data) {
  var result = '<b>WORK IN PROGRESS - NOT YET FUNCTIONAL</b>';

  if (data.error) {
    result += '<div><b>Error checking for updates</b><br>'+data.error+'</div>';
  } else {
    if (data.name) {
      result += '<div>IITC update check: '+data.name+'</div>';
    }

    if (data.iitc && window.script_info) {

      var compare = window.plugin.updateCheck.compareDetails(data.iitc, window.script_info);

      result += '<div>IITC Main script: '+JSON.stringify(compare)+'</div>';

    } else {
      if (!data.iitc) {
        result += '<div>Warning: no version information for main IITC script found in response</div>';
      }
      if (!window.script_info) {
        result += '<div>Warning: your IITC script does not contain version data</div>';
      }
    }


  }

  dialog({
    width: 500,
    title: 'Update check',
    html: result
  });
}


window.plugin.updateCheck.open = function() {

  // TODO? open a dialog/show a message indicating that the update check is in progress, before the data is loaded?
  // TODO? prevent loading the version data every time - cache it, with a user option to force fresh data

  window.plugin.updateCheck.loadVersionData();
}



window.plugin.updateCheck.setup  = function() {
  $('#toolbox').append(' <a onclick="window.plugin.updateCheck.open()" title="Check for IITC updates">Update check</a>');
};

var setup =  window.plugin.updateCheck.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
