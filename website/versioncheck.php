<?php

include_once "code/userscript.php";
include_once "code/url/url_to_absolute.php";


$response = Array();


$build = $_REQUEST['build'];


$details = Array (
	'jonatkins' => Array ( # live release
		'path' => 'release',
		'name' => 'Stable release build',
		'web' => 'http://iitc.jonatkins.com/?page=download',
	),
	'jonatkins-test' => Array ( # public test builds
		'path' => 'test',
		'name' => 'Test build',
		'web' => 'http://iitc.jonatkins.com/?page=test',
	),

	'jonatkins-experimental' => Array ( # rarely used, for features not quite ready for 'test'
		'path' => 'experimental',
		'name' => 'Experimental build',
		'web' => 'http://iitc.jonatkins.com/?page=test&build=experimental',
	),

	'jonatkins-dev' => Array ( # personal
		'path' => 'dev',
		'name' => 'Development builds - not for public use',
		'web' => 'http://iitc.jonatkins.com/?page=test&build=dev',
	),

	'local' => Array ( # not a real build, but often the default for local development
		'path' => NULL,
		'name' => 'Local build - no update check available',
	),
);

if ( array_key_exists ( $build, $details ) )
{
	$info = $details[$build];

	$pageurl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] ? "https" : "http")."://".$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'];

	$response['name'] = $info['name'];

	$dir = $info['path'];

	// load main script version
	$iitc_details = loadUserScriptHeader ( "$dir/total-conversion-build.user.js" );
	$response['iitc'] = Array (
		'version' => $iitc_details['@version'],
		'downloadUrl' => url_to_absolute ( $pageurl, "$dir/total-conversion-build.user.js" ),
		'pageUrl' => url_to_absolute ( $pageurl, $info['web'] ),
	);

	// and now the plugins

	$response['plugins'] = Array();

	foreach ( glob ( "$dir/plugins/*.user.js" ) as $path )
	{
		$basename = basename ( $path, ".user.js" );
		$details = loadUserScriptHeader ( $path );

		$response['plugins'][$basename] = Array (
			'version' => $details['@version'],
			'downloadUrl' => url_to_absolute ( $pageurl, "$dir/plugins/$basename.user.js" ),
			'pageUrl' => url_to_absolute ( $pageurl, $info['web']."#plugin-$basename" ),
		);
	}

}
else
{
	$response['error'] = 'Unsupported build for version check';
}


$data = json_encode ( $response );


# send the response - allow either jsonp (using a 'callback' parameter), or regular json
if ( array_key_exists ( 'callback', $_GET ) )
{
	header('Content-Type: text/javascript; charset=utf8');
	header('Access-Control-Allow-Origin: *');
	header('Access-Control-Max-Age: 3628800');
	header('Access-Control-Allow-Methods: GET, POST');

	$callback = $_GET['callback'];
	echo $callback.'('.$data.');';

}
else
{
	// normal JSON string
	header('Content-Type: application/json; charset=utf8');

	echo $data;
}


