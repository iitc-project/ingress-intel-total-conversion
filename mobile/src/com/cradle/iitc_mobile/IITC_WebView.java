package com.cradle.iitc_mobile;

import android.annotation.SuppressLint;
import android.content.Context;
import android.util.AttributeSet;
import android.webkit.WebSettings;
import android.webkit.WebView;

@SuppressLint("SetJavaScriptEnabled")
public class IITC_WebView extends WebView {

	private WebSettings settings;
	private IITC_WebViewClient webclient;

	// init web view
	private void iitc_init() {
		settings = this.getSettings();
		settings.setJavaScriptEnabled(true);
		settings.setDomStorageEnabled(true);
		settings.setAllowFileAccess(true);

		webclient = new IITC_WebViewClient();
		this.setWebViewClient(webclient);
	}

	// constructors -------------------------------------------------
	public IITC_WebView(Context context) {
		super(context);

		iitc_init();
	}

	public IITC_WebView(Context context, AttributeSet attrs) {
		super(context, attrs);

		iitc_init();
	}

	public IITC_WebView(Context context, AttributeSet attrs, int defStyle) {
		super(context, attrs, defStyle);

		iitc_init();
	}
	//----------------------------------------------------------------

}
