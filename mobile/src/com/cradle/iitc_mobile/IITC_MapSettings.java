package com.cradle.iitc_mobile;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.AdapterView.OnItemClickListener;
import android.widget.AdapterView.OnItemLongClickListener;
import android.widget.AdapterView.OnItemSelectedListener;
import android.widget.ArrayAdapter;
import android.widget.CheckedTextView;
import android.widget.ListView;
import android.widget.Spinner;
import android.widget.TextView;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Comparator;

public class IITC_MapSettings implements OnItemSelectedListener, OnItemClickListener, OnItemLongClickListener {
    private class HighlighterAdapter extends ArrayAdapter<String> {
        private final HighlighterComparator mComparator = new HighlighterComparator();

        private HighlighterAdapter(int resource) {
            super(mIitc, resource);
            clear();
        }

        @Override
        public void add(String object) {
            super.remove(object); // to avoid duplicates
            super.add(object);
            super.sort(mComparator);
        }

        @Override
        public void clear() {
            super.clear();
            add("No Highlights");// Probably must be the same as window._no_highlighter
        }
    }

    private class HighlighterComparator implements Comparator<String> {
        @Override
        public int compare(String lhs, String rhs) {
            // Move "No Highlights" on top. Sort the rest alphabetically
            if (lhs.equals("No Highlights")) {
                return -1000;
            } else if (rhs.equals("No Highlights")) {
                return 1000;
            } else {
                return lhs.compareTo(rhs);
            }
        }
    }

    private class Layer {
        boolean active;
        int id;
        String name;

        @Override
        public String toString() {
            return name;
        }
    }

    private class LayerAdapter extends ArrayAdapter<Layer> {
        public LayerAdapter(int resource) {
            super(mIitc, resource);
        }

        @Override
        public View getView(int position, View convertView, ViewGroup parent) {
            Layer item = getItem(position);
            View view = (TextView) super.getView(position, convertView, parent);

            if (view instanceof CheckedTextView) {
                ((CheckedTextView) view).setChecked(item.active);
            }
            return view;
        }
    }

    private final IITC_Mobile mIitc;

    private final ArrayAdapter<String> mHighlighters;
    private final ArrayAdapter<Layer> mBaseLayers;
    private final ArrayAdapter<Layer> mOverlayLayers;

    private final Spinner mSpinnerBaseMap;
    private final Spinner mSpinnerHighlighter;
    private final ListView mListViewOverlayLayers;

    private String mActiveHighlighter;
    private int mActiveLayer;

    private boolean mLoading = true;

    public IITC_MapSettings(IITC_Mobile activity) {
        mIitc = activity;

        mHighlighters = new HighlighterAdapter(R.layout.list_item_narrow);
        mBaseLayers = new LayerAdapter(R.layout.list_item_narrow);
        mOverlayLayers = new LayerAdapter(android.R.layout.simple_list_item_multiple_choice);

        mHighlighters.setDropDownViewResource(R.layout.list_item_selectable);
        mBaseLayers.setDropDownViewResource(R.layout.list_item_selectable);

        LayoutInflater inflater = (LayoutInflater) mIitc.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
        View header = inflater.inflate(R.layout.map_options_header, null);

        mSpinnerHighlighter = (Spinner) header.findViewById(R.id.spinnerHighlighter);
        mSpinnerBaseMap = (Spinner) header.findViewById(R.id.spinnerBaseLayer);
        mListViewOverlayLayers = (ListView) mIitc.findViewById(R.id.right_drawer);

        mListViewOverlayLayers.addHeaderView(header);

        mSpinnerHighlighter.setAdapter(mHighlighters);
        mSpinnerBaseMap.setAdapter(mBaseLayers);
        mListViewOverlayLayers.setAdapter(mOverlayLayers);

        mSpinnerHighlighter.setOnItemSelectedListener(this);
        mSpinnerBaseMap.setOnItemSelectedListener(this);
        mListViewOverlayLayers.setOnItemClickListener(this);
        mListViewOverlayLayers.setOnItemLongClickListener(this);
    }

    private void setLayer(Layer layer) {
        if (!mLoading) {
            mIitc.getWebView().loadUrl(
                    "javascript: window.layerChooser.showLayer(" + layer.id + "," + layer.active + ");");
        }
    }

