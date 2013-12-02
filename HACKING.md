Hacking
=======

Execute `./build.py` to effectively concatenate `main.js` with all the files in `code/`. It generates the user script which may be installed into your browser. Do not modify `iitc-debug.user.js` manually, because it is automatically generated. Instead, modify the files in `code/` and have that file built for you. The files in `dist/` are for release only and should not be touched by you.

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


Code Style
----------

Please follow the these guidelines. Some are just preference, others are good practice.
- use identity operators: `===` and `!==`. [Why do I want this?](http://stackoverflow.com/a/359509/1684530)
- jQuery is your friend
- indent using two spaces
- opening brace on the same line: `if(blub) {`
- else clauses: `} else if(blub) {` or `} else {`
- there should be no space after `if`, `for`, etc. E.g. `if(true) { doStuff(); } else { dontDoStuff(); }`
- comments: `// this is a comment`
- quotes: Use single-quotes for JavaScript and double-quotes for HTML content. Example: `$('body').append('<div id="soup">Soup!</div>');`.
- there is no length limit on lines, but try to keep them short where suitable
- ensure you remove *all* trailing whitespace before submitting your patch. If you editor doesn’t detect those for you, try `grep -nE "[[:space:]]+$" «filename»`


Sending patches
---------------

- use GitHub and git to fork the repository
- match the code style as shown above
- use [GitHub’s pull request feature](https://help.github.com/articles/using-pull-requests) to submit patches easily
- use one pull request for one feature – don’t put many things into one request. This makes reviewing harder for me.
- you can use `git add -p` to selectively add parts to a commit. This allows for clear commit messages instead of “implement everything” ones.

~~For plugins this is less strict, but I still review those.~~ It applies to plugins as well.


Debugging
---------

…or how do I use my browser’s console?

Every browser has a console built in that allows for easy debugging.
- **Chrome:** hit `CTRL+SHIFT+J`
- **Firefox:** hit `CTRL+SHIFT+K` or if you have Firebug installed `F12`
- **Opera:** hit `CTRL+SHIFT+I`

The consoles basically work the same. You can run commands in the console window that execute in the page’s context. All browsers also allow you to inspect the HTML code that currently makes the page. It’s usually available in a different tab and called “document” or “elements” (except for Firefox: hit `CTRL+SHIFT+I`).


How do I report bugs?
---------------------

**Try this first**:
- update the user script and all its plugins.
- after updating, go to the intel page.
- press `SHIFT+F5` (or shift-click the reload button). Wait for the page to load.
- press `CTRL+F5`, same as above.

You can also try to [install the most recent developer version (“nightly”)]
(https://www.dropbox.com/sh/lt9p0s40kt3cs6m/3xzpyiVBnF) and repeat the steps above. Maybe your issue has already been fixed? The nightly versions will update to the next stable release, so you don’t need to worry about that.

If your issue persists, continue. The next step is to look for existing issues, maybe someone else has a similar problem. You can look [through the existing issues](https://github.com/jonatkins/ingress-intel-total-conversion/issues?sort=updated&state=open) or use the search function on the top right. If your issue persists, open a new issue and provide **all** of the information below, even if you don’t think this is necessary.

- a descriptive title
- your browser and its version
- IITC’s version
- all installed IITC-plugins and their version
- a portal link
- either of these:
    - outline the steps that lead to the bug, so I can reproduce the problem
    - description of how the script behaves now and how it should behave instead


[You may report the issue here.](https://github.com/jonatkins/ingress-intel-total-conversion/issues/new)


If asked to **“copy console output”**, do the following:
- open the browser’s console like described in the previous section
- reload the page
- reproduce the bug
- copy all information in the log and [paste it on pastebin.com](http://pastebin.com/)
- share the link in the issue
