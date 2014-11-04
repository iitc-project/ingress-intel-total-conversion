USER DOCUMENTATION MOVED!
=========================

[The plugins list has been moved to the wiki. Please see there!](https://github.com/jonatkins/ingress-intel-total-conversion/wiki/Plugins)

What follows is developer documentation only.




Hacking
-------

Plugins may be developed in the same way as the total conversion script. Plugins may provide features tailored to specific needs and are allowed to change things as they see fit. You can provide them separately or submit a pull request to have them managed in this repository.
If you think a hook in the main script is required, simply open a bug report.

You can use the guess player level script as an example to get you started. Just update the names and the part between `// PLUGIN START` and  `// PLUGIN END` and you should be able to develop your plugin. The other code ensures your plugin is executed after the main script. [Read the common HACKING.md file for general tips and requirements](https://github.com/jonatkins/ingress-intel-total-conversion/blob/master/HACKING.md#hacking).

If you happen the write general purpose functions for your plugin, consider adding them to the main script instead. For example, if you write a `getResoCountFromPortal(details)` function it may be very well added to `code/portal_info.js`.

External Dependencies
---------------------

If you have external dependencies put them into `external/` and add a version number to their filename. I will put them in `dist/` once required. Don’t forget to add a note about author and license in main `README.md`.


Available Hooks
---------------

Available hooks are documented in the code. Please refer to the [boilerplate explanation in `hooks.js`](https://raw.github.com/jonatkins/ingress-intel-total-conversion/master/code/hooks.js) to see which are available and how to listen for them. If you need additional hooks, open bug reports (preferably with patches attached).
