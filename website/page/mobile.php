
<h2>IITC Mobile</h2>

<p>
IITC Mobile is an Android application. It works as a simple web browser, with the IITC browser add-on
embedded within it.
</p>

<h3>Requirements</h3>

<p>
Android 4.0 (Ice Cream Sandwich) at a minimum. Android 4.1+ (Jellybean) is highly recommended at this time due to bugs.
</p>


<h3>Installation</h3>

<p>
You need to enable applications installed from unknown sources in your phone settings. Once done, download and
install from the link below.
</p>


<h3>Known issues</h3>

<p>
IITC Mobile is still in the early stages of development. Many things do not yet work right. Major known issues are:
<ol>
<li>The layer chooser selects the first map layer every time it's opened.</li>
<li>Some plugins do not work well, or at all, at this time.</li>
<li>Serious issues exist on Android 4.0 devices.
<a href="https://github.com/jonatkins/ingress-intel-total-conversion/issues/90">details</a>.</li>
</ol>
</p>


<h3>Download</h3>

<?php

include_once ( "code/mobile-version.php" );

$apkfile = "mobile/IITC-Mobile-0.3.apk";


if ( file_exists($apkfile) )
{
	$version = getMobileVersion ( $apkfile );

	$apk_version = $version['apk_version'];
	$iitc_version = preg_replace ( '/^(\d+\.\d+\.\d+)\.(\d{8}\.\d{6})/', '\1<small class="muted">.\2</small>', $version['iitc_version'] );

	print "<p>IITC Mobile version $apk_version, with IITC version $iitc_version</p>\n";

	print "<p><a onclick=\"if(track)({track{'mobile','download','release');}\" class=\"btn btn-large btn-primary\" href=\"$apkfile\">Download</a></p>\n";

}
else
{
	print "<div class=\"alert alert-error\">Error: <b>$apkfile</b> not found</div>\n";
}

?>


<div class="alert alert-info">
As IITC Mobile is regularly updated, you may want to consider trying the latest
<a href="?page=test#test-mobile">test build</a>.
</div>
