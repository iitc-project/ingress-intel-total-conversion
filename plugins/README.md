Plugins
=======

Install
-------
Plugins are installed the same way the total conversion script is. Please see there for specific instructions for your browser.


Available Plugins
-----------------

- [**Compute AP Stats**](https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/compute-ap-stats.user.js) Shows the potential AP an agent could obtain by destroying and rebuilding all the portals in the current zoom area.
- [**Draw Tools**](https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/draw-tools.user.js) allows to draw circles and lines on the map to aid you with planning your next big field. [View screenshot](http://breunigs.github.com/ingress-intel-total-conversion/screenshots/plugin_draw_tools.png)
- [**Guess Player Level**](https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/guess-player-levels.user.js) looks for the highest placed resonator per player in the current view to guess the player level.
- [**Highlight Weakened Portals**](https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/show-portal-weakness.user.js) fill portals with red to indicate portal's state of disrepair. The brighter the color the more attention needed (recharge, shields, resonators). A dashed portal means a resonator is missing.   Red, needs energy and shields. Orange, only needs energy (either recharge or resonators). Yellow, only needs shields.
- [**Max-Links**]((https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/max-links.user.js) Calculates how to link the portals to create the maximum number of fields. [View screenshot](http://breunigs.github.com/ingress-intel-total-conversion/screenshots/plugin_max_links.png)
- [**Player Tracker**](https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/player-tracker.user.js) Draws trails for user actions in the last hour. At the last known location there’s a tooltip that shows the data in a table. [View screenshot](http://breunigs.github.com/ingress-intel-total-conversion/screenshots/plugin_player_tracker.png).
- [**Render Limit Increase**](https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/render-limit-increase.user.js) increases render limits. Good for high density areas (e.g. London, UK) and faster PCs.
- [**Resonator Display Zoom Level Decrease**](https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/resonator-display-zoom-level-decrease.user.js) Resonator start displaying earlier.
- [**Show Portal Address**](https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/show-address.user.js) Shows portal address in the side panel.

### available only with the development version

[Read HACKING.md file](https://github.com/breunigs/ingress-intel-total-conversion/blob/gh-pages/HACKING.md#hacking) to learn how to build the development version yourself. If **and only if** [you have read how to report bugs](https://github.com/breunigs/ingress-intel-total-conversion/blob/gh-pages/HACKING.md#how-do-i-report-bugs), you may beta test the [nightly](https://www.dropbox.com/sh/lt9p0s40kt3cs6m/3xzpyiVBnF) version.





Hacking
-------

Plugins may be developed in the same way as the total conversion script. Plugins may provide features tailored to specific needs and are allowed to change things as they see fit. You can provide them separately or submit a pull request to have them managed in this repository.
If you think a hook in the main script is required, simply open a bug report.

You can use the guess player level script as an example to get you started. Just update the names and the part between `// PLUGIN START` and  `// PLUGIN END` and you should be able to develop your plugin. The other code ensures your plugin is executed after the main script. [Read the common HACKING.md file for general tips and requirements](https://github.com/breunigs/ingress-intel-total-conversion/blob/gh-pages/HACKING.md#hacking).

If you happen the write general purpose functions for your plugin, consider adding them to the main script instead. For example, if you write a `getResoCountFromPortal(details)` function it may be very well added to `code/portal_info.js`.

External Dependencies
---------------------

If you have external dependencies put them into `external/` and add a version number to their filename. I will put them in `dist/` once required. Don’t forget to add a note about author and license in main `README.md`.


Available Hooks
---------------

Available hooks are documented in the code. Please refer to the [boilerplate explanation in `hooks.js`](https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/code/hooks.js) to see which are available and how to listen for them. If you need additional hooks, open bug reports (preferably with patches attached).
