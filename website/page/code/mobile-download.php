<?php

include_once ( "apk/ApkParser.php" );
include_once ( "url/url_to_absolute.php" );
include_once ( "userscript.php" );

function getMobileVersion ( $apkfile )
{
	$result = Array();


	$apkinfo = new ApkParser ( $apkfile );

	$manifest = $apkinfo->getManifest();

	$result['apk_version'] = $manifest->getVersionName();


	$archive = $apkinfo->getApkArchive();

	$stream = $archive->getStream ( "assets/total-conversion-build.user.js" );
	if ( ! $stream )
		$stream = $archive->getStream ( "assets/iitc.js" );

	if ( $stream )
	{
		$header = loadUserScriptHeader ( $stream );

		$result['iitc_version'] = $header['@version'];
	}
	else
	{
		$result['iitc_version'] = 'unknown';
	}

	return $result;
}

function iitcMobileDownload ( $apkfile )
{

	$version = getMobileVersion ( $apkfile );

	$apk_version = $version['apk_version'];
	$iitc_version = preg_replace ( '/^(\d+\.\d+\.\d+)\.(\d{8}\.\d{1,6})/', '\1<small class="muted">.\2</small>', $version['iitc_version'] );

	# we need an absolute link for the QR Code
	# get the URL of this page itself
	$pageurl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] ? "https" : "http")."://".$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'];
	$apkurl = url_to_absolute ( $pageurl, $apkfile );
?>


<div>

<img style="float: right; margin: 10px;" src="https://chart.googleapis.com/chart?cht=qr&chs=120x120&chld=L|2&chl=<?php print urlencode($apkurl); ?>" alt="QR Code for download">

<p>
IITC Mobile version <?php print $apk_version; ?>, with IITC version <?php print $iitc_version; ?>
</p>

<p>
<a style="margin-right: 1em;" onclick="if(track){track('mobile','download','<?php print $apkfile; ?>');}" class="btn btn-large btn-primary" href="<?php print $apkfile; ?>">Download</a> or scan the QR Code
</p>

</div>
<div style="clear: both"></div>


<?php

}

?>
