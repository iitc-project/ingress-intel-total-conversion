<h2>Frequently Asked Questions</h2>

<ul>

<li>
<h4 id="not-activated">I get a message saying my account isn't activated</h4>
<p>
Occasionally the Niantic servers give this misleading message - what it should usually say is
"Failed to check account status - please reload to try again". IITC will, in most cases, retry for you.
</p>
<p>
Sometimes this is caused by server issues, and no amount of reloading will fix it. Come back later and try again.
</p>
<p>
However, another reason for this message is your account being blocked/suspended by Niantic. There
are no (known) cases of this happening due to IITC use, but any use of bots, unofficial (e.g. iPhone) clients,
or other ingress mods could lead to this. In this case, the scanner app will also fail to work correctly.
</p>
</li>

<li>
<h4 id="broken">No portals are displayed on the map/some portals are missing</h4>
Two common reasons.
<ol>
<li>You have some portal layers turned off in the layer chooser</li>
<li>Some requests failed - check the status at the bottom-right of the screen</li>
</ol>
In the second case, wait 30 seconds for the next refresh, or drag the map a very small amount to perform an immediate
refresh.
</li>

<li>
<h4 id="curved-lines">Long lines are drawn curved on the map</h4>
This is a good thing. IITC has been updated (as of 0.13.0) to draw long links/fields correctly. If you want to understand
why they are drawn curved, see
<a href="http://gis.stackexchange.com/questions/6822/why-is-the-straight-line-path-across-continent-so-curved">here</a>.
</li>

<li>
<h4 id="uninstall">How do I uninstall/disable IITC or plugins?</h4>
This depends on your browser.
<ul>
<li><b>Chrome + Tampermonkey</b>: Click on the Tampermonkey icon (a dark square with two circles at the bottom) and choose 'Dashboard'.</li>
<li><b>Firefox + Greasemonkey</b>: Click on the arrow next to the monkey icon, and choose 'Manage user scripts'.</li>
<li>For Opera, remove the scripts from the userscript folder. For Chrome without Tampermonkey, go to the Tools-&gt;Extensions menu.</li>
</ul>
From here you can remove/disable individual plugins or IITC itself.
</li>

<li>
<h4 id="mobile-plugins">Is it possible to add external plugins to IITC Mobile?</h4>
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
</li>

<li>
<h4 id="debug-data-tiles">What do the colours mean in 'DEBUG Data Tiles'</h4>
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
</li>

<li>
<h4 id="no-penalty">Will Google/Niantic penalise me for using IITC?</h4>
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
</li>

<li>
<h4 id="bluemap">What happened to the original blue map?</h4>
If you're asking about the default ingress map, this is available in the layer chooser, as "Default Ingress Map".
If you're wondering about the blue map available in the original IITC, this is no longer available by default, as we
far exceeded the free quota offered by Cloudmade, the map tile provider. However, there is a template plugin you can
use to add these back.
<ol>
<li>Install the <a href="?page=desktop#plugin-basemap-cloudmade">basemap-cloudmade plugin</a>.</li>
<li>Find the plugin.
In Chrome+Tampermonkey, choose 'Dashboard' from the Tampermonkey menu;
in Firefox+Greasemonkey, choose 'Manage user scripts' from the Greasemonkey menu.</li>
<li>Edit the plugin code, and follow the instructions within the file. You will need to register your own account
at Cloudmade.com, and obtain your own API key.</li>
</ol>
</li>

<li>
<h4 id="cheating">Isn't using IITC cheating/an unfair advantage?</h4>
IITC only uses data that is sent from the Ingress servers to the browser - it just displays it in an easy to use format.
With the right skills it is already possible to see this data using the browser debugging console, and
there were, and continue to be, other browser add-ons that display this data - just not widely available.
Having a good quality, feature rich add-on, available to all - Enlightened and Resistance - ensures one side does not
have an unfair advantage.
</li>

<li>
<h4 id="export">Can you add an export feature?</h4>
No. As it stands IITC is tolerated, but not officially accepted, by Niantic/Google. Adding in features that
allow exporting of data outside the browser environment, or break additional Ingress terms of service
is likely to trigger a takedown request from Google.
</li>

<li>
<h4 id="otherapp">I used another <i>{ingress mod/IITC plugin}</i> and it's broken - can you fix it?</h4>
Probably not, no. If the plugin is not listed on this site, it's not part of my IITC distribution.
I do accept new plugins (see the Developer page for links to Github), but I do not accept any that
allow export of Ingress data outside of the browser or make use of data not retrieved by the standard intel website.
</li>

</ul>
