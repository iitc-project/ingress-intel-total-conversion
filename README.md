ingress intel total conversion (IITC)
=====================================

It’s annoying to extend the intel page with new features because the minified code makes it hard to grasp what’s going on. Also, one has to play catch up each time Niantic put up a new version because all the variables might get new names.

So instead, here’s a userscript that starts from scratch (click to zoom):

[![Screenshot of the total conversion in Johannesburg](http://breunigs.github.com/ingress-intel-total-conversion/screenshots/screen_small.png)](http://breunigs.github.com/ingress-intel-total-conversion/screenshots/screen.png)


Features / User Guide
---------------------

You already know you want it, why add a feature list here? Instead, [**read the user guide** for tricks and less obvious features](https://github.com/breunigs/ingress-intel-total-conversion/tree/gh-pages/USERGUIDE.md). If you have questions, the user guide will also likely answer them.

IITC can be [extended with the use of plugins](https://github.com/breunigs/ingress-intel-total-conversion/tree/gh-pages/plugins), so have a look at those if you want (or need) more.


Install
-------

Current version is 0.7.8. [See NEWS.md for details](https://github.com/breunigs/ingress-intel-total-conversion/blob/gh-pages/NEWS.md).

[**INSTALL**](https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/dist/total-conversion-build.user.js)

### Firefox

- Install [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) or [Scriptish](https://addons.mozilla.org/en-US/firefox/addon/scriptish/).
- Click install link: [install](https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/dist/total-conversion-build.user.js)
- Confirm security question.
- Reload page.

*NoScript:* To make the script work whitelist at least these domains: `ingress.com github.com leafletjs.com googleapis.com`. If you want to see the cool font also whitelist `googleusercontent.com`.

### Chrome

- Install [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo/details).
- Click install link: [install](https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/dist/total-conversion-build.user.js)
- **Now beware:** a OK/cancel dialog pops up. It **does not** allow you to cancel the installation. Choose **OK** to install the script with Tampermonkey.
- Confirm once again.
- Reload page.

*Note:* Tampermonkey is optional. However, it offers auto-update, shows correct version numbers and installing user scripts is much easier. If you have installed the scripts directly into Chrome before, I recommend you switch to Tampermonkey. To do so, uninstall the IITC scripts and click each install link again. Follow the procedure explained above.

### Opera
- Download the script: [download](https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/dist/total-conversion-build.user.js)
- put it into your user_js folder (that’s `~/.opera/user_js` on Unix). If you can’t find it [see Opera’s docs](http://www.opera.com/docs/userjs/using/#writingscripts).
- [visit `opera:config` and check `UserJavaScriptonHTTPS` or click here to take you there](opera:config#UserPrefs|UserJavaScriptonHTTPS).
- click save on the bottom of the settings page
- reload the Intel Map, no need to restart Opera

*Note*: You need to update the scripts manually.


[**INSTALL**](https://raw.github.com/breunigs/ingress-intel-total-conversion/gh-pages/dist/total-conversion-build.user.js)

Reporting Issues
----------------

[tutorial / guide / please read / **free candy**](https://github.com/breunigs/ingress-intel-total-conversion/blob/gh-pages/HACKING.md#how-do-i-report-bugs)


How can I help? // Contribution
-------------------------------

First of all, it’s very nice you want to help. There are several equally important ways you can. Some require a technical background and some don’t:
- **answering help requests:** often people are asking how to do specific things in bug reports or are asking for things that already exist. Kindly point them to what they’re looking for and maybe consider updating the user guide, if it lacks on that topic.
- **asking for more information:** Sometimes a bug report contains barely enough information to grasp what’s going on. Ask the reporter for the parts that you believe might be helpful, like the browser used. Similarily, if someone requests a feature make sure the description is accurate. Depending on the request, a concrete proposal on how to display this to the user might be helpful.
- **finding bugs / regressions:** If you are closer to the development of IITC, it’s usually easier for you to spot misbehaviours or bugs that have been recently introduces. Opening tickets for those, ideally with a step by step guide to reproduce the issue is very helpful.
- **hacking / sending patches:** Of course, if you want to contribute source code to the project that’s fine as well. Please [read HACKING.md for details](https://github.com/breunigs/ingress-intel-total-conversion/blob/gh-pages/HACKING.md).

**So far, these people have contributed:**

[Bananeweizen](https://github.com/Bananeweizen),
[blakjakau](https://github.com/blakjakau),
[boombuler](https://github.com/boombuler),
[cmrn](https://github.com/cmrn),
[epf](https://github.com/epf),
[integ3r](https://github.com/integ3r),
[j16sdiz](https://github.com/j16sdiz),
[JasonMillward](https://github.com/JasonMillward),
[jonatkins](https://github.com/jonatkins),
[Merovius](https://github.com/Merovius),
[mledoze](https://github.com/mledoze),
[OshiHidra](https://github.com/OshiHidra),
[phoenixsong6](https://github.com/phoenixsong6),
[Pirozek](https://github.com/Pirozek),
[saithis](https://github.com/saithis),
[Scrool](https://github.com/Scrool),
[sorgo](https://github.com/sorgo),
[tpenner](https://github.com/tpenner),
[vita10gy](https://github.com/vita10gy),
[Xelio](https://github.com/Xelio),
[ZauberNerd](https://github.com/ZauberNerd),
[waynn](https://github.com/waynn)


Attribution & License
---------------------

This project is licensed under the permissive ISC license. Parts imported from other projects remain under their respective licenses:

- [autolink-js by Bryan Woods; MIT](https://github.com/bryanwoods/autolink-js)
- [load.js by Chris O'Hara; MIT](https://github.com/chriso/load.js)
- [leaflet.js; custom license (but appears free)](http://leafletjs.com/)
- [leaflet.draw.js; by jacobtoye; MIT](https://github.com/Leaflet/Leaflet.draw)
- [`leaflet_google.js` by Pavel Shramov; same as Leaftlet](https://github.com/shramov/leaflet-plugins) (modified, though)
- [jquery.qrcode.js by Jerome Etienne; MIT](https://github.com/jeromeetienne/jquery-qrcode)
- StackOverflow-CopyPasta is attributed in the source; [CC-Wiki](https://creativecommons.org/licenses/by-sa/3.0/)
- all Ingress/Niantic related stuff obviously remains non-free and is still copyrighted by Niantic/Google
