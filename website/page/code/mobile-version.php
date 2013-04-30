<?php

include_once ( "apk/ApkParser.php" );
include_once ( "userscript.php" );

function getMobileVersion($apkfile)
{
	$result = Array();


	$apkinfo = new ApkParser ( $apkfile );

	$manifest = $apkinfo->getManifest();

	$result['apk_version'] = $manifest->getVersionName();


	$archive = $apkinfo->getApkArchive();
	$iitc_file = "assets/total-conversion-build.user.js";
	if ( $archive->statName ( $iitc_file ) === FALSE );
		$iitc_file = "assets/iitc.js";

	$stream = $archive->getStream ( $iitc_file );

	$header = loadUserScriptHeader ( $stream );

	$result['iitc_version'] = $header['@version'];

	return $result;
}

?>
