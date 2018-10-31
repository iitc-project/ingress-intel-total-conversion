package com.cradle.iitc_mobile;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Environment;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

import com.cradle.iitc_mobile.IITC_NavigationHelper.Pane;
import com.cradle.iitc_mobile.share.ShareActivity;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.lang.NullPointerException;

// provide communication between IITC script and android app
public class IITC_JSInterface {
    // context of main activity
    protected final IITC_Mobile mIitc;

    IITC_JSInterface(final IITC_Mobile iitc) {
        mIitc = iitc;
    }

    // open dialog to send geo intent for navigation apps like gmaps or waze etc...
    @JavascriptInterface
    public void intentPosLink(
            final double lat, final double lng, final int zoom, final String title, final boolean isPortal) {
        mIitc.startActivity(ShareActivity.forPosition(mIitc, lat, lng, zoom, title, isPortal));
    }

    // share a string to the IITC share activity. only uses the share tab.
    @JavascriptInterface
    public void shareString(final String str) {
        mIitc.startActivity(ShareActivity.forString(mIitc, str));
    }

    // disable javascript injection while spinner is enabled
    // prevent the spinner from closing automatically
    @JavascriptInterface
    public void spinnerEnabled(final boolean en) {
        mIitc.getWebView().disableJS(en);
    }

    // copy link to specific portal to android clipboard
    @JavascriptInterface
    public void copy(final String s) {
        final ClipboardManager clipboard = (ClipboardManager) mIitc.getSystemService(Context.CLIPBOARD_SERVICE);
        final ClipData clip = ClipData.newPlainText("Copied Text ", s);
        clipboard.setPrimaryClip(clip);
        Toast.makeText(mIitc, "copied to clipboard", Toast.LENGTH_SHORT).show();
    }

    @JavascriptInterface
    public int getVersionCode() {
        int versionCode = 0;
        try {
            final PackageInfo pInfo = mIitc.getPackageManager().getPackageInfo(mIitc.getPackageName(), 0);
            versionCode = pInfo.versionCode;
        } catch (final PackageManager.NameNotFoundException e) {
            Log.w(e);
        }
        return versionCode;
    }

    @JavascriptInterface
    public String getVersionName() {
        String buildVersion = "unknown";
        final PackageManager pm = mIitc.getPackageManager();
        try {
            final PackageInfo info = pm.getPackageInfo(mIitc.getPackageName(), 0);
            buildVersion = info.versionName;
        } catch (final PackageManager.NameNotFoundException e) {
            Log.w(e);
        }
        return buildVersion;
    }

    @JavascriptInterface
    public void switchToPane(final String id) {
        mIitc.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                Pane pane;
                try {
                    pane = mIitc.getNavigationHelper().getPane(id);
                } catch (final IllegalArgumentException e) {
                    pane = Pane.MAP;
                }

                mIitc.setCurrentPane(pane);
            }
        });
    }

    @JavascriptInterface
    public void dialogFocused(final String id) {
        mIitc.setFocusedDialog(id);
    }

    @JavascriptInterface
    public void dialogOpened(final String id, final boolean open) {
        mIitc.dialogOpened(id, open);
    }

    @JavascriptInterface
    public void bootFinished() {
        Log.d("...boot finished");

        mIitc.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                mIitc.setLoadingState(false);

                mIitc.getMapSettings().onBootFinished();
            }
        });
    }

    // get layers and list them in a dialog
    @JavascriptInterface
    public void setLayers(final String base_layer, final String overlay_layer) {
        mIitc.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                mIitc.getMapSettings().setLayers(base_layer, overlay_layer);
            }
        });
    }

    @JavascriptInterface
    public void addPortalHighlighter(final String name) {
        mIitc.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                mIitc.getMapSettings().addPortalHighlighter(name);
            }
        });
    }

    @JavascriptInterface
    public void setActiveHighlighter(final String name) {
        mIitc.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                mIitc.getMapSettings().setActiveHighlighter(name);
            }
        });
    }

    @JavascriptInterface
    public void updateIitc(final String fileUrl) {
        mIitc.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                mIitc.updateIitc(fileUrl);
            }
        });
    }

    @JavascriptInterface
    public void addPane(final String name, final String label, final String icon) {
        mIitc.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                mIitc.getNavigationHelper().addPane(name, label, icon);
            }
        });
    }

    // some plugins may have no specific icons...add a default icon
    @JavascriptInterface
    public void addPane(final String name, final String label) {
        mIitc.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                mIitc.getNavigationHelper().addPane(name, label, "ic_action_new_event");
            }
        });
    }

    @JavascriptInterface
    public boolean showZoom() {
        final PackageManager pm = mIitc.getPackageManager();
        final boolean hasMultitouch = pm.hasSystemFeature(PackageManager.FEATURE_TOUCHSCREEN_MULTITOUCH);
        final boolean forcedZoom = mIitc.getPrefs().getBoolean("pref_user_zoom", false);
        return forcedZoom || !hasMultitouch;
    }

    @JavascriptInterface
    public void setFollowMode(final boolean follow) {
        mIitc.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                mIitc.getUserLocation().setFollowMode(follow);
            }
        });
    }

    @JavascriptInterface
    public void setProgress(final double progress) {
        mIitc.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    if (progress != -1) {
                        // maximum for setProgress is 10,000
                        mIitc.setProgressBarIndeterminate(false);
                        mIitc.setProgress((int) Math.round(progress * 10000));
                    }
                    else {
                        mIitc.setProgressBarIndeterminate(true);
                        mIitc.setProgress(1);
                    }
                } catch(NullPointerException e) {
                    // for some reason, setProgressBarIndeterminate throws a NullPointerException on some devices
                    e.printStackTrace();
                    mIitc.setProgress(10000); // hide the progress bar
                }
            }
        });
    }

    @JavascriptInterface
    public String getFileRequestUrlPrefix() {
        return mIitc.getFileManager().getFileRequestPrefix();
    }

    @JavascriptInterface
    public void setPermalink(final String href) {
        mIitc.setPermalink(href);
    }

    @JavascriptInterface
    public void saveFile(final String filename, final String type, final String content) {
        try {
            final File outFile = new File(Environment.getExternalStorageDirectory().getPath() +
                    "/IITC_Mobile/export/" + filename);
            outFile.getParentFile().mkdirs();

            final FileOutputStream outStream = new FileOutputStream(outFile);
            outStream.write(content.getBytes("UTF-8"));
            outStream.close();
            Toast.makeText(mIitc, "File exported to " + outFile.getPath(), Toast.LENGTH_SHORT).show();
        } catch (final IOException e) {
            e.printStackTrace();
        }
    }

    @JavascriptInterface
    public void reloadIITC() {
        mIitc.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                mIitc.reloadIITC();
            }
        });
    }

    @JavascriptInterface
    public void reloadIITC(final boolean clearCache) {
        mIitc.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (clearCache) mIitc.getWebView().clearCache(true);
                mIitc.reloadIITC();
            }
        });
    }
}
