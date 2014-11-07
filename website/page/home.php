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

<h3>Latest news</h3>

<h4>24th October 2014</h4>
<p>
IITC 0.18.2 / IITC Mobile 0.11.8 released.
</p>
<p>
While previous release continue to work in most situations, this IITC update is highly recommended.
After seeing recent changes to the stock intel map I've had a rethink about how IITC handles loading and
optimising requests, particularly when it comes to viewing country-wide regions and above. It made me realise that
fewer requests sent may not actually mean it's friendlier to the servers, so IITC has been updated to match
the standard intel site in the number of, and batching, of requests.
</p>
<p>
Fixes
</p>
<ul>
<li>Game score loads correctly, rather than showing 'NaN'</li>
<li>portals load correctly for large-scale views (US/Europe sized regions)</li>
<li>draw-tools plugin: new feature in the DrawTools Opt dialog - 'Snap to portal'. This moves line/polygon/markers to the exact center of the closest portal. Best used when zoomed in close to the map, to ensure the right portal is the target.</li>
<li>show-less-portals-zoomed-out: this plugin has been brought out of retirement, and updated to work in a more sensible way. It now works as if you were using the portal level filter on the standard site, rather than changing the types of requests. If the min portal was L4+ or L5+, it becomes L6+, L6+ becomes L7+, and L7+ becomes L8. I recommend trying this plugin when viewing large areas of the map - fewer portals loaded, but no changes in detail when it comes to links and fields. This plugin can be found in the 'Tweaks' category.</li>
</ul>
<p>
Plus, as always, other minor tweaks and bugfixes.
</p>

<a class="btn btn-default btn-sm" href="?page=news">Older news</a>
