package com.cradle.iitc_mobile;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

// provide communication between IITC script and android app
public class IITC_JSInterface {

    // context of main activity
    Context context;

    IITC_JSInterface(Context c) {
        context = c;
    }

    // send geo intent for navigation apps like gmaps or waze etc...
    @JavascriptInterface
    public void intentPosLink(String lat, String lng) {
        // TODO eventually we want back our lat/lng-query? + "?q=" + lat + "," + lng;
        String uri = "geo:" + lat + "," + lng;
        Intent intent = new Intent(android.content.Intent.ACTION_VIEW,
                Uri.parse(uri));
        context.startActivity(intent);
    }

    // copy link to specific portal to android clipboard
    @JavascriptInterface
    public void copy(String s) {
        ClipboardManager clipboard = (ClipboardManager) context.getSystemService(Context.CLIPBOARD_SERVICE);
        ClipData clip = ClipData.newPlainText("Copied Text ", s);
            clipboard.setPrimaryClip(clip);
        Toast.makeText(context, "copied to clipboard", Toast.LENGTH_SHORT).show();
    }
}
