<?php

$response = Array();



$build = $_REQUEST['build'];


$details = Array (
	'jonatkins' => Array ( # live release
		'path' => 'release',
		'name' => 'Stable release build',
	),
	'jonatkins-test' => Array ( # public test builds
		'path' => 'test',
		'name' => 'Test build',
	),

	'jonatkins-experimental' => Array ( # rarely used, for features not quite ready for 'test'
		'path' => 'experimental',
		'name' => 'Experimental build',
	),

	'jonatkins-dev' => Array ( # personal
		'path' => 'dev',
		'name' => 'Development builds - not for public use',
	),

	'local' => Array ( # not a real build, but often the default for local development
		'path' => NULL,
		'name' => 'Local build - no update check available',
	),
);

if ( array_key_exists ( $build, $details ) )
{
	$info = $details[$build];

	$response['buildPath'] = $info['path'];
	$response['name'] = $info['name'];


}
else
{
	$response['error'] = 'Unsupported build for version check';
}


$data = json_encode ( $response );
$data = indent($data);


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


// http://www.daveperrett.com/articles/2008/03/11/format-json-with-php/
/**
 * Indents a flat JSON string to make it more human-readable.
 *
 * @param string $json The original JSON string to process.
 *
 * @return string Indented version of the original JSON string.
 */
function indent($json) {

    $result      = '';
    $pos         = 0;
    $strLen      = strlen($json);
    $indentStr   = '  ';
    $newLine     = "\n";
    $prevChar    = '';
    $outOfQuotes = true;

    for ($i=0; $i<=$strLen; $i++) {

        // Grab the next character in the string.
        $char = substr($json, $i, 1);

        // Are we inside a quoted string?
        if ($char == '"' && $prevChar != '\\') {
            $outOfQuotes = !$outOfQuotes;

        // If this character is the end of an element,
        // output a new line and indent the next line.
        } else if(($char == '}' || $char == ']') && $outOfQuotes) {
            $result .= $newLine;
            $pos --;
            for ($j=0; $j<$pos; $j++) {
                $result .= $indentStr;
            }
        }

        // Add the character to the result string.
        $result .= $char;

        // If the last character was the beginning of an element,
        // output a new line and indent the next line.
        if (($char == ',' || $char == '{' || $char == '[') && $outOfQuotes) {
            $result .= $newLine;
            if ($char == '{' || $char == '[') {
                $pos ++;
            }

            for ($j = 0; $j < $pos; $j++) {
                $result .= $indentStr;
            }
        }

        $prevChar = $char;
    }

    return $result;
}

?>
