<h2>IITC Browser Addon</h2>

<?php
include_once ( "code/desktop-download.php" );
?>

<h3>Requirements</h3>

<p>
IITC will work in the Chrome or Firefox browsers. It should also work with Opera and other browsers supporting
userscripts, but these are far less tested. For Android phones, please see the <a href="?page=mobile">mobile</a> page.
</p>

<h4>Chrome</h4>

<p>
Although it is possible to install userscripts directly as extensions, the recommended method is to use
<a href="https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo">Tampermonkey</a>.
Once Tampermonkey is installed, click on the "Download" button below and follow the instructions.
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

<h3>Updating</h3>

<p>
If IITC is already installed, it's easy to update in most cases:
</p>

<h4>Chrome and Tampermonkey</h4>

<p>
Open the Tampermonkey menu and choose "Check for userscript updates". If you have a lot of plugins, or other scripts
installed, this can be a little slow. Wait 30 seconds, then try clicking the Tampermonkey icon again; if the menu opens,
it's finished updating. Once complete, reload the Ingress intel map to use the new version.
</p>

<h4>Firefox and Greasemonkey</h4>

<p>
Open the Greasemonkey menu and choose "Manage user scripts". Now click the cog icon and choose "Check for updates".
However, sometimes Greasemonkey fails to update all scripts. Check the date+time listed at the start of the description
(e.g. "[jonatkins-2013-08-23-042102]") and if any have failed to update then manually download from the list below.
Once updated, reload the Intel map and the new version will be active.
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
