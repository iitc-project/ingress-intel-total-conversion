**WEBSITE LOOKS BROKEN?** Update the script. On the upside you may scroll the portal details if there’s not enough screen space.



ingress.com/intel total conversion
==================================

It’s annoying to extend the intel page with new features because the minified code makes it hard to grasp what’s going on. Also, one has to play catch up each time Niantic put up a new version because all the variables might get new names.

So instead, here’s a userscript that starts from scratch:


[![Screenshot of the total conversion in Johannesburg](http://breunigs.github.com/ingress-intel-total-conversion/screen_small.png)](http://breunigs.github.com/ingress-intel-total-conversion/screen.png)

(click to zoom)

Features
--------

- feels faster. (Likely because [leaflet](http://leafletjs.com/) is faster, although there are some other tricks.)
- full view of portal images
- better chat
  - separated automated/public/faction
  - only showing the last automated message for each user. Makes a great “where are they now” guide.
  - nick tab completion
  - clickable links
- automatic idle resume
- portal details get updated while portal is visible on map
- links to portals made easy (partly works with the vanilla map, too)
- info porn. Everything with the help cursor has more info hidden in a tooltip.
- may toggle portals/links/fields
- hack range (yellow circle) and link range (large red circle) for portals. Click on the range link in the sidebar to zoom to link range.
- double clicking a portal zooms in and focuses it
- display of XM and AP rewards for redeemed passcodes


Install
-------

Current version is 0.51. See [NEWS.md](https://github.com/breunigs/ingress-intel-total-conversion/blob/gh-pages/NEWS.md) for details.

[**INSTALL**](https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/dist/total-conversion-build.user.js)


**Firefox:** Install [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) or [Scriptish](https://addons.mozilla.org/en-US/firefox/addon/scriptish/). Click install link. Install. Reload page.

**Chrome:** The user script works in vanilla Chrome.

1. Click install link and ignore the warning.
2. The file should be downloaded and appear in your download bar.
3. Goto `Menu Button` → `Tools` → `Extensions`.
4. Drag and drop the download over the window and Chrome will offer you to install the script.
5. Reload page.

*Note:* if Chrome only shows you the text, but does not offer an install dialog, make sure the file ends in `.user.js`. If it’s something like `.user(2).js` it won’t work.

**Opera:** Download the script and put it into your user_js folder (that’s `~/.opera/user_js` on Unix). If you can’t find it [see Opera’s docs](http://www.opera.com/docs/userjs/using/#writingscripts). After placing it there, reload the page.

**NoScript:** It doesn’t work with NoScript, unless you uncheck `NoScript` → `Embeddings` → `Block every object coming from a site makred as untrusted`. This is required, even if NoScript is set to allow scripts globally. No embedded objects are being loaded. I tried reporting the bug, but only a forum that wouldn’t let me register was available. There’s a stripped down example in `noscript-sucks.html`. If you can manage to report the bug, be my guest.



[**INSTALL**](https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/dist/total-conversion-build.user.js)


Contributing
------------

Please do!

(Obviously, Resistance folks must send in complete patches while Enlightenment gals and guys may just open feature request ☺)


Contributors
------------

[Bananeweizen](https://github.com/Bananeweizen),
[cmrn](https://github.com/cmrn),
[epf](https://github.com/epf),
[integ3r](https://github.com/integ3r),
[JasonMillward](https://github.com/JasonMillward),
[mledoze](https://github.com/mledoze),
[OshiHidra](https://github.com/OshiHidra),
[phoenixsong6](https://github.com/phoenixsong6),
[Pirozek](https://github.com/Pirozek),
[Scrool](https://github.com/Scrool),
[sorgo](https://github.com/sorgo),
[Xelio](https://github.com/Xelio),
[ZauberNerd](https://github.com/ZauberNerd)


Hacking
-------

Execute `./build.py` to effectively concatenate `main.js` with all the files in `code/`. It generates the user script which may be installed into your browser. Do not modify `ttic-debug.user.js` manually, because it is automatically generated. Instead, modify the files in `code/` and have that file built for you. The files in `dist/` are for release only and should not be touched by you.

`style.css` contains most styles required for the user-script. The extra ones can be found in `code/boot.js#window.setupStyles`. Only CSS rules that depend on config variables should be defined there.

`external/leaflet_google.js` contains some code to display Google Maps imagery with Leaflet, which is a slightly modified version [of this gist](https://gist.github.com/4504864). The code likely was originally written by Pavel Shramov.

`external/autolink.js` is the same file as distributed by Bryan Woods.


My dev setup is like this:
- checked out git repository
- symlinked the user script to the version in the repo. It should work like this:
  - `cd ~/.mozilla/firefox/<YOUR FF PROFILE>/scriptish_scripts/ingress-intel-total-conversion@breunigs`
  - `ln -s ~/<PATH TO REPO>/total-conversion-build.user.js ingress-intel-total-conversion@breunigs.user.js`
- if you are working on styles or scripts that are normally served via HTTP, you can setup an HTTP server for the current directory at `http://0.0.0.0:8000` using `python -m SimpleHTTPServer`.
- run `./autobuild.sh` to re-build the user script whenever you make changes
- Focus the location bar and hit enter instead of reloading. This way your browser doesn’t look for new versions of cached files.

Attribution & License
---------------------

This project is licensed under the permissive ISC license. Parts imported from other projects remain under their respective licenses:

- [load.js by Chris O'Hara; MIT](https://github.com/chriso/load.js)
- [autolink-js by Bryan Woods; MIT](https://github.com/bryanwoods/autolink-js)
- [leaflet.js; custom license (but appears free)](http://leafletjs.com/)
- [`leaflet_google.js` by Pavel Shramov; same as Leaftlet](https://github.com/shramov/leaflet-plugins) (modified, though)
- StackOverflow-CopyPasta is attributed in the source; [CC-Wiki](https://creativecommons.org/licenses/by-sa/3.0/)
- all Ingress/Niantic related stuff obviously remains non-free and is still copyrighted by Niantic/Google
