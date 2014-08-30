<h2>Frequently Asked Questions</h2>


<?php

$faq = Array (

'ban' => Array ( "Will I be banned for using IITC?",
<<<'END'
<p>
Niantic consider IITC (and any other unofficial software) against the Ingress ToS. However, just because
something is against the ToS it doesn't mean Niantic <i>will</i> enforce it.
</p>
<p>
However, in early December 2013, many people started to believe Niantic were banning people for using IITC. This is not
the case. However, the following events have lead to this belief:
</p>
<ul>
<li>On 27th November 2013, Niantic released a major update of the standard intel site. A couple of days later there were
reports of user bans for 'excessive intel use'. A couple of people confirmed it was attempts to use the broken IITC Mobile 0.9
that lead to instant bans.</li>
<li>About a week later, Niantic made a large batch of user bans 'for ToS violations'. Many users reported their only ToS
violation was using IITC - and some said that even IITC hadn't been used. On appeal, many of these bans were
reversed - including some confirmed IITC users</li>
<li>A week after that and and there were more reports of the same.</li>
</ul>
<p>
Given that a large number of serious Ingress players use, or have used, IITC, it isn't surprising to find
that if Niantic ban someone by mistake, they have used IITC. 
</p>
<p>
I believe none of these 'ToS violation' bans are related to IITC. Rather, Niantic have been working on more aggressive
catching of cheaters and other ToS violations - spoofing, bots, multiple accounts, account sharing, etc. These things
are inherently hard to detect though, and Niantic are likely to make mistakes sometimes, banning legitimate players.
</p>
<p>
Note that Niantic have remained completely silent on the reason for any of these bans. This is partly because if they
did say what someone had been banned for doing, it might lead to cheaters knowing what they can and can't get away with.
</p>
<p>
<b>However</b>: IITC is against the Ingress ToS - so it's sensible to be cautious. Don't publicly share screenshots
from IITC in the official Ingress community, or with the official Ingress/NIA G+ accounts. 
</p>

END
),

'takedown' => Array ( "Why is IITC still available? Wasn't it sent a takedown notice?",
<<<'END'
<p>
I've seen several comments of the form "IITC was sent a takedown notice, and at this point
it moved to Github and kept going". This is not true.
</p>
<ol>
<li>IITC was started on Github, by <a href="https://github.com/breunigs">Stefan breunigs</a>.</li>
<li>Stefan decided to email Niantic, asking if IITC was OK to develop.</li>
<li>Niantic replied to this request, stating that any 3rd party software is against the ToS and asked that he delete it from Github.</li>
<li>Stefan deleted IITC from Github. However, the nature of Git meant that many other copies of the project already existed.</li>
<li>My understanding of the situation, at the time, was that Niantic tolerated IITC. Other software had been sent takedown
requests, IITC had not. However, on an explicit request, Niantic felt forced to reply in strict accordance with their terms.</li>
<li>I, <a href="https://github.com/jonatkins">Jon Atkins</a>, decided to fix up my copy of IITC, and created this website.</li>
<li>Development continued, the website was polished, a G+ page/community were created. Niantic have <i>not</i> contacted me
with a takedown request though.</li>
</ol>
<p>
So, was 'IITC' sent a takedown request? No - this website, and the IITC G+ page, have not been sent such a request.
</p>
END
),

# for reference:
# Some notes from a Hangout available <a href="https://plus.google.com/111333123856542807695/posts/QtiFdoRuh6w">here</a>


'less-data' => Array ( "IITC does not show as much data, many plugins are not available",
<<<'END'
<p>
<b>Update</b>: as of 24th May 2014, Niantic have removed further details from the sent data. The data available
to IITC now is no more than available on the standard intel site. No more details on resonator deployment distances,
portal descriptions, and, as of 16th June 2014, no more portal capture data (it's been removed from the standard site too).
</p>
<p>
On 27th November 2013 Niantic made a major change to the protocol used by the intel map to display portals. Before this
date, the full data for every portal on the map was sent to the browser, so IITC could take advantage of it and provide
various features - resonator search, mitigation highlighters, portal age lists, many highlighters, etc.
</p>
<p>
After this date they only send the bare minimum of data for all the portals on the screen. The data available is:
</p>
<ul>
<li>Location</li>
<li>Name</li>
<li>Photo URL</li>
<li>Controlling team</li>
<li>Level (whole number only)</li>
<li>Resonator count</li>
<li>Health (in percent)</li>
</ul>
<p>
IITC can also count links/fields visible on the map, but this is not accurate when zoomed out to larger areas as
the server does not send the smaller links/fields.
</p>
<p>
It is still possible to get the full details for individual portals, but only one at a time.
Some people have suggested making IITC do this automatically with a plugin - but it's very likely that
Niantic will monitor the portal detail requests for this kind of abuse and suspend/ban anyone caught doing it.
</p>
<p>
Some people think that Niantic made this change just to break IITC. This is not true. It was a sensible change to make
to optimise the intel map, and I'm surprised they waited so long.
</p>
END
),

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
are no (known) cases of this happening due to IITC use, but any use of bots, unofficial clients (e.g. broot),
or other ingress mods (auto-drop/pickup apps) could lead to this. In this case, the scanner app will also fail
to work correctly ("Scan failed" error message).
</p>
END
),

'broken' => Array ( "No portals are displayed on the map/some portals are missing",
<<<'END'
<p>
There is a known issue with the Niantic servers, where sometimes the occasional portal is not shown. Additionally,
due to differences between IITC and standard intel by default, it can appear differently in IITC.
</p>
<p>
It is usually easy to find the same zoom level on the standard intel map which causes the problem portal to vanish
there too - usually you just need to zoom out once or twice. To make IITC behaviour match the standard intel site:
</p>
<ul>
<li>Disable the 'show more portals' plugin</li>
<li>Install/enable the 'default intel detail level' plugin</li>
</ul>
<p>
Some community posts discussing this issue are
<a href="https://plus.google.com/115049949416134175118/posts/ZVjk7cR1nfT">here</a>, and
<a href="https://plus.google.com/110237353326976863775/posts/UCMk1VvoHMg">here</a>.
</p>
<p>
Other reasons.
</p>
<ol>
<li>You have some portal layers turned off in the layer chooser</li>
<li>Niantic have released a site update that broke IITC. Reloading the page might fix it.
Otherwise check the G+ IITC Community as others are likely to post when this is the case.</li>
<li>Some requests failed - check the status at the bottom-right of the screen</li>
</ol>
END
),

'curved-lines' => Array ( "Long lines are drawn curved on the map",
<<<'END'
This is a good thing. IITC has been updated (as of 0.13.0) to draw long links/fields correctly. If you want to understand
why they are drawn curved, see
<a href="http://gis.stackexchange.com/questions/6822/why-is-the-straight-line-path-across-continent-so-curved">here</a>.
END
),

'uninstall' => Array ( "IITC Desktop: How do I uninstall/disable IITC or plugins?",
<<<'END'
This depends on your browser.
<ul>
<li><b>Chrome + Tampermonkey</b>: Click on the Tampermonkey icon (a dark square with two circles at the bottom) and choose 'Dashboard'.</li>
<li><b>Firefox + Greasemonkey</b>: Click on the arrow next to the monkey icon, and choose 'Manage user scripts'.</li>
<li>For Opera, remove the scripts from the userscript folder. For Chrome without Tampermonkey, go to the Tools-&gt;Extensions menu.</li>
</ul>
From here you can remove/disable individual plugins or IITC itself.
</li>
END
),

'mobile-plugins' => Array ( "IITC Mobile: Is it possible to add external plugins to IITC Mobile?",
<<<'END'
Yes it is!
<ul>
<li>Navigate to the IITC Plugins preference screen and click the (+) icon at the top right. You can select the script using a file explorer of your choice.</li>
<li>IITCm creates a new folder in your home directory, named "IITC_Mobile". Inside this folder you'll find a "plugins" folder where all external plugins are copied to.</li>
</ul>
Note:
<ul>
<li>The filename has to end with *.user.js.</li>
<li>You can also trigger installation by clicking on http(s) links pointing to a plugin, selecting plugins with a file explorer, opening javascript e-mail attachments etc...
</ul>
END
),

'offline-map-tiles' => Array ( "IITC Mobile: Is it possible to prefetch map tiles to reduce data traffic?",
<<<'END'
In fact, you don't have to care about tile caching. On mobile networks, IITCm
downloads tiles only if it's really needed. Tiles are updated only when
connected to WiFi. If you still want to prefetch tiles, go on reading:
<ul>
<li>Prefetching does only work for providers which follow the OpenStreetMap tile folder structure (for example: Google or Bing tiles don't work)</li>
<li>It is recommended to use the external storage for tile caching, so check it in IITCms settings. Otherwise, your storage is highly limited and you need root access</li>
<li>A recommended tool for downloading tiles can be found <a href="http://wiki.openstreetmap.org/wiki/JTileDownloader">here</a></li>
  <ul>
  <li>A custom build including MapQuest tiles as default can be found <a href="http://iitcm.code-noobs.org/jTileDownloader-0-6-1-iitc.jar">here</a></li>
  </ul>
<li>The easiest way is choosing a Bounding Box (Lat/Lon) via the Slippy Map chooser</li>
<li>On your smartphone, search for your providers tile directory. Mapquest should be in &lsaquo;home directory&rsaquo;/Android/data/com.cradle.iitc_mobile/tiles/mpcdn.com/1.0.0/map/</li>
<li>Finally, copy the content of JTileDownloaders output folder to the appropriate directory on your smartphone</li>
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

# FAQ table of contents
print "<ul>";

foreach ( $faq as $name => $value )
{
	$title = $value[0];
	$body = $value[1];

	print "<li><a href=\"#$name\">$title</a></li>\n";

}

print "</ul>";

print "<hr>\n";


# faq list

foreach ( $faq as $name => $value )
{
	$title = $value[0];
	$body = $value[1];

	print "<div class=\"panel panel-default\" id=\"$name\">";
	print "<div class=\"panel-heading\"><h4>$title</h4></div>";
	print "<div class=\"panel-body\">$body</div>";
	print "</div>\n";

}


?>
