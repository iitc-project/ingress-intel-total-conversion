Userguide
=========

table of contents:
- [Installation](#installation)
- [General Usage](#general-usage)
- [Chat](#chat)
- [Map Display](#map-display)
- [Map Status / Updates](#map-status--updates)
- [Sidebar](#sidebar)
- [Bugs and help requests](#reporting-bugs--i-need-more-help)


Installation
------------

[See main README.md file for browser specific instructions](https://github.com/breunigs/ingress-intel-total-conversion#install).


General Usage
-------------

- many things have more information in tooltips. Let your cursor rest over stuff to show the tooltip. *Hint:* your cursor changes into a question mark / help cursor if there’s a tooltip available.
- single left click on portals to show details.
- double left click on portals to zoom in to them.


Chat
----

The chat is split up into several categories. It usually only shows messages for the current map view. It may lag behind if Niantic’s servers are slow. It also has a minimum radius of six km. This means that even if you zoom in very much, it will still show messages from a larger area around you.

**The chat categories are:**
- full: shows all automated messages *(23:57	\<apj\>	destroyed an L3 Resonator on Two Spikes)*
- compact: shows only the latest automated message per user
- public: shows user generated public messages (both Enlightened and Resistance can read it)
- faction: shows messages for own faction (e.g. only Resistance can read Resistance messages)

**Posting messages:**
- You can post in the faction and public categories only.
- Your message will be tagged with the coordinates in the center of the map.
- Your zoom level does not matter. Zooming out will not show your messages to more users.


Map Display
-----------

You can customize many aspects of how the map is rendered in the layer chooser.

**Layer Chooser:**
The layer chooser is available from the icon in the top right corner, left of the sidebar. The top entries are background maps and you can only have one of them active at a time. The entries on the bottom can be displayed in any combination you like. *Hint:* (NIGHLTY ONLY) Modifier-click an entry to quickly hide all other layers. The modifier may be either of these: shift, ctrl, alt, meta. Modifier-click the entry again to select all layers.

**Background / Street Map / Base Layer:**
All these refer to the same thing. The base layer is stored across sessions. The default one uses OpenStreetMap data with a style that resembles the default Ingress one. There are other styles available.

The layers from Google Maps are available as well. Google requires that their maps are only displayed with their tools. Therefore they cannot be as tightly integrated as the OpenStreetMap ones. That’s the reason why they lag behind when zooming or dragging the map.

**Portals:**
You can filter portals by level. Select the ones you want to see in the layer chooser. If lower level portals are striked-through, this means you need to zoom in further to see them. This is a server limitation, not one in IITC. Your settings are discarded after a reload.

**Resonators:**
Resonators are shown at their actual positions if you zoom in close enough. They become lighter the less energy they have left. They are color coded to show their level.

**Fields / Links:**
They are handled the same way portals are, see above.

**Other:**
When you select a portal its outer ring becomes red. There’s also a small yellow circle around it which depicts the hack range. You need to be in hack range to hack the portal or upgrade its resonators or mods.

If you are zoomed out quite a bit, there’s a larger red circle. This is the link range. Only portals within this link range can be linked while standing at the selected portal. [Click the range in the sidebar to zoom to link range for the selected portal](#random-details).

**Note** that plugins may also add themselves to the layer chooser.


Map Status / Updates
--------------------

It shows if there are operations currently pending. This includes chat updates as well as map data requests. Updates happen every 45s to 90s, depending on how far zoomed in you are. Zoom in closer for faster updates.

It also shows which portals are being loaded/shown. Zoom in to see lower level portals. This is a limit of the server and not IITC. Portals levels that cannot be shown are also striked through in the layer chooser.

**Failures:** If a data request failed, it is retried once. Only if the retry fails as well, a “failure” message is shown in the map status. You can either wait for the next automatic update or move the map a little. Also try to zoom in to request less data, which makes it less likely that the servers fail. The failure counter is reset on the next auto update or if you move the map.

**Render Limit:** The script tries to stay responsive. If too much data needs to be rendered, this cannot be guaranteed. Instead it will simply stop drawing portals/links/fields and show “render limit” in the map status. Zoom in to solve this.



Sidebar
-------

The sidebar is mainly used to show game stats and portal details. However, it also allows you to perform certain actions.

### General usage:
- single click a portal to show details about it in the sidebar.
- the portal information is updated automatically, as long as the selected portal is kept in view and you do not zoom out too much.
- the sidebar may be collapsed. Click the triangle button that stands out at the left hand side.
- the sidebar **can be scrolled** if your screen is too small. Use your scroll wheel.
- almost everything has tooltips. See [General usage](#general-usage) above.

### Details:
Starting from the top, the sidebar shows this information:

#### logged in user, global MU, search
- Details about you, the logged in user. This is only updated if you reload the page. This is a limitation of Ingress, not IITC.
  - it shows your current level followed by your nick
  - to the right, it shows to percentages. The upper one, e.g. “XM: 37%” tells you how much your XM bar is filled. The lower one, e.g. “level: 37%“ tells you that you have gathered 37% of the AP required for the next level. It shows “max level” if you have reached max level.
  - the tooltip mainly shows you absolute numbers instead of percentages. It also shows how many invites you have.
- The next bar is a visual representation of global MindUnits (MU) per faction. It is updated every now and then. The tooltip shows the absolute MU count per faction.
- Search Location: You can search for continents, countries, cities or street addresses. If there is at least one result your are taken to the most likely immediately. There is no feedback if the entered location was not found. Rule of thumb: if it takes longer than three seconds, try again.  [Read about supported formats in the user guide for this service](https://wiki.openstreetmap.org/wiki/Nominatim).


#### Portal details.
- Portal name, may be abbreviated by the server if it’s too long.
- Portal image. Can be clicked to show the full image. The tooltip shows street address and postal code for the portal. It may also show attribution data for the portal image, if available.
- Portal level is located in the upper right corner and may overlay the image.

- Portal mods are shown in right below the portal image. An empty box means that this slot is free and no mod is installed. Otherwise the name of the installed mod is displayed. The color depends on the rare-ness of the mod. Each slot has its own tooltip that shows mod specific details and who installed it.

##### “random details”
“Random Details” are displayed in four columns. The outer ones show the data while the inner ones are the titles.

- owner: who deployed the first resonator after it has been neutral/unclaimed.
- since: when was the first resonator deployed after it has been neutral/unclaimed. The reasonators decay every 24hrs from capture. Move the cursor over it to show the full date time.
- range: shows how far links made from this portal can be. Click on the value to zoom out to link range. The red circle shows how far links may reach.
- energy: shows current and maximum energy if fully charged. The tooltip contains the exact numbers.
- links: shows incoming and outgoing links. The tooltip explains the icons.
- reso dist: shows the average distance the resonators have to the portal.
- fields: how many fields are connected to this portal
- AP Gain: estimate of how many AP you gain if you take down this portal and deploy resonators of your own faction. Tooltip breaks this number down into parts.

##### Resonators

The nickname to the left and right show who deployed this resonator. The bars in the middle indicate the charge of each resonator. The color depends on the level, which is also shown in the bar. The tooltip repeats some of that data along with other details. The top left resonator is the north one, top right is north east and so on. They are roughly ordered like they appear on a normal map:
```
   N   NE
  NW   E
   W   SE
  SW   S
```

#### portal related links

- Portal link: use it show others a portal. IITC users will automatically zoomed to the location and shown portal details as soon as they’re available. Vanilla map users will only be zoomed to location.
- Report issue: redirects you to Niantic report issue page. Allows you to copy all required information before going there.
- poslinks: Shows you a QR-Code containing the geolocation of the portal as well as a link for Google Maps and Openstreetmap. If your QR-Code App supports GEO-codes (most do) you can scan it and pass the portal location directly to a routing-app.

#### Redeeming, General Links and functions
- Redeem code: allows you to redeem codes to receive goodies. If you copied them from the Internet, they are probably invalid already.
- Toolbox: plugins may add links here. The default ones are:
  - permalink. use it to show your current map view to others. Does not select a portal. Works with the normal intel map, too.
  - IITC’s page. Visit our homepage. Be in awe. Drool.


Reporting Bugs / I need more help
---------------------------------

[Please read the “how do I report bugs” here](https://github.com/breunigs/ingress-intel-total-conversion/blob/gh-pages/HACKING.md#how-do-i-report-bugs).
