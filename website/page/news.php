<h2>News</h2>

<h4>12th August 2013</h4>
<p>
A bugfix IITC release 0.13.1, and IITC Mobile 0.5.4 has just been released.
<ul>
<li>Fix short links occasionally being drawn to the opposite side of the world on mobile</li>
<li>Fix mobile splash screen not being removed when certain errors occur</li>
<li>Portal link range circles are now drawn using geodesic mode, to match the previous changes to links and fields</li>
<li>Draw tools plugin: now saves the drawn items in localStorage, so they are not lost on a page reload</li>
<li>Some performance improvements and other bug fixes</li>
</ul>
</p>

<h4>1st August 2013</h4>
<p>
Important IITC release 0.13.0, to fix enlightened from showing up as the wrong colour
(in some places as neutral - orange/white, in others the same colour as resistance). Also includes the following changes
<ul>
<li>Fix enlightened portals, etc showing up in the wrong colour</li>
<li>Geodesic mode used for links/fields/draw tools - to allow accurate representation of long links</li>
<li>Fixed ghost links being drawn in IITC that don't exist in stock intel map or the game</li>
<li>Added photo attribution and portal description details to the large portal image dialog</li>
<li>Limited the chat text input box so you can't enter more text than the server can handle</li>
<li>Mobile<ul>
 <li>New splash screen while IITC loads</li>
 <li>Fixed login issues on mobile data</li>
 <li>Fixed desktop mode breaking</li>
 <li>New share activity, replaces separate map link/permalink options</li>
 <li>sync plugin disabled on mobile, as it currently is broken there</li>
 <li>IPAS plugin updated. This had been done earlier on desktop, but not mobile</li>
 </ul>
<li>Plugins<ul>
 <li>Update mod highlighter plugin</li>
 <li>Portals list plugin updates</li>
 </ul>
<li>plus various other tweaks, bug fixes, etc</li>
</ul>

<h4>20th July 2013</h4>
<p>
IITC now has a <a href="https://plus.google.com/communities/105647403088015055797">Google+ Community</a>.
This is a great place to ask questions and discuss IITC with other users.
</p>

<h4>1st July 2013</h4>
<p>
IITC version 0.12.2 released, and IITC Mobile 0.4.8. 
<ul>
<li>Various internal improvements to reduce requests to the Niantic servers and improve performance;
a data tile cache, and fixes to idle code when the user isn't interacting.</li>
<li>Improved display of stats for the new mods.</li>
<li>Portal range calculation now includes boost from link amps.</li>
<li>Removed 'redeem code' input box - not sure when it's returning.</li>
</ul>
Plugin changes:
<ul>
<li>Guess player levels - option to reset guesses.</li>
<li>New highlighter plugins for the new mods.</li>
<li>Max-links plugin - fixed problems with very narrow triangles causing overlapping links sometimes.</li>
<li>Portals-list plugin - support for the new mods.</li>
<li>Show portal weakness plugin - tweaks to highlight portals with non-defensive mods.</li>
<li>Plugin to show increased portal detail (intended for mobile and smaller screens. Can cause more errors on larger screens)</li>
</ul>
</p>

<h4>12th June 2013</h4>
<p>
IITC version 0.12.1 released, and IITC Mobile 0.4.6. Changes include:
<ul>
<li>Display details about the new portal mods</li>
<li>Updated Leaflet.js version - may reduce issues found on some Samsung devices running Android 4.1 (Jellybean)</li>
<li>Fix resolving a large number of player names in one go</li>
<li>Prevent refreshing old chat messages on small map movements - can vastly reduce repeated requests in some cases</li>
<li>Various improvements/tweaks to the mobile version</li>
<li>AP list plugin: fixed shield mitigation calculation</li>
<li>New basemap plugins: OpenStreetMap, OpenCycleMap, Yandex (Russian), and a template for CloudMade.com to restore the original blue map</li>
<li>Guess player level plugin: attempt to spot when a Jarvis Virus/ADA Refactor has been used and ignore that player's resonators when guessing the level</li>
<li>Max links plugin: optimisations and dashed lines</li>
</ul>

