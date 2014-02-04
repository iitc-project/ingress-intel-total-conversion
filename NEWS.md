CHANGES IN 0.8
==============

0.8.1: somehow the build I uploaded was broken. This is a rebuild that should work.

This release contains many small fixes and enhancements. Highlights include the new scoreboard plugin and the MU count display for desktop IITC. There’s also an alpha release of IITC Mobile, for which we need help. Please see below for details.

** **
- Feature: MU count is now displayed in the center of a field in the map (by Fragger).
- Feature: hover over your username in the sidebar. A sign out link should appear (by cmrn).
- Feature: you can quickly select one layer only by long-clicking or ctrl/alt/meta-clicking an entry in the layer chooser. [See Userguide for details](https://github.com/jonatkins/ingress-intel-total-conversion/wiki/Userguide-%28Main-Vanilla-IITC%29#wiki-map).

** **
- Enhancement: hitting the render limit is now much less worse. Before, IITC would simply stop drawing, leaving you with many blank areas. The new method **hides low level portals instead when the render limit is hit**. This way you can view New York or London zoomed out and still be able to use the map properly. Zooming in will show more detail, just like before. Look in the map status at the bottom right to see which portals are currently shown (by Xelio).
- Enhancement: Links in chat now can be copied using the context menu or middle clicked to open in a new tab (by Daniel Cheng).
- Enhancement: more detailed error messages why redeeming failed (by integ3r).
- Enhancement: successfully redeeming things now shows a dialog more akin to the one from the app (by boombuler).
- Enhancement: map should look better on high DPI screens now (“Retina displays“, by richbradshaw).
- Enhancement: your not-yet-sent-message will appear red when writing to the public chat. Hopefully this reduces “posting to the wrong channel” mistakes some people have run into.
- Enhancement: US Post Offices are now shown with their address instead in full and compact tabs.

** **
- Change: Ingress Map style has been updated to reflect Niantic changes.
- Change: files will now be served by Google App Engine instead of GitHub. It’s the same service that Ingress runs on.
- Change: the documentation is now in our wiki: https://github.com/jonatkins/ingress-intel-total-conversion/wiki
- Change: the nightly builds have moved: https://iitc.jonatkins.com/iitc-nightly/
- Change: JavaScript files are now compressed to reduce bandwidth consumption. This makes them unreadable though.
- Change: IITC now uses HTTPS where suitable. Map and portal images are not served via HTTPS, though.
- Change: Google Sat Image layer doesn’t switch to 45° view anymore when zooming in (thanks @yoshimo)
- Change: zooming on Google Layers should be a tad faster now. It animated portal zoom first and then background zoom. It now only animates the background, so it finishes earlier. There doesn’t seem to be a nice way to make both zoom animations line up, though.
- Change: dialogs and tooltips have been redesigned to match the ingress style more closely (by boombuler)

** **
- Bugfix: some portal images were not working properly after the HTTPS switch.
- Bugfix: layer chooser items were too large in Chrome

** **
- Plugin: Highlight Weakened Portals colors have been generally improved. They should now reflect the changes in portal shield handling much better.
- Plugin: Calculate AP Stats now considers missing resonators when calculating the possible AP gain for either team.
- Plugin: Guess Player Level has gained some statistics like average level per faction (by sutepasu).
- Plugin: Player Tracker would pick up bogus portals sometimes, resulting in awkward lines drawn (fix by vita10gy).
- Plugin: Player Tracker now stops after zooming out too far. It was eating CPU while not being helpful.
- Plugin: (new) Show Scale Bar: adds a scale bar to your upper left corner
- Plugin: (new) Scoreboard: shows details and statistics about the currently visible data (by vita10gy). *(I personally recommend this plugin. It makes taunting the other faction much more fun).*
- [the plugins page has been moved to the wiki](https://github.com/jonatkins/ingress-intel-total-conversion/wiki/Plugins)

** **
**Mobile:** a new Android app has been written that brings IITC to your smartphone. It’s not quite there yet – the layer chooser doesn’t work properly, for example. However, we believe it’s okay enough for general use. Note that:
- you need to manually update it
- the layer chooser is broken
- the action bar on top is unfinished
- the app id has changed, so you might end up with two IITC Mobile versions if you are upgrading.
Compared to the old version it has a working back button, supports intents (i.e. detects when you visit the intel map in your browsers and offers to take over), a decent login screen and should boot up much much faster now. [See the IITCM wiki page](https://github.com/jonatkins/ingress-intel-total-conversion/wiki/IITC-Mobile) on details how to install it. [See the roadmap](https://github.com/jonatkins/ingress-intel-total-conversion/wiki/IITC-Mobile-Roadmap) to learn about outstanding issues. Please read on to learn how you can help.

**How I can help:** We need nice icons for the mobile app. The idea is to move everything into the dark bar on the top, but text takes up too much space. The required icons are, in order of importance: Map → Sidebar (Info) → Faction Chat → Public Chat → Full → Compact → Locate → Reload → Print Version → Debug. If you are skilled in icon design or know a friend, maybe you can contribute? The license needs to be something open, like Creative Commons, Public Domain or similar. You can attach the icons to a GitHub ticket or mail them directly to me: breunig@uni-hd.de . If graphic design is not your thing, see [the “How can I help?“ wiki page](https://github.com/jonatkins/ingress-intel-total-conversion/wiki/How-can-I-help%3F) for other useful things.



CHANGES IN 0.7.5 – 0.7.8
------------------------

This is an emergency release to keep IITC working with Niantic’s switch to HTTPS. It appears they will roll it out for everyone soon, so IITC now requires HTTPS for everyone; support for HTTP was dropped to keep things sane. Additionally, the following things were changed from 0.7.1:

- Feature: the “gmaps” link for each portal has been replaced with a “poslinks” one. It offers Google Maps, OpenStreetMap and QR-Codes for easy transfer to your mobile phone (by Merovius).
- Feature: the exact capture time is now shown in a tooltip in the portal details (by j16sdiz)
- Change: most scripts are now included in the UserScript directly. Was the easiest solution to the HTTPS issue.
- Change: minor improvements when render limit is about to be hit.
- Bugfix: map base layer wasn’t always remembered in Chrome
- Bugfix: QR Code rendering broken (in 0.7.5, fixed in 0.7.6)
- Bugfix: Script broken in Firefox sometimes (fixed in 0.7.7)
- Bugfix: some graphics were not available due to GitHub’s limits. Affected plugins: draw tools and player tracker. Need to update IITC and both plugins for the fix to come into effect. (fixed in 0.7.8)


CHANGES IN 0.7 / 0.7.1
----------------------

- 0.7.1 fixes an oversight that prevented some portals from showing (by saithis)

### General
- from now on there will be [nightly builds](https://iitc.jonatkins.com/iitc-nightly/) available. You need to manually update them if you want to stay on nightly. You should be offered to update to the next release version, though. Be sure to [have read the guide on how to report bugs](https://github.com/jonatkins/ingress-intel-total-conversion/blob/gh-pages/HACKING.md#how-do-i-report-bugs) before using a nightly version.
- IITC has [a shiny new user guide now](https://github.com/jonatkins/ingress-intel-total-conversion/blob/gh-pages/USERGUIDE.md). Please point new users to it, it should answer most of their questions and also teach them how to make good bug reports.

### Main Script
- Feature: resonators for the selected portal are now highlighted (by Xelio)
- Feature: resonator charge percentage shown in tooltip (by Xelio)
- Feature: link to Google Maps for each portal (by vita10gy)
- Change: Update wording for redeeming to match vanilla Ingress Intel.
- Change: recommend Tampermonkey for Chrome users. It makes everything easier.
- Change: portal image is now shrinked to fit in, instead of cut off
- Change: use the same jQuery version as the vanilla Intel map.
- Change: replaced native `alert` dialogs with own implementation. Should avoid overflowing or unaligned texts.
- Bugfix: IITC would not display any portals/data for some people. **If you were affected by the “empty map” problem try the new version.**
- Bugfix: selected portal would be unselected on certain conditions
- Bugfix: portals were not clickable below the sidebar
- Bugfix: map wasn’t rendered properly sometimes (only a gray area was shown)
- Bugfix: resonators were duplicated sometimes
- Bugfix: AP calculation was wrong
- Bugfix: Permalink gave the wrong zoom level
- Bugfix: zoom position not saved sometimes

### IITC Plugins

**New Plugins:**
- Render limit increase for people with beefy hardware (by Jon Atkins)
- Render resonators earlier (by Xelio)
- Player tracker
- compute AP stats for current view (by Hollow011)
- show portal address in sidebar (by vita10gy)

**Updated:**
- the guess player level plugin now groups and sorts by level. It also remembers the players now, so zooming in won’t make a player “lower level”.

[You can obtain them in the plugins directory](https://github.com/jonatkins/ingress-intel-total-conversion/tree/gh-pages/plugins#readme).

### IITC Mobile

An alpha quality **developer only** preview of IITC for mobile devices is available. [For more information see the guide in the mobile section](https://github.com/jonatkins/ingress-intel-total-conversion/tree/gh-pages/mobile#readme).


CHANGES IN 0.6 / 0.61
---------------------

0.6 had a broken link to style sheets. Fixed in 0.61.

- **SECURITY**: Chat was vulnerable to XSS attacks. Update as soon as
                possible.
- Feature: [**more plugins**](https://github.com/jonatkins/ingress-intel-total-conversion/tree/gh-pages/plugins#readme)
    - weakened portals: highlights portals with few resonators or ones
                        that are decayed, making it easier to see where
                        to attack or defend
    - draw tools: allow you to draw things on the map, making it easier
                  to plan your next big field
- Feature: chat now has a tab that shows all automated messages, not
           only the last one per user
- Feature: render lines between portals and their resonators
- Change: resonators are only re-rendered on demand, could improve per-
          formance
- Change: AP Gain now also includes gains by deploying resonators
- Change: portal images are not shrinked instead of cut in preview
- Bugfix: styling issues in sidebar (by cmrn)
- Bugfix: “field decayed” and similar messages were not shown
- Bugfix: tooltips have broken alignment sometimes (by saithis)
- Bugfix: chat sometimes didn’t warn if message didn’t went through
- Bugfix: base layer was not saved properly
- Bugfix: avoid zooming to invalid lat/lng, crashing the browser



CHANGES IN 0.5 / 0.51
---------------------

- Feature: draw resonators on map on high zoom levels (by Xelio)
- Feature: show AP if portal is taken down (by Pirozek)
- Feature: collapsible sidebar (by cmrn)
- Feature: fields connected to portal (by phoenixsong6)
- Feature: Permalink feature
- Feature: chat now more copy&paste friendly (by scrool)
- Feature: display max. energy for portal (by scrool)
- Feature: auto-reload if page states your account is not enabled for
           Ingress
- Feature: You are now alerted if some of the resources fail to load
- Change: portal level should now stand out better against more
          backgrounds (by jonatkins)
- Change: increased hack range from 35m to 40m
- Change: Sidebar now semi-transparent, just like chat (by cmrn)
- Change: portals are now sized according to their level (by OshiHidra)
- Change: resonators are now more aligned to their octant (thanks
          Worros for helping confirming the slot-to-octant matching)
- Change: release versions are now put in `dist/`. This should avoid
          update issues in the future.
- Bugfix: entities would be drawn again if they were hidden while using
          the map
- Bugfix: Python 3+ now required for building to fix encoding issues
- Bugfix: portal mod rendering of unclaimed portals wrong
- Bugfix: chat/sidebar arrows have gap or overlap (by mledoze)
- Bugfix: entities invisible after hiding some of them
- Bugfix: some portals in automated view were not clickable
- Bugfix: resonators + nicks were sometimes misaligned
- Bugfix: portal mod boxes sometimes misaligned
- Plugin: guess-player-levels now also shows guessed level in tooltip


Additional fixes in 0.51:
- Bugfix: sidebar not visible in Chrome
- Bugfix: layer chooser not usable if sidebar collapsed
- Bugfix: range link not working



CHANGES IN 0.4
--------------

- Feature: display resonator charge percentage in tooltip (by Xelio)
- Feature: display resonator level in reso bar (by JasonMillward)
- Feature: portals may be filtered by level (using the layer switcher)
- Feature: build script in Python (by epf)
- Feature: plugins
- Change: Portal mods are colored according to their rare-ness (by OshiHidra)
- Change: nick highlight in chat now case-insensitive
- Change: +/- zoom buttons visible by default now
- Bugfix: title bar text broken
- Bugfix: rename cardinal to octant (by mledoze)
- Bugfix: Chat display broken in Opera
- Bugfix: Chat tab completion in Chrome
- Bugfix: wrong timestamps displayed in chat input bar
- Bugfix: don’t autobuild when git meta info changes (by ZauberNerd)
- Bugfix: resistance owned portals had wrong border when viewing the full image


CHANGES IN 0.3
--------------

- Feature: more info for shields in tooltip (by JasonMillward)
- Feature: pretty display for redeemed codes (by integ3r)
- Change: Portal details are now scrollable when height is too small
- Change: explain the meaning of the links display in tooltip
- Bugfix: appear less greedy in Chrome when asking permission (by epf)
- Bugfix: Geosearch broken for non-ASCII chars
- Bugfix: fix spelling of Niantic (by Bananeweizen)
- Bugfix: fix spelling in README (by epf)
- Bugfix: report portal displayed wrong longitude
- Bugfix: timestamps in chat were displaying seconds instead of minutes
- Bugfix: level/ap calculations for level 8 players

If your version appears broken, please update before reporting an issue.
Also clean your cache, this can usually be done with ctrl + shift +
clicking the reload button. If your problem persists, please open a new
issue.
