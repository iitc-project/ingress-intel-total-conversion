<h2>Frequently Asked Questions</h2>


<?php

$faq = Array (

'not-activated' => Array ( "I get a message saying my account isn't activated",
<<<'END'
<p>
Occasionally the Niantic servers give this misleading message - what it should usually say is
"Failed to check account status - please reload to try again".
</p>
<p>
Sometimes this is caused by server issues, and no amount of reloading will fix it. Come back later and try again.
</p>
<p>
However, another reason for this message is your account being blocked/suspended by Niantic. There
are no (known) cases of this happening due to IITC use, but any use of bots, unofficial clients (e.g. iPhone, broot),
or other ingress mods (auto-drop/pickup apps) could lead to this. In this case, the scanner app will also fail
to work correctly ("Scan failed" error message).
</p>
END
),

'broken' => Array ( "No portals are displayed on the map/some portals are missing",
<<<'END'
Two common reasons.
<ol>
<li>You have some portal layers turned off in the layer chooser</li>
<li>Some requests failed - check the status at the bottom-right of the screen</li>
</ol>
In the second case, wait 30 seconds for the next refresh, or drag the map a very small amount to perform an immediate
refresh.
END
),

'curved-lines' => Array ( "Long lines are drawn curved on the map",
<<<'END'
This is a good thing. IITC has been updated (as of 0.13.0) to draw long links/fields correctly. If you want to understand
why they are drawn curved, see
<a href="http://gis.stackexchange.com/questions/6822/why-is-the-straight-line-path-across-continent-so-curved">here</a>.
END
),

'uninstall' => Array ( "How do I uninstall/disable IITC or plugins?",
<<<'END'
This depends on your browser.
<ul>
<li><b>Chrome + Tampermonkey</b>: Click on the Tampermonkey icon (a dark square with two circles at the bottom) and choose 'Dashboard'.</li>
<li><b>Firefox + Greasemonkey</b>: Click on the arrow next to the monkey icon, and choose 'Manage user scripts'.</li>
<li>For Opera, remove the scripts from the userscript folder. For Chrome without Tampermonkey, go to the Tools-&gt;Extensions menu.</li>
</ul>
From here you can remove/disable individual plugins or IITC itself.
</li>
),

'mobile-plugins' => Array ( "Is it possible to add external plugins to IITC Mobile?",
<<<'END'
Yes it is!
<ul>
<li>Create a folder named "IITC_Mobile" in your home directory.</li>
<li>Inside this folder, create a new folder named "plugins".</li>
<li>Copy all your additional plugins to this folder.</li>
<li>You should see your plugins listed above the official plugins.</li>
</ul>
Note:
<ul>
<li>The filename has to end with *.user.js.</li>
<li>If you don't know where to find your home directory: Enable dev-mode in the settings and follow the hint.</li>
</ul>
END
),

'debug-data-tiles' => Array ( "What do the colours mean in 'DEBUG Data Tiles'",
<<<'END'
The data from the Niantic server is download in square tiles. Sometimes requests fail. The colours show this status
visually. The outline colour shows the state of the request:
<ul>
<li>Blue: data requested, waiting for response</li>
<li>Grey: queued, waiting for other requests to finish</li>
<li>Green: successful request/cached data fresh</li>
<li>Red: Dark red for a complete request failure, lighter red for an individual tile timeout</li>
</ul>
The colour within the square shows the state of the data:
<ul>
<li>Blue: data requested, waiting for response</li>
<li>Grey: queued, waiting for other requests to complete</li>
<li>Green: successful request</li>
<li>Yellow: data from cache</li>
<li>Red: request failed - no data from cache</li>
</ul>
The status message at the bottom-right of the screen gives a summary.
<ul>
<li>If all requests were successful/fresh from cache (i.e. all green borders) the status is 'Done'.</li>
<li>If some requests failed, but cached data was available (i.e. some red border/yellow fill) the status is 'Out of date'.</li>
<li>If some requests failed, but no cached data was available (i.e. some red border/red fill) the status is 'Error'.</li>
</ul>
The tooltip for this message gives more details.
END
),

'no-penalty' => Array ( "Will Google/Niantic penalise me for using IITC?",
<<<'END'
There have been rumours that Niantic/Google have been asking people to stop using IITC, and penalising users
with a loss of points for doing so. This, as far as we can tell, is a hoax. Consider the following:
<ol>
<li>Before penalising users, they would request that this site is taken down. This has not happened.</li>
<li>Any such request would come via email, not via a Google+ message. Ingress is not closely tied into the Google
account system unlike, for example, Gmail; an email, like they already use for portal submissions, is the only
communication method available.</li>
<li>The message I've seen talks about "points" - when they should be talking about "AP".</li>
</ol>
Some notes from a Hangout available <a href="https://plus.google.com/111333123856542807695/posts/QtiFdoRuh6w">here</a>
with further details.
END
),

'cheating' => Array ( "Isn't using IITC cheating/an unfair advantage?",
<<<'END'
IITC only uses data that is sent from the Ingress servers to the browser - it just displays it in an easy to use format.
With the right skills it is already possible to see this data using the browser debugging console, and
there were, and continue to be, other browser add-ons that display this data - just not widely available.
Having a good quality, feature rich add-on, available to all - Enlightened and Resistance - ensures one side does not
have an unfair advantage.
END
),

'export' => Array ( "Can you add an export feature?",
<<<'END'
No. As it stands IITC is tolerated, but not officially accepted, by Niantic/Google. Adding in features that
allow exporting of data outside the browser environment, or break additional Ingress terms of service
is likely to trigger a takedown request from Google.
END
),

'otherapp' => Array ( "I used another <i>{ingress mod/IITC plugin}</i> and it's broken - can you fix it?",
<<<'END'
Probably not, no. If the plugin is not listed on this site, it's not part of my IITC distribution.
I do accept new plugins (see the Developer page for links to Github), but I do not accept any that
allow export of Ingress data outside of the browser or make use of data not retrieved by the standard intel website.
END

),

);


print "<ul>";

foreach ( $faq as $name => $value )
{
	$title = $value[0];
	$body = $value[1];

	print "<li><h4 id=\"$name\">$title</h4>\n";
	print "$body\n";
	print "</li>\n";

}

print "</ul>";

?>
