package com.cradle.iitc_mobile;

import android.webkit.ConsoleMessage;
import android.webkit.GeolocationPermissions;
import android.webkit.WebChromeClient;
import android.webkit.WebView;

/**
 * Created by cradle on 12/21/13.
 */
public class IITC_WebChromeClient extends WebChromeClient {

    private IITC_Mobile mIitcm;

    public IITC_WebChromeClient(IITC_Mobile iitcm) {
        mIitcm = iitcm;
    }

    /**
     * our webchromeclient should share geolocation with the iitc script
     *
     * allow access by default
     */
    @Override
    public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
        callback.invoke(origin, true, false);
    }

    /**
     * display progress bar in activity
     */
    @Override
    public void onProgressChanged(WebView view, int newProgress) {
        super.onProgressChanged(view, newProgress);

        // maximum for newProgress is 100
        // maximum for setProgress is 10,000
        mIitcm.setProgress(newProgress * 100);
    }

    /**
     * remove splash screen if any JS error occurs
     */
    @Override
    public boolean onConsoleMessage(ConsoleMessage message) {
        if (message.messageLevel() == ConsoleMessage.MessageLevel.ERROR) {
            mIitcm.setLoadingState(false);
        }

        if (Log.log(message))
            return true; // message was handled

        return super.onConsoleMessage(message);
    }
}
