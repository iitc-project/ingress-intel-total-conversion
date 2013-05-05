<?php

function loadUserScriptHeader($file)
{
	$result = Array();

	if ( is_string($file) )
		$file = fopen ( $file, "rt" );
	# else assume it's already a readable stream

	while ( ( $line = fgets ( $file ) ) !== FALSE )
	{
		if ( preg_match ( '#//[ \\t]*==/UserScript==#', $line ) )
			break;

		$matches = Array();
		if ( preg_match ( '#^//[ \\t]*(@[a-zA-Z0-9]+)[ \\t]+(.*)$#', $line, $matches ) )
		{
			$name = $matches[1];
			$value = $matches[2];

			if ( ! array_key_exists ( $name, $result ) )
			{
				$result[$name] = $value;
			}
		}
	}

	fclose ( $file );

	return $result;
}


?>
