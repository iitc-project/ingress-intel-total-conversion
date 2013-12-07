<h2>News</h2>

<h4>6th December 2013</h3>
<p>
Niantic have just released a minor update to the standard intel site. Good news - recent IITC changes have made it
successfully detect the protocol changes in most cases, so no update is needed. You may need to reload the page,
and for IITC Mobile you may need to change a cache setting. See 
<a href="https://plus.google.com/105383756361375410867/posts/1yTb59HGDm3">this G+ post</a> for more details.
</p>

<h4>2nd December 2013</h3>
<p>
IITC 0.16.0 and IITC Mobile 0.10.0 have been released. This update is required to work with the latest changes to
the standard intel site. This update took a fair amount of work due to major changes
in the network protocol used behind the standard intel website, hence the longer than usual delay for the update.
</p>
<p>
As well as IITC itself, nearly every single plugin broke in some way due to these changes. Due to the amount of work
needed to get everything possible working again, some plugins have been disabled for now. You can see the list of these
disabled plugins in the download list - they're in the 'Deleted' category with a description of 'PLUGIN CURRENTLY UNAVAILABLE'.
</p>
<p>
Shortly after the Niantic changes that broke IITC, there were reports of IITC users being banned. This seemed strange at
first, as IITC was not even functioning at this time, so why would people be using it and getting banned. The conclusion
that was reached was that a few people who tried to use the broken IITC Mobile app triggered either a bug in IITC that
caused excessive requests, or triggered some kind of alert in the intel servers. Changes have been made to IITC now
so this unlikely to be an issue again.
</p>

<h4>27th November 2013</h4>
<p>
IITC and IITC Mobile are currently broken, due to changes made to the standard intel website. This is a major change in how
portal details are sent, with most of the extra data that the standard site didn't use being removed.
</p>
<p>
This is not something simple to fix, and will take some time. Also, it severely cripples what IITC can do, as using this
extra data, not displayed by the standard site, was it' big feature.
</p>
<p>
We will look into what can be done to get it working again, but it will take some time. Many plugins won't be practical 
as the data will not be available.
</p>
<p>
More details, and discussion, available in the
<a href="https://plus.google.com/105383756361375410867/posts/E65qngRjR2T">Google+ post</a>.
</p>
<p>
<b>Update</b> I've created a 'dummy' version of the desktop plugin that will, for now, disable IITC if you leave it installed.
This is shown as version 0.15.99. When a fixed build is released, it will be 0.16.something and will update and start working.
Test versions remain, but broken. Please join the Google+ Community where announcements will be made.
</p>

<h4>11th November 2013</h4>
<p>
IITC 0.15.0 and IITC Mobile 0.9 have just been released. This update fixes things to work with the latest changes
to the standard intel site. Also
<ul>
<li>Support for Jarvis shards (and other future artifacts)</li>
<li>New base map plugins - for <a href="http://maps.stamen.com/">maps.stamen.com/</a> and Bing maps.</li>
</ul>
</p>

<h4>7th November 2013</h4>
<p>
IITC 0.14.6 and IITC Mobile 0.7.7.2 released. Another change needed to match a minor update to the standard intel site.
</p>

<h4>6th November 2013</h4>
<p>
IITC 0.14.5 and IITC Mobile 0.7.7.1 have been released. This contains a fix to work with the latest intel site updates.
Other than this, it is identical to the 0.14.4/0.7.7 release.
</p>

<h4>29th October 2013</h4>
<p>
IITC 0.14.4 and IITC Mobile 0.7.7 have just been released. A critical update required to work with changes made to the
standard intel site. Changes include
<ul>
<li>Fix to geodesic circle drawing. They were not correctly distorted, leading to incorrect link ranges drawn on the map.</li>
<li>Bookmarks plugin: add layer and highlighter to indicate bookmarked portals</li>
<li>Player tracker plugin: markers fade for older activity, and separate layers for each faction</li>
<li>The 'About IITC' dialog now lists which plugins are installed. This may not work correctly for 3rd party plugins at this time</li>
<li>Mobile:
 <ul>
 <li>Custom fullscreen preferences</li>
 <li>Install to SD Card</li>
 <li>Cache move to SD card option (hence the new permissions)</li>
 </ul>
</li>
<li>... and, as always, various bugfixes and improvements.</li>
</ul>
</p>
<p>
<b>3RD PARTY PLUGIN AUTHORS</b>: The plugin wrapper code has been modified to pass through the additional version
information. While existing plugins should continue to work, I highly recommend updating the wrapper code in your
scripts to match.
</p>

