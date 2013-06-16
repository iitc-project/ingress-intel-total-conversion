package com.cradle.iitc_mobile;

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

import org.json.JSONArray;
import org.json.JSONException;

import java.util.HashMap;

// provide communication between IITC script and android app
public class IITC_JSInterface {

    // context of main activity
    private final Context context;
    private final HashMap<String, String> layer_ids;
    private boolean[] overlay_is_active;
    private int active_base_layer;
    private String[] overlay_layers, base_layers;
    private int num_base_layers;
    private int num_overlay_layers;

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
    public void switchToPane(String id) {

        final IITC_Mobile iitcm = (IITC_Mobile) context;
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
        ((IITC_Mobile) context).dialogOpened(id, open);
    }

    // get layers and list them in a dialog
    @JavascriptInterface
    public void setLayers(String base_layer, String overlay_layer) {

        /*
         *  the layer strings have a form like:
         *  [{"layerId":27,"name":"MapQuest OSM","active":true},{"layerId":28,"name":"Default Ingress Map","active":false}]
         *  Put it in a JSONArray and parse it
         */
        JSONArray base_layersJSON = null;
        JSONArray overlay_layersJSON = null;
        Log.d("iitcm", base_layer);
        try {
            base_layersJSON = new JSONArray(base_layer);
            overlay_layersJSON = new JSONArray(overlay_layer);
        } catch (JSONException e) {
            e.printStackTrace();
        }

        // get length and initialize arrays
        num_base_layers = base_layersJSON.length();
        num_overlay_layers = overlay_layersJSON.length();
        overlay_is_active = new boolean[num_overlay_layers];
        overlay_layers = new String[num_overlay_layers];
        base_layers = new String[num_base_layers];
        layer_ids.clear();

        // --------------- base layers ------------------------
        for (int i = 0; i < num_base_layers; ++i) {
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
                layer_ids.put(name, id);
                this.base_layers[i] = name;
                if (isActive) active_base_layer = i;
            } catch (JSONException e) {
                // TODO Auto-generated catch block
                e.printStackTrace();
            }
        }

        // --------------- overlay layers ------------------------
        for (int i = 0; i < num_overlay_layers; ++i) {
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
                layer_ids.put(name, id);
                this.overlay_layers[i] = name;
                this.overlay_is_active[i] = isActive;
            } catch (JSONException e) {
                // TODO Auto-generated catch block
                e.printStackTrace();
            }
        }
        // show overlay layers by default
        show_multi_selection();
    }

    // show all overlay layers in a multi selection list dialog
    private void show_multi_selection() {
        // build the layer chooser dialog
        AlertDialog.Builder d_m = new AlertDialog.Builder(context);
        OnMultiChoiceClickListener m_listener = new OnMultiChoiceClickListener() {

            @Override
            public void onClick(DialogInterface dialog, int which, boolean isChecked) {
                // activate clicked layer
                ((IITC_Mobile) context).getWebView().loadUrl("javascript: window.layerChooser.showLayer("
                        + layer_ids.get(overlay_layers[which]) + ","
                        + overlay_is_active[which] + ");");
            }
        };

        d_m.setMultiChoiceItems(overlay_layers, overlay_is_active, m_listener);
        // switch to base layers
        d_m.setPositiveButton("Base Layers", new OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                show_single_selection();
                dialog.cancel();
            }
        });
        d_m.setNegativeButton("Close", new OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                dialog.cancel();
            }
        });
        d_m.setTitle("Overlay Layers");
        d_m.show();
    }

    // show all base layers in a single selection list dialog
    private void show_single_selection() {
        OnClickListener s_listener = new OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                // activate clicked layer
                ((IITC_Mobile) context).getWebView().loadUrl("javascript: window.layerChooser.showLayer("
                        + layer_ids.get(base_layers[which]) + ","
                        + true + ");");
                active_base_layer = which;
            }
        };
        AlertDialog.Builder d_s = new AlertDialog.Builder(context);
        d_s.setSingleChoiceItems(base_layers, active_base_layer, s_listener);
        // switch to overlay layers
        d_s.setPositiveButton("Overlay Layers", new OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                show_multi_selection();
                dialog.cancel();
            }
        });
        d_s.setNegativeButton("Close", new OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                dialog.cancel();
            }
        });
        d_s.setTitle("Base Layers");
        d_s.show();
    }
}
