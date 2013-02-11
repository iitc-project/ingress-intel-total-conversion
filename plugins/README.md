Plugins
=======

Install
-------
Plugins are installed the same way the total conversion script is. Please see there for specific instructions for your browser.


Available Plugins
-----------------

- [**Guess Player Level**](https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/plugins/guess-player-levels.user.js) looks for the highest placed resonator per player in the current view to guess the player level.


Hacking
-------

Plugins may be developed in the same way as the total conversion script. Plugins may provide features tailored to specific needs and are allowed to change things as they see fit. You can provide them separately oder submit a pull request to have them managed in this repository. There are currently no hooks that allow integration with the main script, but I will add those if the need arises. Simply open a bug report.

You can use the guess player level script as an example to get you started. Just update the names and the part between `// PLUGIN START` and  `// PLUGIN END` and you should be able to develop your plugin. The other code ensures your plugin is executed after the main script.

If you happen the write general purpose functions for your plugin, consider adding them to the main script instead. For example, if you write a `getResoCountFromPortal(details)` function it may be very well added to `code/portal_info.js`.


Available Hooks
---------------

Available hooks are documented in the code. Please refer to the [boilerplate explanation in `hooks.js`](https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/code/hooks.js) to see which are available and how to listen for them. If you need additional hooks, open bug reports (preferably with patches attached).
