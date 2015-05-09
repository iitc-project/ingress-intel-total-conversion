// ==UserScript==
// @id             iitc-plugin-update-check@jonatkins
// @name           IITC plugin: Check for updates
// @category       Misc
// @version        0.1.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] **WORK IN PROGRESS** Check for updates for IITC and plugins against http://iitc.jonatkins.com/. Can also report status messages for known IITC issues.
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

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.updateCheck = function() {};

window.plugin.updateCheck.versionDataLoading = false;


window.plugin.updateCheck.getUrl = function(callback) {
  var base = window.location.protocol == 'https:' ? 'https://secure.jonatkins.com/iitc' : 'http://iitc.jonatkins.com';
  var url = base+'/versioncheck.php'
          + '?build=@@BUILDNAME@@'
          + '&mobile='+((typeof android !== 'undefined' && android)?'1':'0')
          + '&ts='+Date.now();  // append timestamp - ensures no caching of old data, even on mobile with the aggressive cache code

  if (callback) {
    url = url + '&callback='+callback
  }

  return url;
}

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

//TODO: IITC Mobile-specific parameter, to retrieve the mobile app version rather than the script versions
//also
//  JSInterface public void updateIitc(String fileUrl)
//call on the android object to be able to download+install the android app.

    var s = document.createElement('script');
    s.setAttribute('type','text/javascript');
    s.setAttribute('src', window.plugin.updateCheck.getUrl('window.plugin.updateCheck.versionDataCallback'));
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

  window.plugin.updateCheck.showReport(data);
}

window.plugin.updateCheck.versionHTML = function(ver) {
  var re = new RegExp ('^([0-9]+\\.[0-9]+\\.[0-9]+)(\\.2[0-9][0-9][0-9][01][0-9][0123][0-9]\\.[0-9]+)$');
  var match = ver.match(re);
  if (match) {
    return match[1]+'<small>'+match[2]+'</small>';
  } else {
    return ver;
  }
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

  var webVerHTML = result.webVersion && window.plugin.updateCheck.versionHTML(result.webVersion);
  var localVerHTML = result.localVersion && window.plugin.updateCheck.versionHTML(result.localVersion);

//  var webLinkInstallHTML = '';
//  if (result.downloadUrl && result.webUrl) {
//    webLinkInstallHTML = '<a href="'+result.webUrl+'" title="Web page" target="_blank">web</a> '
//                       + '<a href="'+result.downloadUrl+'" title="Install" target="_blank">install</a>';
//  }

  if (!result.localVersion) {
    result.html = '<span class="help" title="Your version unknown\nLatest version '+webVerHTML+'">version check failed</span>';
  } else if (!result.webVersion) {
    result.html = '<span class="help" title="Your version '+localVerHTML+'\nNo version from update check server">version check failed</span>';
  } else if (result.upToDate) {
    result.html = '<span class="help" title="Version '+localVerHTML+'">up to date</span>';
  } else if (result.outOfDate) {
    result.html = '<span class="help" title="Your version '+localVerHTML+'\nLatest version '+webVerHTML+'">out of date</span>';
  } else if (result.localNewer) {
    result.html = localVerHTML+' is newer than '+webVerHTML+'(?!)';
  } else {
    console.warn ('Unknown case of version combinations!');
    result.html = '<span class="help" title="Your version '+localVerHTML+'\nLatest version '+webVerHTML+'">version check failed(!?)</span>';
  }

  return result;
}


