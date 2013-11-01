absoluteurl
---------------------

This script converts the relative url to absolute url, provided a base url.


For more, look here: http://publicmind.in/blog/urltoabsolute

Usage:
----------

Extract the script (url_to_absolute.php) into your web directory, include it into your current php file using:

require(path-to-file);

then, you can convert the relative url to absolute url by calling:

url_to_absolute( $baseUrl, $relativeUrl);

It return false on failure, otherwise returns the absolute url. If the $relativeUrl is a valid absolute url, it is returned without any modification.

Author/credits
-----------

1) Original author: David R. Nadeau, NadeauSoftware.com
2) Edited and maintained by: Nitin Kr, Gupta, publicmind.in