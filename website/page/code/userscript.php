<?php

function loadUserScriptHeader($path)
{
	$result = Array();

	$f = fopen ( $path, "rt" );
	while ( ( $line = fgets ( $f ) ) !== FALSE )
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

	fclose ( $f );

	return $result;
}


?>
