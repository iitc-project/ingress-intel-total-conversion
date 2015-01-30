<h2>Welcome</h2>

<p>
Welcome to the home page of <abbr title="Ingress Intel Total Conversion">IITC</abbr>.
</p>

<p>
IITC is a browser add-on that modifies the Ingress intel map. It is faster than the standard site, and
offers many more features. It is available for
<a href="?page=desktop">desktop browsers</a>, such as Chrome and Firefox, and as a
<a href="?page=mobile">mobile application</a>.
</p>

<h4>25th January 2015</h4>
<p>
IITC 0.20.1 has been released. This is an important release that changes how the COMM tabs work,
to avoid IITC making excessive requests in some cases, possibly leading to intel bans.
</p>
<p>
This has, unfortunately, required the removal of the full/compact/public COMM tabs, instead IITC has an 'all' tab,
just like the standard intel site. Also, the 'alerts' tab from the standard site has been added to IITC.
See <a href="https://plus.google.com/105383756361375410867/posts/b9ihAer4Fxm">this post</a>
for details about why this was needed.
</p>
<p>
Also, other various tweaks and bugfixes.
</p>
<p>
I'm sure many people will miss the public COMM tab. The best way for this to return is for Niantic to change the COMM tabs of the standard intel site, so it's supported server-side. My suggestion for Niantic is to remove the 'all' tab, instead having:
</p>
<ul>
<li>'system' - the 'captured a portal/deployed a resonator/created a link/etc' messages (internally, the SYSTEM_BROADCAST type) only</li>
<li>'public' - the cross-faction public user chat only - everything in the specificed range, and all public @mentions from any range</li>
<li>'faction' - pretty much as it is now - your faction user chat messages, plus all faction @mentions from any range</li>
<li>'alerts' - as it is now - the 'your portal is under attack' messages (internally, the SYSTEM_NARROWCAST type), plus @mentions at any range</li>
</ul>
<p>
These changes should also be made to the app as well as the intel site.
</p>

<h4>10th January 2015</h4>
<p>
IITC 0.20.0 released. This is a critical update to fix loading of portals/links/fields after a protocol change by Niantic.
</p>
<p>Other changes include</p>
<ul>
<li>Improvements to the regional scoreboard display</li>
<li>Two new default map themes, from CartoDB - one dark, one light</li>
<li>..and other tweaks/bugfixes</li>
</ul>

<h4>21st December 2014</h4>
<p>
IITC 0.19.0 / IITC Mobile 0.19.0 released.
</p>
<p>Changes include</p>
<ul>
<li>Version numbers of IITC Mobile have been changed to keep in sync with the main IITC desktop scripts</li>
<li>Support for regional scores added</li>
<li>draw-tools: update the copy+paste import/export process to support links as stock intel URL formats, for exchanging plans with non-IITC users.</li>
<li>IITC Mobile: sometimes the app wouldn't detect the screen size properly on startup, requiring a reload/screen rotation - fixed<./li>
<li>Fix URL parameter parsing to handle commas encoded as %3C</li>
<li>New plugin done-links: a companion to cross-links - it highlights any drawn links that already exist.</li>
<li>Sync plugin: a couple of bugfixes - it may work better now - not sure if it's 100%</li>
<li>..and other tweaks/bugfixes, as always</li>
</ul>

<a class="btn btn-default btn-sm" href="?page=news">Older news</a>
