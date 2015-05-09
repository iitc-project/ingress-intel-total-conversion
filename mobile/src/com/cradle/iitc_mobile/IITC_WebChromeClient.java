package com.cradle.iitc_mobile;

import android.webkit.ConsoleMessage;
import android.webkit.GeolocationPermissions;
import android.webkit.JsPromptResult;
import android.webkit.JsResult;
import android.webkit.WebChromeClient;
import android.webkit.WebView;

/**
 * Created by cradle on 12/21/13.
 */
public class IITC_WebChromeClient extends WebChromeClient {

    private final IITC_Mobile mIitc;

    public IITC_WebChromeClient(final IITC_Mobile iitc) {
        mIitc = iitc;
    }

    /**
     * our webchromeclient should share geolocation with the iitc script
     *
     * allow access by default
     */
    @Override
    public void onGeolocationPermissionsShowPrompt(final String origin, final GeolocationPermissions.Callback callback) {
        callback.invoke(origin, true, false);
    }

    /**
     * display progress bar in activity
     */
    @Override
    public void onProgressChanged(final WebView view, final int newProgress) {
        super.onProgressChanged(view, newProgress);

        // maximum for newProgress is 100
        // maximum for setProgress is 10,000
        mIitc.setProgress(newProgress * 100);
    }

    /**
     * remove splash screen if any JS error occurs
     */
    @Override
    public boolean onConsoleMessage(final ConsoleMessage message) {
        if (message.messageLevel() == ConsoleMessage.MessageLevel.ERROR) {
            mIitc.setLoadingState(false);
        }

        if (Log.log(message))
            return true; // message was handled

        return super.onConsoleMessage(message);
    }

    @Override
    public boolean onJsAlert(final WebView view, final String url, final String message, final JsResult result) {
        return new IITC_JsDialogHelper(IITC_JsDialogHelper.ALERT, view, url, message, null, result).shouldInterrupt();
    }

    @Override
    public boolean onJsBeforeUnload(final WebView view, final String url, final String message, final JsResult result) {
        return new IITC_JsDialogHelper(IITC_JsDialogHelper.UNLOAD, view, url, message, null, result).shouldInterrupt();
    }

    @Override
    public boolean onJsConfirm(final WebView view, final String url, final String message, final JsResult result) {
        return new IITC_JsDialogHelper(IITC_JsDialogHelper.CONFIRM, view, url, message, null, result).shouldInterrupt();
    }

    @Override
    public boolean onJsPrompt(final WebView view, final String url, final String message, final String defaultValue,
            final JsPromptResult result) {
        return new IITC_JsDialogHelper(IITC_JsDialogHelper.PROMPT, view, url, message, defaultValue, result)
                .shouldInterrupt();
    }
}
