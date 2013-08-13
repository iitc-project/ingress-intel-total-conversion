package com.cradle.iitc_mobile;

import java.util.HashMap;

import org.json.JSONArray;
import org.json.JSONException;

import android.app.AlertDialog;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.DialogInterface;
import android.content.DialogInterface.OnClickListener;
import android.content.DialogInterface.OnMultiChoiceClickListener;
import android.content.Intent;
import android.util.Log;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.widget.AdapterView;
import android.widget.ListView;
import android.widget.Toast;

import com.cradle.iitc_mobile.share.ShareActivity;

// provide communication between IITC script and android app
public class IITC_JSInterface {

    // context of main activity
    private final Context mContext;
    private final HashMap<String, String> mLayerIds;
    private boolean[] mOverlayIsActive;
    private int mActiveBaseLayer;
    private String[] mOverlayLayers, mBaseLayers;
    private int mNumBaseLayers;
    private int mNumOverlayLayers;

    IITC_JSInterface(Context c) {
        mLayerIds = new HashMap<String, String>();
        mContext = c;
    }

    // open dialog to send geo intent for navigation apps like gmaps or waze etc...
    @JavascriptInterface
    public void intentPosLink(double lat, double lng, int zoom, String title, boolean isPortal) {
        Intent intent = new Intent(mContext, ShareActivity.class);
        intent.putExtra("lat", lat);
        intent.putExtra("lng", lng);
        intent.putExtra("zoom", zoom);
        intent.putExtra("title", title);
        intent.putExtra("isPortal", isPortal);
        mContext.startActivity(intent);
    }

    // share a string to the IITC share activity. only uses the share tab.
    @JavascriptInterface
    public void shareString(String str) {
        Intent intent = new Intent(mContext, ShareActivity.class);
        intent.putExtra("shareString", str);
        intent.putExtra("onlyShare", true);
        mContext.startActivity(intent);
    }

    // disable javascript injection while spinner is enabled
    // prevent the spinner from closing automatically
    @JavascriptInterface
    public void spinnerEnabled(boolean en) {
        Log.d("iitcm", "disableJS? " + en);
        ((IITC_Mobile) mContext).getWebView().disableJS(en);
    }

    // copy link to specific portal to android clipboard
    @JavascriptInterface
    public void copy(String s) {
        ClipboardManager clipboard = (ClipboardManager) mContext
                .getSystemService(Context.CLIPBOARD_SERVICE);
        ClipData clip = ClipData.newPlainText("Copied Text ", s);
        clipboard.setPrimaryClip(clip);
        Toast.makeText(mContext, "copied to clipboard", Toast.LENGTH_SHORT)
                .show();
    }

