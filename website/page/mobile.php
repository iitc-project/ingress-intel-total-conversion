
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
IITC Mobile has some known problems, major issues are:
<ol>
<li>Some plugins do not work well, or at all.</li>
<li>Pinch zoom hangs on some devices.
<a href="https://github.com/jonatkins/ingress-intel-total-conversion/issues/257">details</a>.</li>
</ol>
</p>


<h3>Download</h3>

<?php

include_once ( "code/mobile-download.php" );

$apkfile = "release/IITC_Mobile-release.apk";


if ( file_exists($apkfile) )
{
	iitcMobileDownload ( $apkfile );
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
