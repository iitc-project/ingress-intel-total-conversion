package com.cradle.iitc_mobile;

import java.io.IOException;

import com.cradle.iitc_mobile.R;

import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager.NameNotFoundException;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.widget.Toast;

public class IITC_Mobile extends Activity {

	private IITC_WebView iitc_view;
	private boolean back_button_pressed = false;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_main);

		// we do not want to reload our page every time we switch orientations...
		// so restore state if activity was already created
		if(savedInstanceState != null) {
			((IITC_WebView)findViewById(R.id.webview)).restoreState(savedInstanceState);
		}
		else {
			// load new iitc web view with ingress intel page
			iitc_view= (IITC_WebView) findViewById(R.id.webview);
			Intent intent = getIntent();
			String action = intent.getAction();
			if (Intent.ACTION_VIEW.equals(action)) {
				Uri uri = intent.getData();
				String url = uri.toString();
				// TODO Why does "if(intent.getScheme() == "http")" not work?
				if (url.contains("http://"))
					url = url.replace("http://", "https://");
				Log.d("Intent received", "url: " + url);
				if (url.contains("ingress.com")) {
					Log.d("Intent received", "loading url...");
					iitc_view.loadUrl(url);
				}
			}
			else {
				Log.d("No Intent call", "loading https://www.ingress.com/intel");
				iitc_view.loadUrl("https://www.ingress.com/intel");
			}
		}
	}

	// save instance state to avoid reloading on orientation change
	@Override
	protected void onSaveInstanceState(Bundle outState) {
		iitc_view.saveState(outState);
	}

	// we want a self defined behavior for the back button
	@Override
	public void onBackPressed() {
		if (this.back_button_pressed) {
			super.onBackPressed();
			return;
		}

		iitc_view.loadUrl("javascript: window.goBack();");
		this.back_button_pressed = true;
		Toast.makeText(this, "Press twice to exit", Toast.LENGTH_SHORT).show();

		// reset back button after 0.5 seconds
		new Handler().postDelayed(new Runnable() {
			@Override
			public void run() {
				back_button_pressed=false;
			}
		}, 500);
	}

	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		// Inflate the menu; this adds items to the action bar if it is present.
		getMenuInflater().inflate(R.menu.main, menu);
		return true;
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item) {
		// Handle item selection
		switch (item.getItemId()) {
		case R.id.reload_button:
			iitc_view.reload();
			try {
				iitc_view.getWebViewClient().loadIITC_JS(this);
			} catch (IOException e1) {
				e1.printStackTrace();
			}
			return true;
		// print version number
		case R.id.version_num:
			PackageInfo pinfo;
			try {
				pinfo = getPackageManager().getPackageInfo(getPackageName(), 0);
				Toast.makeText(this, "Build version: " + pinfo.versionName, Toast.LENGTH_SHORT).show();
			} catch (NameNotFoundException e) {
				e.printStackTrace();
			}
			return true;
		// clear cache
		case R.id.cache_clear:
			iitc_view.clearHistory();
			iitc_view.clearFormData();
			iitc_view.clearCache(true);
			return true;
		// get the users current location and focus it on map
		case R.id.locate:
			iitc_view.loadUrl("javascript: window.map.locate({setView : true, maxZoom: 13});");
			return true;
		default:
			return super.onOptionsItemSelected(item);
		}
	}
}