<h4>22nd May 2013</h4>
<p>
IITC version 0.12.0 has been released. This contains quite a few changes and new features, including
<ul>
<li>Portal highlighter system - and many portal highlighter plugins</li>
<li>Dialogs - can be kept open and dragged while viewing the map</li>
<li>Layers - the enabled layers are now remembered when you next load the intel site</li>
<li>Improved request limits - more improvements have been made in this area</li>
<li>Sync plugin - to sync data from the 'Keys' addon to multiple computers via Google Drive</li>
<li>... and many other tweaks, bug fixes, etc</li>
</ul>
IITC Mobile 0.4.0 is also released. THis has also had major work. Along with the above, it includes a
new in-app layer chooser and chat/map switcher, and authentication has been revamped to use the native
Android authentication rather than entering your password.
</p>

<h4>2nd May 2013</h4>
<p>
IITC version 0.11.3 has been released. This should vastly reduce the chance of getting REQUEST_FAILED errors
while scrolling/zooming the map frequently. The passcode redemption code has been updated, and there are improvements
to the URL link handling. The portals-list plugin has been updated, and bug fixes made to the
player tracker. A new plugin to show portal levels as numbers has been added too.
</p>
<p>
IITC Mobile 0.3.2 is also available. Along with the above, this includes a new option to show your current
position on the map.
</p>

<h4>28th April 2013</h4>
<p>
New website launched! A major revamp of the website has been made. Thanks to the various users who contributed
logos and site templates.
</p>

<h4>26th April 2013</h4>
<p>
IITC 0.11.2 released. This has a minor fix relating to portal visibility at different zoom levels. We now have to 
match the standard intel site. This does, unfortunately, mean you need to zoom even closer to see unclaimed portals.
Also, an update to the scoreboard plugin has been released that should make it work again.
</p>

<h4>24th April 2013</h4>
<p>
IITC 0.11.0 is a critical release that fixes the display of portals on the map. Niantic/Google have changed
the way portals are retrieved from the servers and this broke the old IITC. There are reports of some issues
with failure to display links/fields in some areas - we're working on it.
</p>
<p>
Also, IITC Mobile 0.3 has been released. As well as including the above 0.11.0 IITC build, it also contains
experimental support for plugins. This is still in the early stages of development - not all plugins work
well (or at all) for mobile.
Plugins are disabled by default - you need to choose which plugins to enable in the app settings.
</p>
<p>
<b>Update</b> IITC 0.11.1 has been released. This fixes issues where not all links displayed in some areas, and
some bugs in the changed code. An updated IITC Mobile 0.3 includes this new version too.
</p>

<h4>12th April 2013</h4>
<p>
IITC 0.10.5, an urgent release that (unfortunately) removes the default CloudMade map tiles. This is required because
IITC is popular enough to exceed their free quota significantly. Also, IITC Mobile 0.2.8 has been released, with
the same change. (0.10.4 was available for a short while, without the MapQuest map layer. This had zoom-related issues
on IITC Mobile)
</p>

<h4>4th April 2013</h4>
<p>
IITC 0.10.3 released. This is a minor update that prevents certain types of system messages from appearing in the
faction chat window. No plugin changes. (A 0.10.2 was released a few hours earlier, but this was found to have issues
in certain situations).
</p>


<h4>1st April 2013</h4>
<p>
No fooling - new 0.10.1 IITC released. Changes include improved chat display for "@player" messages, and
improvements to the 'poslinks' window. Also, updates to several plugins, including <i>ap-list</i>, <i>player-tracker</i>,
<i>portals-list</i> and <i>show-linked-portals</i>. Also, new plugins include
<i>keys</i> and <i>keys-on-map</i> (for MANUAL tracking of your keys), <i>portal-counts</i> and <i>privacy-view</i>.
</p>
<p>
Also, IITC Mobile 0.2.4 is available. This includes the 0.10.1 IITC, plus new settings. One to choose between mobile
and desktop versions of the site, and another developer-only option to load IITC from an external web server. This
will make it easier for others to work on improving the IITC Mobile experience without knowledge of building Android
applications.
</p>

<h4>28th March 2013</h4>
<p>
IITC Mobile 0.2.3 released. This has new icons, should improve stability, and includes the latest IITC 0.10.0. Users of older versions will have to
uninstall before you can install this build. It can be found below in the <a href="#mobile">mobile</a> section.
</p>

<h4>25th March 2013</h4>
<p>
IITC 0.10.0 released. The major change in this version is that all external resources (icons, external scripts)
have now been embedded within the scripts themselves. Several plugins have been updated in the same way. Other plugin
updates, and a new plugin, are also included.
</p>