    public void addPortalHighlighter(String name) {
        mHighlighters.add(name);

        // to select active highlighter. must be called every time because of sorting
        setActiveHighlighter(mActiveHighlighter);
    }

    public void onBootFinished() {
        mLoading = false;
        updateLayers();
    }

    @Override
    public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
        position--; // The ListView header counts as an item as well.

        Layer item = mOverlayLayers.getItem(position);
        item.active = !item.active;
        setLayer(item);
        mOverlayLayers.notifyDataSetChanged();
    }

    @Override
    public boolean onItemLongClick(AdapterView<?> parent, View view, int position, long id) {
        position--; // The ListView header counts as an item as well.
        boolean active = !mOverlayLayers.getItem(position).active;

        for (int i = 0; i < mOverlayLayers.getCount(); i++) {
            Layer item = mOverlayLayers.getItem(i);
            if (item.name.contains("DEBUG")) continue;
            if (active == item.active) continue; // no need to set same value again
            item.active = active;
            setLayer(item);
        }

        mOverlayLayers.notifyDataSetChanged();

        return true;
    }

    @Override
    public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
        if (mLoading) return;

        if (parent.equals(mSpinnerHighlighter)) {
            String name = mHighlighters.getItem(position);
            mIitc.getWebView().loadUrl("javascript: window.changePortalHighlights('" + name + "')");
        } else if (parent.equals(mSpinnerBaseMap)) {
            mBaseLayers.getItem(mActiveLayer).active = false; // set old layer to hidden, but no need to really hide

            Layer layer = mBaseLayers.getItem(position);
            layer.active = true;
            setLayer(layer);
        }
    }

    @Override
    public void onNothingSelected(AdapterView<?> parent) {
        // ignore
    }

    public void reset() {
        mHighlighters.clear();
        mBaseLayers.clear();
        mOverlayLayers.clear();

        mIitc.getNavigationHelper().setHighlighter(null);

        mLoading = true;
    }

    public void setActiveHighlighter(String name) {
        mActiveHighlighter = name;

        int position = mHighlighters.getPosition(mActiveHighlighter);
        if (position >= 0 && position < mHighlighters.getCount()) {
            mSpinnerHighlighter.setSelection(position);
        }

        mIitc.getNavigationHelper().setHighlighter(name);
    }

    public void setLayers(String base_layer, String overlay_layer) {
        /*
         * the layer strings have a form like:
         * [{"layerId":27,"name":"MapQuest OSM","active":true},
         * {"layerId":28,"name":"Default Ingress Map","active":false}]
         * Put it in a JSONArray and parse it
         */
        JSONArray base_layers = null;
        JSONArray overlay_layers = null;

        try {
            base_layers = new JSONArray(base_layer);
            overlay_layers = new JSONArray(overlay_layer);
        } catch (JSONException e) {
            e.printStackTrace();
            return;
        }

        mActiveLayer = 0;
        mBaseLayers.setNotifyOnChange(false);
        mBaseLayers.clear();
        for (int i = 0; i < base_layers.length(); i++) {
            try {
                JSONObject layerObj = base_layers.getJSONObject(i);
                Layer layer = new Layer();

                layer.id = layerObj.getInt("layerId");
                layer.name = layerObj.getString("name");
                layer.active = layerObj.getBoolean("active");

                if (layer.active)
                // getCount() will be the index of the layer we are about to add
                {
                    mActiveLayer = mBaseLayers.getCount();
                }

                mBaseLayers.add(layer);
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
        mBaseLayers.notifyDataSetChanged();
        mSpinnerBaseMap.setSelection(mActiveLayer);

        mOverlayLayers.setNotifyOnChange(false);
        mOverlayLayers.clear();
        for (int i = 0; i < overlay_layers.length(); i++) {
            try {
                JSONObject layerObj = overlay_layers.getJSONObject(i);
                Layer layer = new Layer();

                layer.id = layerObj.getInt("layerId");
                layer.name = layerObj.getString("name");
                layer.active = layerObj.getBoolean("active");

                mOverlayLayers.add(layer);
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
        mOverlayLayers.notifyDataSetChanged();
    }

    public void updateLayers() {
        if (!mLoading) {
            mIitc.getWebView().loadUrl("javascript: window.layerChooser.getLayers()");
        }
    }
}
