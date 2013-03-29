package com.cradle.iitc_mobile;

import java.io.IOException;

import com.cradle.iitc_mobile.R;

import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.preference.PreferenceManager;
import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.widget.Toast;

public class IITC_Mobile extends Activity {

	private IITC_WebView iitc_view;
	private boolean back_button_pressed = false;
	private boolean desktop = false;
	
	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_main);
		iitc_view = (IITC_WebView) findViewById(R.id.iitc_webview);

		// we do not want to reload our page every time we switch orientations...
		// so restore state if activity was already created
		if(savedInstanceState != null) {
			iitc_view.restoreState(savedInstanceState);
		}
		else {
			// load new iitc web view with ingress intel page
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
					iitc_view.loadUrl(addUrlParam(url));
				}
			}
			else {
				Log.d("No Intent call", "loading https://www.ingress.com/intel");
				iitc_view.loadUrl(addUrlParam("https://www.ingress.com/intel"));
			}
		}
	}
	
	@Override
	protected void onResume() {
		super.onResume();
		
		// reload page if, the desktop/mobile pref has changed
		SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(this);
		if (desktop != sharedPref.getBoolean("pref_force_desktop", false)) {
			Log.d("pref changed", "force Desktop/Mobile changed...reloading");
			desktop = sharedPref.getBoolean("pref_force_desktop", false);
			iitc_view.loadUrl(addUrlParam("https://www.ingress.com/intel"));
			injectJS();
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
			iitc_view.loadUrl(addUrlParam("https://www.ingress.com/intel"));
			injectJS();
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
		case R.id.settings:
			startActivity(new Intent(this, IITC_Settings.class));
			return true;
		default:
			return super.onOptionsItemSelected(item);
		}
	}

	private void injectJS() {
		try {
			iitc_view.getWebViewClient().loadIITC_JS(this);
		} catch (IOException e1) {
			e1.printStackTrace();
		} catch (NullPointerException e2) {
			e2.printStackTrace();
		}
	}
	
	private String addUrlParam(String url) {
		SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(this);
		this.desktop = sharedPref.getBoolean("pref_force_desktop", false);
		
		if (desktop)
			return (url + "?vp=f");
		else
			return (url + "?vp=m");
	}
}