window.plugin.updateCheck.showReport = function(data) {
  var result = '<b>WORK IN PROGRESS</b>';

  if (data.error) {
    result += '<div><b>Error checking for updates</b><br>'+data.error+'</div>';
  } else {
    if (data.name) {
      result += '<div>IITC update check: '+data.name+'</div>';
    }

    if (typeof android !== 'undefined' && android) {
      // mobile app version check
      var ourVerCode = android.getVersionCode && android.getVersionCode() || 0;
      var ourVerName = android.getVersionName && android.getVersionName() || '(unknown)';

      if (data.mobile) {
        var latestVerCode = parseInt(data.mobile.versioncode);
        var latestVerName = data.mobile.versionstr;

	var webLink = '';
	if (data.mobile.pageurl) webLink = '<a href="'+data.mobile.pageurl+'" target="_blank">web</a>';
        var downloadLink = '';
        if (data.mobile.downloadurl) downloadLink = '<a href="'+data.mobile.downloadurl+'">download</a>';
        if (data.mobile.downloadurl && android.updateIitc) downloadLink = '<a onclick="android.updateIitc(\''+data.mobile.downloadurl+'\')">install</a>';


        if (ourVerCode == latestVerCode) {
          // up to date
          result += '<div>IITC Mobile is up to date - version <span title="ver code "'+ourVerCode+'">'+ourVerName+'</span> '+webLink+'</div>';
        } else if (ourVerCode < latestVerCode) {
          // out of date
          result += '<div>IITC Mobile is out of date. Current version <span title="ver code "'+ourVerCode+'">'+ourVerName+'</span>, '
                  + 'Available version <span title="ver code "'+latestVerCode+'">'+latestVerName+'</span>. '+webLink+' '+downloadLink+'</div>';
        } else {
          // local version newer?!
          result += '<div>IITC Mobile version newer than latest on server?! Current version <span title="ver code "'+ourVerCode+'">'+ourVerName+'</span>, '
                  + 'Available version <span title="ver code "'+latestVerCode+'">'+latestVerName+'</span>.</div>';
        }

      } else {
        result += '<div>Warning: no version data for mobile app found in response</div>';
      }
    } else {
      // desktop userscript version check
      if (data.iitc && window.script_info) {
        var compare = window.plugin.updateCheck.compareDetails(data.iitc, window.script_info);
        result += '<div>IITC Main script: '+compare.html+'</div>';

      } else {
        if (!data.iitc) {
          result += '<div>Warning: no version information for main IITC script found in response</div>';
        }
        if (!window.script_info) {
          result += '<div>Warning: your IITC script does not contain version data</div>';
        }
      }
    }

    if (data.plugins && window.bootPlugins) {

      var plugins = { upToDate: [], outOfDate: [], other: [] };

      if (window.bootPlugins.length == 0) {
        result += '<li>No plugins installed</li>';
      } else {
        for (var i=0; i<window.bootPlugins.length; i++) {
          var pluginStatus = { index: i, status: 'other' };

          var info = window.bootPlugins[i].info;
          pluginStatus.name = info.script && info.script.name || info.pluginId || ('(unknown plugin index '+i+')');
          pluginStatus.name = pluginStatus.name.replace ( /^IITC plugin: /i, '' );

          if (info && info.pluginId) {
            var webinfo = data.plugins[info.pluginId];
            if (webinfo) {
              var compare = window.plugin.updateCheck.compareDetails(webinfo,info);
              pluginStatus.compare = compare;
              if (compare.upToDate) {
                pluginStatus.status = 'upToDate';
              } else if (compare.outOfDate) {
                pluginStatus.status = 'outOfDate';
              }
            }
          }

          plugins[pluginStatus.status].push(pluginStatus);

        }
      }

      result += '<div>Plugins:<table>';

      var formatRow = function(p,weblink,downloadlink) {
        var status = p.status;
        var name = p.name;
        var statustext = p.compare && p.compare.html || '-';
        var links = [];
        if (weblink && p.compare && p.compare.webUrl) links.push('<a href="'+p.compare.webUrl+'" target="_blank">web</a>');
        if (downloadlink && p.compare && p.compare.downloadUrl) links.push('<a href="'+p.compare.downloadUrl+'" target="_blank">download</a>');
        //now convert to text
        links = links && links.join(' ') || '-';

        return '<tr class="'+status+'"><td>'+name+'</td><td>'+statustext+'</td><td>'+links+'</td></tr>';
      }

      result += '<tr><th colspan="3">Out of date</th></tr>';
      for (var i in plugins.outOfDate) {
        result += formatRow (plugins.outOfDate[i],true,true);
      }
      if (plugins.outOfDate.length==0) {
        result += '<tr><td colspan="3">no plugins</td></tr>';
      }

      result += '<tr><th colspan="3">Up To Date</th></tr>';
      for (var i in plugins.upToDate) {
        result += formatRow (plugins.upToDate[i],true,false);
      }
      if (plugins.upToDate.length==0) {
        result += '<tr><td colspan="3">no plugins</td></tr>';
      }

      result += '<tr><th colspan="3">Other</th></tr>';
      for (var i in plugins.other) {
        result += formatRow (plugins.other[i],true,false);
      }
      if (plugins.other.length==0) {
        result += '<tr><td colspan="3">no plugins</td></tr>';
      }

      result += '</table</div>';
    }

  }

  dialog({
    width: 700,
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
