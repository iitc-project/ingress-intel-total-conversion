<h2>News</h2>

<h4>31st May 2014</h4>
<p>
IITC 0.17.1 and IITC Mobile 0.11.1 have just been released.
</p>
<p>
Another critical update, due to more changes by Niantic. Hopefully the last one for a while - all recent breaking changes
were caused by Niantic removing the obsfucation of data requests one bit at a time - the final piece has been removed now.
</p>
<p>
<b>Lost bookmarks? Drawn items?</b> In the latest Niantic site update they changed the server to always go to the
<code>http<b>s</b></code> version. It is possible to copy your data to the new location - further details
<a href="https://plus.google.com/105383756361375410867/posts/749UX2nQcaP">here</a>.
</p>
<p>
Additionally, a few bugs were fixed since the previous release, and now most map layers support zooming in closer than before.
<b>Note</b>: There can be issues on Chrome when zooming beyond zoom level 18 (the previous default maximum for several maps).
Just zoom out again if the zoom/layer controls, or the COMM panel, disappear.
</p>

<h4>24th May 2014</h4>
<p>
And another IITC update, IITC 0.16.12 and IITC Mobile 0.11.0 have just been released, to fix things after the most recent
update to the standard intel site.
</p>
<p>
Note that Niantich have trimmed down the data a bit more, removing things not used by the standard intel site. In particular,
we no longer know the resonator deployment distance, the portal address, and the portal description.
Due to this, the 'show-address' and 'draw-resonators' plugins are no longer available. 
</p>

<h4>17th May 2014</h4>
<p>
Yet another cricical IITC Update - IITC 0.16.11 and IITC Mobile 0.10.11 have just been released. This fixes the munge error at startup.
</p>
<p>
<b>Note</b>: IITC 0.16.10 and IITC Mobile 0.10.10 were available for a few hours. This had a problem loading the portal details.
</p>

<h4>10th May 2014</h4>
<p>
Another critical IITC update - IITC 0.16.9 and IITC Mobile 0.10.9 have just been released. This fixes the munge error at startup.
</p>
<p>
Also, the bookmarks plugin received an update. This has had minimal testing, so please report any issues.
</p>

<h4>6th May 2014</h4>
<p>
IITC 0.16.8 and IITC Mobile 0.10.8 have just been released. This is a critical update that is needed for IITC to correctly
load the map data.
</p>

<h4>29th April 2014</h4>
<p>
IITC 0.16.7 and IITC Mobile 0.10.7 have been released, to fix things to work with the latest Niantic changes.
</p>
<p>
There have also been a few tweaks to improve performance, and an optional alternative rendering mode
that might give a good performance boost in some cases when there's lots of portals on screen.
</p>

<h4>14th March 2014</h4>
<p>
IITC 0.16.6 and IITC Mobile 0.10.6 have just been released. This is a critical update required to successfully load
portals when zoomed in (L3+ or closer) to the map. Changes include:
</p>
<ul>
<li>debug tiles fade for completed tiles</li>
<li>warning in sidebar when standard layers are turned off</li>
<li>player level: fixed AP values for L2/L3</li>
<li>Plugins:
<ul>
<li>portal-counts: percentage in pie chart</li>
<li>guess-player-levels: guess level based on portal attacks (attack range as calculated from log)</li>
</ul></li>
<li>Mobile:
<ul>
<li>send screenshot from menu</li>
<li>fixed sharing interface (caused crash on some devices)</li>
<li>show loading indicator while log is being loaded</li>
<li>configurable menu</li>
</ul></li>
</ul>

<h4>22nd February 2014</h4>
<p>
IITC 0.16.5 and IITC Mobile 0.10.5 have just been released. This version is required to work with a change made to the
standard intel site. Also, the following changes have been made:
</p>
<ul>
<li>The new Artifacts are now supported</li>
<li>Bookmarks plugin updated</li>
<li>Draw tools plugin: markers updated to also support colours</li>
</ul>

<h4>6th February 2014</h4>
<p>
IITC 0.16.4 and IITC Mobile 0.10.4 have just been released. This version is required to fix a bug with showing portal details
due to a change made by Niantic to the intel site protocol. Also, the following changes have been made:
</p>
<ul>
<li>Portal markers are now reduced in size when you zoom out, reducing clutter when viewing large areas of the map</li>
<li>Blocked a 3rd party plugin, arc, from running - it had spyware features hidden within it
(<a href="https://plus.google.com/105383756361375410867/posts/4b2EjP3Du42">details here</a>).</li>
<li>Plugins
 <ul>
 <li>add-kml: support for opening files on mobile added</li>
 <li>regions: new plugin to draw the scoreboard regions on the map. <i>No support for showing scores - this needs Niantic to add it to the standard intel site first</i></li>
 <li>score-cycle-times: new plugin to show the times of the scoreboard cycles</li>
 <li>draw-tools: added basic import/export (via copy+paste), and colour choosing options (click on "DrawTools Opt" in the sidebar)</li>
 <li>compute-ap-stats and portal-names: changed code to reduce the performance impact when a large number of portals are shown</li>
 </ul>
</li>
<li>Mobile:
 <ul>
 <li>NFC support for sharing map view/selected portal - app permissions updated for this</li>
 </ul>
</li>
<li>.. plus various minor bugfixes and improvements</li>
</ul>

<h4>13th January 2014</h4>
<p>
A new IITC release, 0.16.2 and IITC Mobile 0.10.2 have been released. These are needed to work with a change to the
standard intel site.
</p>
<p>
Additionally, the 'Compute AP Statistics' plugin has been brought back, the 'blank map' base layer has a new black option
to go with the white, and the 'Yandex' base map has had some bug fixes. Also, IITC Mobile features some changes to
the 'show my location' feature. You may need to turn this option on again for it to work.
</p>
<p>
<b>Update 14th January 2014</b>: An updated IITC Mobile, 0.10.3, has been released, to fix a crash issue seen by some.
Also, a minor update was made to the main IITC script which changes the order the data is loaded, to match a change made to
the standard intel site.
</p>


<h4>21st December 2013</h4>
<p>
Just in time for the holidays, another IITC update. IITC 0.16.1 and IITC Mobile 0.10.1 have just been released.
Changes include
</p>
<ul>
<li>Portals list plugin returns - but less data than before due to the Niantic backend changes</li>
<li>Resonators plugin returns - but only shows the selected portal</li>
<li>Mobile:
 <ul>
 <li>Some plugins moved to panes from the left-swipe menu: portals list, portal counts</li>
 <li>Immersive fullscreen mode on Android 4.4 KitKat</li>
 <li>Sort apps in share activity - most used at the top</li>
 <li>Fix links sometimes being badly drawn on mobile</li>
 </ul>
</li>
<li>.. and, as always, other various bug fixes, improvements, etc</li>
</ul>

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
