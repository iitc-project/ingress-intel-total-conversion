<h2>IITC Browser Addon</h2>

<?php

if ( $path != "release" )
	print "<div class=\"alert alert-block alert-error\"><b>NOTE</b>: the <b>$path</b> build is currently selected. <a href=\"?page=desktop\">Return to the standard build</a>.</div>";
?>

<div class="alert alert-block">
<p>
<b>IMPORTANT!</b>: You <b>must</b> uninstall the original IITC before installing this version. Failure to do this
will result in multiple copes installed which I expect will cause a LOT of issues.
</p>
<p>
<b>NOTE</b>: The first release available on this web site was not configured correctly for auto updates.
If you installed before this note appeared <span class="nowrap">(22nd March 2013)</span> you will need to
manually uninstall IITC and all plugins, then reinstall from below. Going forward, updates will work correctly
(for Chrome + Tampermoneky and Firefox + Greasemonkey users).
</p>
</div>

<h3>Requirements</h3>

<p>
IITC will work in the Chrome or Firefox browsers. It should also work with Opera and other browsers supporting
userscripts, but these are far less tested. For Android phones, please see the <a href="?page=mobile">mobile</a> page.
</p>

<h4>Chrome</h4>

<p>
Although it is possible to install userscripts directly as extensions, the recommended method is to use
<a href="https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo">Tampermonkey</a>.
Once Tampermonkey is installed, click on the "Download" button below and click "OK" on the two dialogs to install.
</p>

<h4>Firefox</h4>

<p>
Install the <a href="https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/">Greasemonkey</a> Firefox add-on.
Once installed, click the "Download" then "Install" on the dialog.
</p>

<h4>Other browsers</h4>

<p>
Check your browser documentation for details on installing userscripts.
</p>


<h3>Download</h3>

<?php
$iitc_details = loadUserScriptHeader ( "$path/total-conversion-build.user.js" );
$iitc_version = preg_replace ( '/^(\d+\.\d+\.\d+)\.(\d{8}\.\d{6})/', '\1<small class="muted">.\2</small>', $iitc_details['@version'] );
?>

<p>
IITC version <?php print $iitc_version;?>
</p>

<a class="btn btn-large btn-primary" href="<?php print $path;?>/total-conversion-build.user.js">Download</a>

<hr>


<h4>Plugins</h4>

<p>
Plugins extend/modify the IITC experience. You do <b>not</b> need to install all plugins. Some are only useful to
a minority of users.
</p>

<table class="table table-condensed table-hover">
 <thead>
  <tr>
   <th>Name</th>
   <th>ID / Version</th>
   <th>Description</th>
   <th>Download</th>
  </tr>
 </thead>
 <tbody>

<?php
foreach ( glob ( "$path/plugins/*.user.js" ) as $path )
{
	$basename = basename ( $path, ".user.js" );

	$details = loadUserScriptHeader ( $path );

	print "<tr id=\"plugin-$basename\">\n";

	# remove 'IITC Plugin: ' prefix if it's there, for neatness
	$name = preg_replace ( '/^IITC plugin: /i', '', $details['@name'] );

	# format extended version info in less prominant font
	$version = preg_replace ( '/^(\d+\.\d+\.\d+)\.(\d{8}\.\d{6})/', '\1<small class="muted">.\2</small>', $details['@version'] );

	# remove unneeded prefix from description
	$description = preg_replace ( '/^\[[^]]*\] */', '', $details['@description'] );

	print "<td>$name</td>";
	print "<td>$basename<br />$version</td>";
	print "<td>$description</td>";
	print "<td><a href=\"$path\" class=\"btn btn-small btn-primary\">Download</a></td>";

#	print "<a href=\"$path\">".$details['@name']."</a> <i>$name - version ".$details['@version']."</i>: <br/>\n";
#	print $details['@description'];

	print "</tr>\n";
}

?>
 </tbody>
</table>

