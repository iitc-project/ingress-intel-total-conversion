*NOTE: this is a work in progress and not yet finished. *


ingress.com/intel total conversion
==================================

It’s annoying to extend the intel page with new features because the minified code makes it hard to grasp what’s going on. Also, one has to play catch up each time Ninantic put up a new version because all the variables might get new names.

So instead, here’s a userscript that starts from scratch. 


Install
-------

Currently only works in Firefox with [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) or [Scriptish](https://addons.mozilla.org/en-US/firefox/addon/scriptish/).

If one of these addons is installed, clicking this should work:


[**INSTALL**](https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/total-conversion-build.user.js)



Contributing
------------

Please do!

(Obviously, Resistance folks must send in complete patches while Enlightenment gals and guys may just open feature request ☺)


Hacking
-------

Execute `./build.js` to effectively concatenate `main.js` with all the files in `code/`. It generates the user script which may be installed into your browser.

`style.css` contains most styles required for the user-script. The extra ones can be found in `code/boot.js#window.setupStyles`. Only CSS rules that depend on config variables should be defined there.

`leaflet_google.js` contains some code to display Google Maps imagery with Leaflet, which is a slightly modified version [of this gist](https://gist.github.com/4504864). I tried to track down the original author, but failed.


Attribution & License
---------------------

This project is licensed under the permissive ISC license. Parts imported from other projects remain under their respective licenses:

- [load.js by Chris O'Hara; MIT](https://github.com/chriso/load.js)
- [leaflet.js; custom license (but appears free)](http://leafletjs.com/)
- `leaflet_google.js`; unknown
- StackOverflow-CopyPasta is attributed in the source; [CC-Wiki](https://creativecommons.org/licenses/by-sa/3.0/)
- all Ingress/Ninantic related stuff obviously remains non-free and is still copyrighted by Ninantic/Google
