<h2>Test Builds</h2>

<p>
These test builds are made available for those who would like to try the latest development code without
needing to build it yourself. Automated scripts should update these builds within an hour of a change being
<a href="https://github.com/jonatkins/ingress-intel-total-conversion/commits/master">committed</a> to Github.
</p>

<div class="alert alert-block alert-error">
Test builds are built automatically. They could be <b>broken at any time</b>. If you have any doubts about using
unstable software, please use the standard <a href="?page=desktop">desktop</a> or <a href="?page=mobile">mobile</a>
builds.
</div>

<?php

include_once ( "code/desktop-download.php" );


$path = "test";

if ( $_REQUEST['build'] == 'experimental' )
	$path = "experimental";
if ( $_REQUEST['build'] == 'dev' )
	$path = "dev";

if ( $path != "test" )
	print "<div class=\"alert alert-block alert-error\"><b>NOTE</b>: A non-standard test build, <b>$path</b>, is currently selected. The notes <b>may not apply!</b> <a href=\"?page=test\">Return to the standard test build</a>.</div>";


$timestamp_file = $path . "/.build-timestamp";
if ( file_exists ( $timestamp_file ) )
{
	$build_time = file_get_contents ( $timestamp_file );

	print "<div class=\"alert alert-info\">The current test build was built at <b>$build_time</b></div>";
}
else
{
}

?>

<h3 id="test-desktop">Desktop test build</h3>

<?php
iitcDesktopDownload ( $path );
?>

<hr>


<h4>Desktop test plugins</h4>

<?php
iitcDesktopPluginDownloadTable ( $path );
?>

<hr>

<h3 id="test-mobile">Mobile test build</h3>

<?php

include_once ( "code/mobile-download.php" );

$apkfile = "$path/IITC_Mobile-test.apk";


if ( file_exists($apkfile) )
{
	iitcMobileDownload ( $apkfile );
}
else
{
	print "<div class=\"alert alert-error\">Error: <b>$apkfile</b> not found</div>\n";
}


?>



