<h2>IITC Browser Addon</h2>

<?php
include_once ( "code/desktop-download.php" );
?>

<div class="alert alert-block">
<p>
<b>IMPORTANT!</b>: You <b>must</b> uninstall the original IITC before installing this version. Failure to do this
will result in multiple copes installed which I expect will cause a LOT of issues.
</p>
<p>
<b>NOTE</b>: The first release available on this web site was not configured correctly for auto updates.
If you installed before this note appeared <span class="nowrap">(22nd March 2013)</span> you will need to
manually uninstall IITC and all plugins, then reinstall from below. Going forward, updates will work correctly
(for Chrome + Tampermoneky and Firefox + Greasemonkey users).
</p>
</div>

<h3>Requirements</h3>

<p>
IITC will work in the Chrome or Firefox browsers. It should also work with Opera and other browsers supporting
userscripts, but these are far less tested. For Android phones, please see the <a href="?page=mobile">mobile</a> page.
</p>

<h4>Chrome</h4>

<p>
Although it is possible to install userscripts directly as extensions, the recommended method is to use
<a href="https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo">Tampermonkey</a>.
Once Tampermonkey is installed, click on the "Download" button below and click "OK" on the two dialogs to install.
</p>

<h4>Firefox</h4>

<p>
Install the <a href="https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/">Greasemonkey</a> Firefox add-on.
Once installed, click the "Download" then "Install" on the dialog.
</p>

<h4>Other browsers</h4>

<p>
Check your browser documentation for details on installing userscripts.
</p>


<h3>Download</h3>

<?php
iitcDesktopDownload ( "release" );
?>

<hr>


<h4>Plugins</h4>

<p>
Plugins extend/modify the IITC experience. You do <b>not</b> need to install all plugins. Some are only useful to
a minority of users.
</p>

<?php
iitcDesktopPluginDownloadTable ( "release" );
?>