    @JavascriptInterface
    public void switchToPane(String id) {

        final IITC_Mobile iitcm = (IITC_Mobile) mContext;
        final int button_id;
        final String title;

        if (id.equals("map")) {
            button_id = android.R.id.home;
            title = iitcm.getString(R.string.app_name);
        } else if (id.equals("info")) {
            button_id = R.id.menu_info;
            title = "Info";
        } else if (id.equals("full")) {
            button_id = R.id.menu_full;
            title = "Full";
        } else if (id.equals("compact")) {
            button_id = R.id.menu_compact;
            title = "Compact";
        } else if (id.equals("public")) {
            button_id = R.id.menu_public;
            title = "Public";
        } else if (id.equals("faction")) {
            button_id = R.id.menu_faction;
            title = "Faction";
        } else if (id.equals("debug")) {
            button_id = R.id.menu_debug;
            title = "Debug";
        }
        // default
        else {
            button_id = android.R.id.home;
            title = iitcm.getString(R.string.app_name);
        }

        Log.d("iitcm", "switch to pane " + id);
        iitcm.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                iitcm.getActionBar().setTitle(title);
                iitcm.backStackUpdate(button_id);
            }
        });
    }

    @JavascriptInterface
    public void dialogOpened(String id, boolean open) {
        ((IITC_Mobile) mContext).dialogOpened(id, open);
    }

    @JavascriptInterface
    public void dialogFocused(String id) {
        ((IITC_Mobile) mContext).setFocusedDialog(id);
    }

    @JavascriptInterface
    public void removeSplashScreen() {
        Log.d("iitcm", "removing splash screen");
        final IITC_Mobile iitc = ((IITC_Mobile) mContext);

        iitc.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                iitc.findViewById(R.id.iitc_webview).setVisibility(View.VISIBLE);
                iitc.findViewById(R.id.imageLoading).setVisibility(View.GONE);
            }
        });
    }

    // get layers and list them in a dialog
    @JavascriptInterface
    public void setLayers(String base_layer, String overlay_layer) {

        /*
         *  the layer strings have a form like:
         *  [{"layerId":27,"name":"MapQuest OSM","active":true},
         *  {"layerId":28,"name":"Default Ingress Map","active":false}]
         *  Put it in a JSONArray and parse it
         */
        JSONArray base_layersJSON = null;
        JSONArray overlay_layersJSON = null;
        try {
            base_layersJSON = new JSONArray(base_layer);
            overlay_layersJSON = new JSONArray(overlay_layer);
        } catch (JSONException e) {
            e.printStackTrace();
        }

        // get length and initialize arrays
        mNumBaseLayers = base_layersJSON.length();
        mNumOverlayLayers = overlay_layersJSON.length();
        mOverlayIsActive = new boolean[mNumOverlayLayers];
        mOverlayLayers = new String[mNumOverlayLayers];
        mBaseLayers = new String[mNumBaseLayers];
        mLayerIds.clear();

        // --------------- base layers ------------------------
        for (int i = 0; i < mNumBaseLayers; ++i) {
            try {
                String layer = base_layersJSON.getString(i);
                layer = layer.replace("{", "");
                layer = layer.replace("}", "");
                /*
                 * we now should have a string like
                 * ["layerId":27,"name":"MapQuest OSM","active":true]
                 * split it on ,
                 */
                String[] layers = layer.split(",");
                /*
                 * we should have 3 strings in a form like
                 * "name":"MapQuest OSM"
                 * get the values and get rid of the quotation marks
                 */
                String id = "";
                String name = "";
                boolean isActive = false;
                for (String b_layer : layers) {
                    String[] values = b_layer.split(":");
                    if (values[0].contains("active")) isActive = values[1].equals("true");
                    if (values[0].contains("layerId")) id = values[1];
                    if (values[0].contains("name")) name = values[1];
                }
                name = name.replace("\"", "");
                mLayerIds.put(name, id);
                this.mBaseLayers[i] = name;
                if (isActive) mActiveBaseLayer = i;
            } catch (JSONException e) {
                // TODO Auto-generated catch block
                e.printStackTrace();
            }
        }

        // --------------- overlay layers ------------------------
        for (int i = 0; i < mNumOverlayLayers; ++i) {
            try {
                String layer = overlay_layersJSON.getString(i);
                layer = layer.replace("{", "");
                layer = layer.replace("}", "");
                String[] layers = layer.split(",");
                String id = "";
                String name = "";
                boolean isActive = false;
                for (String o_layer : layers) {
                    String[] values = o_layer.split(":");
                    if (values[0].contains("active")) isActive = values[1].equals("true");
                    if (values[0].contains("layerId")) id = values[1];
                    if (values[0].contains("name")) name = values[1];
                }
                name = name.replace("\"", "");
                mLayerIds.put(name, id);
                this.mOverlayLayers[i] = name;
                this.mOverlayIsActive[i] = isActive;
            } catch (JSONException e) {
                // TODO Auto-generated catch block
                e.printStackTrace();
            }
        }
        // show overlay layers by default
        showMultiSelection();
    }

    // show all overlay layers in a multi selection list dialog
    private void showMultiSelection() {
        // build the layer chooser dialog
        AlertDialog.Builder d_m = new AlertDialog.Builder(mContext);
        OnMultiChoiceClickListener m_listener = new OnMultiChoiceClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which, boolean isChecked) {
                // activate clicked layer
                ((IITC_Mobile) mContext).getWebView().loadUrl("javascript: " +
                        "window.layerChooser.showLayer("
                        + mLayerIds.get(mOverlayLayers[which]) + ","
                        + isChecked + ");");
            }
        };
        d_m.setMultiChoiceItems(mOverlayLayers, mOverlayIsActive, m_listener);
        // switch to base layers
        d_m.setPositiveButton(R.string.base_layers, new OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                showSingleSelection();
                dialog.dismiss();
            }
        });
        d_m.setNegativeButton(R.string.close, new OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                dialog.dismiss();
            }
        });
        d_m.setTitle(R.string.overlay_layers);
        final AlertDialog dialog = d_m.create();
        final ListView list = dialog.getListView();
        list.setOnItemLongClickListener(new AdapterView.OnItemLongClickListener() {
            boolean disable = false;
            @Override
            public boolean onItemLongClick(AdapterView<?> adapterView, View view, int i, long l) {
                int j = 0;
                for (String layer : mOverlayLayers) {
                    if (!mOverlayLayers[j].contains("DEBUG")) {
                        // uncheck the item + set the boolean in the isActive array
                        mOverlayIsActive[j] = disable;
                        list.setItemChecked(j, disable);
                        ((IITC_Mobile) mContext).getWebView().loadUrl("javascript: " +
                                "window.layerChooser.showLayer("
                                + mLayerIds.get(layer) + ","
                                + disable + ");");
                    }
                    ++j;
                }
                disable = !disable;
                return true;
            }
        });
        dialog.show();
    }

    // show all base layers in a single selection list dialog
    private void showSingleSelection() {
        OnClickListener s_listener = new OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                // activate clicked layer
                ((IITC_Mobile) mContext).getWebView().loadUrl("javascript: " +
                        "window.layerChooser.showLayer("
                        + mLayerIds.get(mBaseLayers[which]) + ","
                        + true + ");");
                mActiveBaseLayer = which;
            }
        };
        AlertDialog.Builder d_s = new AlertDialog.Builder(mContext);
        d_s.setSingleChoiceItems(mBaseLayers, mActiveBaseLayer, s_listener);
        // switch to overlay layers
        d_s.setPositiveButton(R.string.overlay_layers, new OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                showMultiSelection();
                dialog.dismiss();
            }
        });
        d_s.setNegativeButton(R.string.close, new OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                dialog.dismiss();
            }
        });
        d_s.setTitle(R.string.base_layers);
        final AlertDialog dialog = d_s.create();
        dialog.show();
    }
}
