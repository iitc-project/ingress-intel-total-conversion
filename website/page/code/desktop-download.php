<?php

include_once ( "userscript.php" );


function iitcDesktopDownload ( $build )
{
	$iitc_details = loadUserScriptHeader ( "$build/total-conversion-build.user.js" );
	$iitc_version = preg_replace ( '/^(\d+\.\d+\.\d+)\.(\d{8}\.\d{6})/', '\1<small class="muted">.\2</small>', $iitc_details['@version'] );

	print "<p>IITC version $iitc_version</p>\n";

	print "<a class=\"btn btn-large btn-primary\" onclick=\"if(track){track('desktop','iitc','$build');}\" href=\"$build/total-conversion-build.user.js\">Download</a>\n";
}


function iitcDesktopPluginDownloadTable ( $build )
{
?>
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
foreach ( glob ( "$build/plugins/*.user.js" ) as $path )
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
	print "<td><a onclick=\"if(track){track('desktop','iitc-plugin-$basename','$build');}\" href=\"$path\" class=\"btn btn-small btn-primary\">Download</a></td>";
	print "</tr>\n";
}

?>
 </tbody>
</table>

<?php
}


?>
