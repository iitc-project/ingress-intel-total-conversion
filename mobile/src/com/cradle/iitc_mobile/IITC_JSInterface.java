package com.cradle.iitc_mobile;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

import com.cradle.iitc_mobile.IITC_NavigationHelper.Pane;
import com.cradle.iitc_mobile.share.ShareActivity;

import java.util.Locale;

// provide communication between IITC script and android app
public class IITC_JSInterface {
    // context of main activity
    private final IITC_Mobile mIitc;

    IITC_JSInterface(IITC_Mobile iitc) {
        mIitc = iitc;
    }

    // open dialog to send geo intent for navigation apps like gmaps or waze etc...
    @JavascriptInterface
    public void intentPosLink(double lat, double lng, int zoom, String title, boolean isPortal) {
        Intent intent = new Intent(mIitc, ShareActivity.class);
        intent.putExtra("lat", lat);
        intent.putExtra("lng", lng);
        intent.putExtra("zoom", zoom);
        intent.putExtra("title", title);
        intent.putExtra("isPortal", isPortal);
        mIitc.startActivity(intent);
    }

    // share a string to the IITC share activity. only uses the share tab.
    @JavascriptInterface
    public void shareString(String str) {
        Intent intent = new Intent(mIitc, ShareActivity.class);
        intent.putExtra("shareString", str);
        intent.putExtra("onlyShare", true);
        mIitc.startActivity(intent);
    }

    // disable javascript injection while spinner is enabled
    // prevent the spinner from closing automatically
    @JavascriptInterface
    public void spinnerEnabled(boolean en) {
        Log.d("iitcm", "disableJS? " + en);
        mIitc.getWebView().disableJS(en);
    }

    // copy link to specific portal to android clipboard
    @JavascriptInterface
    public void copy(String s) {
        ClipboardManager clipboard = (ClipboardManager) mIitc
                .getSystemService(Context.CLIPBOARD_SERVICE);
        ClipData clip = ClipData.newPlainText("Copied Text ", s);
        clipboard.setPrimaryClip(clip);
        Toast.makeText(mIitc, "copied to clipboard", Toast.LENGTH_SHORT).show();
    }

    @JavascriptInterface
    public int getVersionCode() {
        int versionCode = 0;
        try {
            PackageInfo pInfo = mIitc.getPackageManager()
                    .getPackageInfo(mIitc.getPackageName(), 0);
            versionCode = pInfo.versionCode;
        } catch (PackageManager.NameNotFoundException e) {
            e.printStackTrace();
        }
        return versionCode;
    }

    @JavascriptInterface
    public String getVersionName() {
        String buildVersion = "unknown";
        PackageManager pm = mIitc.getPackageManager();
        try {
            PackageInfo info = pm.getPackageInfo(mIitc.getPackageName(), 0);
            buildVersion = info.versionName;
        } catch (PackageManager.NameNotFoundException e) {
            e.printStackTrace();
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
                    pane = Pane.valueOf(id.toUpperCase(Locale.getDefault()));
                } catch (IllegalArgumentException e) {
                    pane = Pane.MAP;
                }

                mIitc.setCurrentPane(pane);
            }
        });
    }

    @JavascriptInterface
    public void dialogFocused(String id) {
        mIitc.setFocusedDialog(id);
    }

    @JavascriptInterface
    public void dialogOpened(String id, boolean open) {
        mIitc.dialogOpened(id, open);
    }

    @JavascriptInterface
    public void bootFinished() {
        Log.d("iitcm", "...boot finished");

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
}
