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
import android.net.Uri;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

// provide communication between IITC script and android app
public class IITC_JSInterface {

    // context of main activity
    Context context;
    HashMap<String, String> layer_ids;
    boolean[] active_array;
    String[] all_layers;
    int num_base_layers;
    int num_overlay_layers;
    int active_base_layer;

    IITC_JSInterface(Context c) {
        layer_ids = new HashMap<String, String>();
        context = c;
    }

    // send geo intent for navigation apps like gmaps or waze etc...
    @JavascriptInterface
    public void intentPosLink(String lat, String lng, String portal_name) {
        String uri = "geo:" + lat + "," + lng + "?q=" + lat + "," + lng
                + "%20(" + portal_name + ")";
        Intent intent = new Intent(android.content.Intent.ACTION_VIEW,
                Uri.parse(uri));
        context.startActivity(intent);
    }

    // disable javascript injection while spinner is enabled
    // prevent the spinner from closing automatically
    @JavascriptInterface
    public void spinnerEnabled(boolean en) {
        Log.d("iitcm", "disableJS? " + en);
        ((IITC_Mobile) context).getWebView().disableJS(en);
    }

    // copy link to specific portal to android clipboard
    @JavascriptInterface
    public void copy(String s) {
        ClipboardManager clipboard = (ClipboardManager) context
                .getSystemService(Context.CLIPBOARD_SERVICE);
        ClipData clip = ClipData.newPlainText("Copied Text ", s);
        clipboard.setPrimaryClip(clip);
        Toast.makeText(context, "copied to clipboard", Toast.LENGTH_SHORT)
                .show();
    }

    @JavascriptInterface
    public void setLayers(String base_layers, String overlay_layers) {

        JSONArray base_layersJSON = null;
        JSONArray overlay_layersJSON = null;
        try {
            base_layersJSON = new JSONArray(base_layers);
            overlay_layersJSON = new JSONArray(overlay_layers);
        } catch (JSONException e) {
            e.printStackTrace();
        }

        num_base_layers = base_layersJSON.length();
        num_overlay_layers = overlay_layersJSON.length();
        int total_lenght = num_base_layers + num_overlay_layers;
        active_array = new boolean[total_lenght];
        all_layers = new String[total_lenght];
        layer_ids.clear();

        // --------------- overlay layers ------------------------
        for (int i = 0; i < overlay_layersJSON.length(); ++i) {
            try {
                String layer = overlay_layersJSON.getString(i);
                layer = layer.replace("{", "");
                layer = layer.replace("}", "");
                String[] layers = layer.split(",");
                String id = "";
                String name = "";
                boolean isActive = false;
                for (int j = 0; j < layers.length; ++j) {
                    String[] values = layers[j].split(":");
                    if (values[0].contains("active")) isActive = values[1].equals("true");
                    if (values[0].contains("layerId")) id = values[1];
                    if (values[0].contains("name")) name = values[1];
                }
                name = name.replace("\"", "");
                layer_ids.put(name, id);
                all_layers[i] = name;
                active_array[i] = isActive;
            } catch (JSONException e) {
                // TODO Auto-generated catch block
                e.printStackTrace();
            }
        }

        // --------------- base layers ------------------------
        for (int i = 0; i < base_layersJSON.length(); ++i) {
            try {
                String layer = base_layersJSON.getString(i);
                layer = layer.replace("{", "");
                layer = layer.replace("}", "");
                String[] layers = layer.split(",");
                String id = "";
                String name = "";
                boolean isActive = false;
                for (int j = 0; j < layers.length; ++j) {
                    String[] values = layers[j].split(":");
                    if (values[0].contains("active")) isActive = values[1].equals("true");
                    if (values[0].contains("layerId")) id = values[1];
                    if (values[0].contains("name")) name = values[1];
                }
                name = name.replace("\"", "");
                layer_ids.put(name, id);
                all_layers[i + num_overlay_layers] = name;
                active_array[i + num_overlay_layers] = isActive;
                if (isActive) active_base_layer = i + num_overlay_layers;
            } catch (JSONException e) {
                // TODO Auto-generated catch block
                e.printStackTrace();
            }
        }

        // build the layer chooser dialog
        AlertDialog.Builder  d = new AlertDialog.Builder(context);
        OnMultiChoiceClickListener m_listener = new OnMultiChoiceClickListener() {

            @Override
            public void onClick(DialogInterface dialog, int which, boolean isChecked) {
                // activate clicked layer
                ((IITC_Mobile) context).getWebView().loadUrl("javascript: window.layerChooser.showLayer("
                        + layer_ids.get(all_layers[which]) + ","
                        + active_array[which] + ");");
                // disable old base layer...we can only have one active base layer
                if (which >= num_overlay_layers) {
                    active_array[active_base_layer] = false;
                    ((AlertDialog) dialog).getListView().setItemChecked(active_base_layer, false);
                    active_base_layer = which;
                }
            }
        };
        d.setMultiChoiceItems(all_layers, active_array , m_listener);
        d.setPositiveButton("Close", new OnClickListener() {
              @Override
              public void onClick(DialogInterface dialog, int which) {
                  dialog.cancel();
              }
        });
        d.show();

    }
}