<h4>16th October 2013</h4>
<p>
IITC 0.14.3 and IITC Mobile 0.7.4 have just been released. This is a critical update required to work with the latest
changes Niantic have made to the standard intel site. Additionally, the draw-tools plugin now snaps points to portals
when creating lines/polygons/markers (was actually in 0.14.2 release), a bugfix relating to IITC not realising who 
'you' are, causing some highlighters to break, and a handful of other tweaks/bugfixes.
</p>

<h4>1st October 2013</h4>
<p>
IITC 0.14.2 and IITC Mobile 0.7.1 have been released. This is a critical update required to work with changes made
to the standard intel site. Additionally, a major update to the mobile app interface has been made, and a handful
of tweaks and bugfixes to IITC and a few plugins.
</p>
<p>
The standard intel site now includes an 'alerts' chat tab. This will be coming to IITC in the future, but it's
better to get this working version released without it than hold things up just for that.
</p>

<h4>22nd September 2013</h4>
<p>
<b>Update</b>: IITC Mobile 0.6.5 replaces 0.6.4. This fixes a crash on entering plugin preferences on some tablets.
</p>
<p>
IITC 0.14.1 and IITC Mobile 0.6.4 have been released. Changes in this version include:
<ul>
<li>Better performance when a very large number of portals are within view (country/continent level)</li>
<li>Add layer chooser options to hide resistance/enlightened portals/links/fields</li>
<li>Chat tab now remembers which was active when reloading IITC</li>
<li>Fix some shorter links not showing on the map</li>
<li>Add details of hack information (number/cooldown time, taking account of mods) and mitigation (from shields and links)
to the portal information panel</li>
<li>Mobile
 <ul>
 <li>increase the size of various links on the info page to make them easier to tap</li>
 <li>move the highlight selection dropdown to the native android app bar at the top</li>
 </ul></li>
</ul>
And plugins:
<ul>
<li>Major update to bookmarks-by-zaso, including sync support</li>
<li>New features added to the resonators plugin</li>
<li>max-links plugin - start of rename to 'tidy links' - as this is a better description of what it does</li>
<li>show-linked-portals - indicate which are incoming/outgoing links in the tooltip</li>
<li>New Plugins
 <ul>
 <li>show-link-direction, to indicate visually which portal a link was created from</li>
 <li>highlighter for portal mitigation - to show strength of defence from shields and links at a glance</li>
 </ul></li>
</ul>
And, as always, numerous other bug fixes, tweaks and improvements.
</p>

<h4>2nd September 2013</h4>
<p>
IITC 0.14.0, and IITC Mobile 0.5.6, have just been released. This is (yet another) change required to work with
the latest changes to the standard intel website.
</p>
<p>
Also, as part of some long-term improvements, the data loading and portal rendering code has been completely rewritten.
This should ensure much more reliable loading of portal data, and faster rendering when lots of portals are shown.
However, this code is new, and may have bugs. Some known issues are:
<ul>
<li>Resonators are not displayed when zoomed in.</li>
<li>Some smaller links/fields are not displayed. Often this is due to changes in the stock map (it doesn't show these
links/fields either), but I think there are cases where IITC is getting it wrong.</li>
</ul>
However, as the current IITC release was broken I think it's better to release this build now rather than wait longer.
</p>

<h4>27th August 2013</h4>
<p>
Yet another critical IITC update, 0.13.4, and IITC Mobile 0.5.5, have been released. A few things in this build
<ul>
<li>Scoreboard plugin is broken - fix coming later</li>
<li>No MU numbers shown in fields - the server no longer returns the data</li>
<li>Other plugins may be broken too - limited testing has been done</li>
</ul>
Note: Briefly IITC Mobile 0.5.4.3 was available, but broken.
</p>

<h4>16th August 2013</h4>
<p>
IITC 0.13.3 and IITC Mobile 0.5.4.2 have been released. This is another critical update required to work
with another change Niantic have made to the standard intel site.
</p>

<h4>14th August 2013</h4>
<p>
IITC 0.13.2 and IITC Mobile 0.5.4.1 have been released. This is a critical release required to work with
changes Niantic have made to the standard intel site.
The ap-list and show-linked-portals plugins also needed minor changes related to this.
</p>

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
IITC Mobile 0.4.0 is also released. This has also had major work. Along with the above, it includes a
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
