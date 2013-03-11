package com.cradle.iitc_mobile;

import android.annotation.SuppressLint;
import android.content.Context;
import android.util.AttributeSet;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.GeolocationPermissions;

@SuppressLint("SetJavaScriptEnabled")
public class IITC_WebView extends WebView {

	private WebSettings settings;
	private IITC_WebViewClient webclient;
	private IITC_JSInterface js_interface;

	// init web view
	private void iitc_init(Context c) {
		settings = this.getSettings();
		settings.setJavaScriptEnabled(true);
		settings.setDomStorageEnabled(true);
		settings.setAllowFileAccess(true);
		settings.setGeolocationEnabled(true);
		this.js_interface = new IITC_JSInterface(c);
		this.addJavascriptInterface(js_interface, "android");

		// our webchromeclient should share geolocation with the iitc script
		// allow access by default
		this.setWebChromeClient(new WebChromeClient() {
			@Override
			public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
				callback.invoke(origin, true, false);
			}
		});

		webclient = new IITC_WebViewClient(c);
		this.setWebViewClient(webclient);
	}

	// constructors -------------------------------------------------
	public IITC_WebView(Context context) {
		super(context);

		iitc_init(context);
	}

	public IITC_WebView(Context context, AttributeSet attrs) {
		super(context, attrs);

		iitc_init(context);
	}

	public IITC_WebView(Context context, AttributeSet attrs, int defStyle) {
		super(context, attrs, defStyle);

		iitc_init(context);
	}
	//----------------------------------------------------------------

	public IITC_WebViewClient getWebViewClient() {
		return this.webclient;
	}

	public IITC_JSInterface getJSInterface() {
		return this.js_interface;
	}

}
