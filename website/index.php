<?php

$path = "release";

if ( $_REQUEST['build'] == 'dev' )
	$path = "dev";


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
<?php echo "<?xml version=\"1.0\" encoding=\"utf8\"?>\n" ?>
<html>
<head>
<title>Ingress Intel Total Conversion</title>
</head>

<?php
if ( file_exists ( 'tracking.php' ) )
{
	include 'tracking.php';
}
?>

<style>
body
{
	font-family: sans-serif;
	background: #fff;
	color: #000;
}

a:link, a:visited { text-decoration: none; }
a:hover { text-decoration: underline; }

</style>

<body>
<h1>Ingress Intel Total Conversion</h1>

<p>
IITC is <a href="https://github.com/breunigs/ingress-intel-total-conversion#readme">dead</a> - long live IITC!
</p>

<p>
The IITC mod is an open source project. Since the original closed, I resurrected it and will try to continue development.
</p>

<p>
If you're interested in further development, come on over to
<a href="https://github.com/jonatkins/ingress-intel-total-conversion">the github page</a>. If you just want to install
and use it, read on.
</p>

<p>
<b>Note</b>: This site and the scripts are not officially affiliated with Ingress or Niantic Labs at Google.
Using these scripts is likely to be considered against the Ingress Terms of Service. You do this at your own risk.
</p>

<h2>Downloads</h2>

<h3>IITC - browser addon</h3>

<?php

if ( $path != "release" )
	print "<p><b>NOTE</b>: the <b>$path</b> build is currently selected. <a href=\"/\">Return to main build</a>.</p>";
?>

<p>
<b>IMPORTANT!</b>: You <b>must</b> uninstall the original IITC before installing this version. Failure to do this
will result in multiple copes installed which I expect will cause a LOT of issues.
</p>

<p>
<b>NOTE</b>: The first release available here was not configured correctly for auto updates.
If you installed before this note appeared (22nd March 2013) you will need to
manually uninstall IITC and all plugins, then reinstall from below. Going forward, updates will work correctly
(for Chrome + Tampermoneky and Firefox + Greasemonkey users).
</p>

<?php
$iitc_details = loadUserScriptHeader ( "$path/total-conversion-build.user.js" );
?>

<p>
<a href="<?php print $path;?>/total-conversion-build.user.js">IITC main script</a> - <i>version <?php print $iitc_details['@version'];?></i>.
</p>

<h4>Plugins</h4>

<ul>

<?php
foreach ( glob ( "$path/plugins/*.user.js" ) as $path )
{
	$name = basename ( $path, ".user.js" );

	$details = loadUserScriptHeader ( $path );

	print "<li>\n";

	print "<a href=\"$path\">".$details['@name']."</a> <i>$name - version ".$details['@version']."</i>: <br/>\n";
	print $details['@description'];

	print "</li>\n";
}

?>
</ul>

<h4>Installation</h4>

<p>Installation varies depending on browser.</p>

<p>
<b>Chrome</b>:
<a href="https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo">Tampermonkey</a>
is highly recommended. (Userscripts can be installed directly within the 'extensions' settings, but will not auto update.)
</p>

<p>
<b>Firefox</b>:
The <a href="https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/">Greasemonkey</a> add-on can be used.
</p>

<p>
<b>Opera</b>:
There is a setting for a userscripts folder.
</p>

<h3>IITC - mobile</h3>

<p>
A proper version of mobile will be available in the future. Until then, here's the last build
available from the original IITC page.
</p>

<p>
<a href="mobile/IITC-Mobile-latest.apk">Download</a>.
</p>

<p>
This is likely to have some issues, but should work well enough for now.
</p>


<h2>Credits</h2>

<p>
Nearly all the work here is by others.
<a href="https://github.com/breunigs">Stefan Breunig</a> was the main driving force. See the
<a href="https://github.com/jonatkins/ingress-intel-total-conversion/commits/master">github commit log</a>
for full details.
</p>

<h2>License</h2>

<pre>
Copyright © 2013 Stefan Breunig

Permission to use, copy, modify, and/or distribute this software for
any purpose with or without fee is hereby granted, provided that the
above copyright notice and this permission notice appear in all
copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL
WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE
AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL
DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA
OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
</pre>


</body>
</html>
