<?php

include_once ( "userscript.php" );


function iitcDesktopDownload ( $build )
{
	$iitc_details = loadUserScriptHeader ( "$build/total-conversion-build.user.js" );
	$iitc_version = preg_replace ( '/^(\d+\.\d+\.\d+)\.(\d{8}\.\d{1,6})/', '\1<small class="muted">.\2</small>', $iitc_details['@version'] );

	print "<p>IITC version $iitc_version</p>\n";

	print "<a class=\"btn btn-large btn-primary\" onclick=\"if(track){track('desktop','iitc','$build');}\" href=\"$build/total-conversion-build.user.js\" target=\"_blank\">Download</a>\n";
}

function loadPopularity()
{
	$popularity = Array();

	$pop_file = getcwd() . "/popularity.txt";

	if ( file_exists($pop_file) )
	{
		foreach ( file($pop_file,FILE_IGNORE_NEW_LINES) as $line )
		{
			$items = explode ( ' ', $line );
			$popularity[$items[0]] = (int)$items[1];
		}
	}

	return $popularity;
}

function popularity_cmp ( $a, $b )
{
	if ( @$a['popularity'] == @$b['popularity'] )
		return 0;
	// sort from highest to lowest
	return (@$a['popularity'] > @$b['popularity']) ? -1 : 1;
}


function iitcDesktopPluginDownloadTable ( $build )
{
	$categories = Array (
		'Portal Info' => "Enhanced information on the selected portal",
		'Info' => "Display additional information",
		'Keys' => "Manual key management",
		'Controls' => "Map controls/widgets",
		'Highlighter' => "Portal highlighters",
		'Layer' => "Additional map layers",
		'Map Tiles' => "Alternative map layers",
		'Tweaks' => "Adjust IITC settings",
		'Misc' => "Unclassified plugins",
		'Obsolete' => "Plugins that are no longer recommended, due to being superceded by others or similar",
		'Deleted' => "Deleted plugins - listed here for reference only. No download available"
	);

	$popularity = loadPopularity();

	$plugins = Array();

	foreach ( glob ( "$build/plugins/*.user.js" ) as $path )
	{
		$basename = basename ( $path, ".user.js" );
		$details = loadUserScriptHeader ( $path );

		if ( array_key_exists('total-conversion-build',$popularity) && array_key_exists('plugins/'.$basename, $popularity) )
		{
			$details['popularity'] = $popularity['plugins/'.$basename] / $popularity['total-conversion-build'];
		}

		$plugins[$basename] = $details;

		$category = array_key_exists('@category',$details) ? $details['@category'] : 'Misc';

		if ( !array_key_exists($category,$categories) )
		{
			# add missing categories
			$categories[$category] = '';
		}
	}

	ksort ( $plugins );
	uasort ( $plugins, 'popularity_cmp' );

?>
<table class="table table-condensed">
 <thead>
  <tr>
   <th>Name</th>
   <th>Popularity</th>
   <th>ID</th>
   <th>Version</th>
<!--
   <th>Description</th>
-->
   <th>Download</th>
  </tr>
 </thead>
 <tbody>

<?php
	foreach ( $categories as $category => $category_desc )
	{
		print "<tr class=\"category_header\"><th colspan=\"1\">Category: $category</th><td colspan=\"4\">$category_desc</td></tr>\n";

		$empty = True;
		foreach ( $plugins as $basename => $details )
		{
			$path = "$build/plugins/$basename.user.js";

			$this_category = array_key_exists('@category',$details) ? $details['@category'] : 'Misc';

			if ( $category != $this_category )
				continue;

			$empty = False;

			print "<tr id=\"plugin-$basename\">\n";

			# remove 'IITC Plugin: ' prefix if it's there, for neatness
			$name = preg_replace ( '/^IITC plugin: /i', '', $details['@name'] );

			# format extended version info in less prominent font
			$version = preg_replace ( '/^(\d+\.\d+\.\d+)\.(\d{8}\.\d{1,6})/', '\1<br><small class="muted">.\2</small>', $details['@version'] );

			# remove unneeded prefix from description
			$description = preg_replace ( '/^\[[^]]*\] */', '', $details['@description'] );

			$plugin_users = "-";
			if ( array_key_exists('popularity',$details) )
			{
				$plugin_users = (int)($details['popularity']*1000)/10 . "%";

			}

			print "<td class=\"name\">$name</td>";
			print "<td class=\"popularity\">$plugin_users</td>";
			print "<td class=\"id\">$basename</td>";
			print "<td class=\"version\" rowspan=\"2\">$version</td>";

			if ( $category != "Deleted" )
			{
				print "<td class=\"download\" rowspan=\"2\"><a onclick=\"if(track){track('desktop','iitc-plugin-$basename','$build');}\" href=\"$path\" target=\"_blank\" class=\"btn btn-small btn-primary\" title=\"Download\"><i class=\"icon-download icon-white\"></i></a></td>";
			}

			print "</tr>\n";
			print "<tr><td class=\"description\" colspan=\"3\" style=\"border-top: none; padding-top: 0; padding-bottom: 0.5em\">$description</td></tr>\n";

		}
		if ( $empty )
			print "<tr><td class=\"empty\" colspan=\"4\">(no plugins in this category)</td></tr>\n";

	}
?>
 </tbody>
</table>

<?php
}


?>
