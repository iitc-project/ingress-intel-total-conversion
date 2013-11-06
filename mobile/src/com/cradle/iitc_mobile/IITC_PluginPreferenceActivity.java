package com.cradle.iitc_mobile;

import android.content.Context;
import android.content.res.AssetManager;
import android.os.Bundle;
import android.os.Environment;
import android.preference.PreferenceActivity;
import android.text.TextUtils;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.ListAdapter;
import android.widget.TextView;

import com.cradle.iitc_mobile.fragments.PluginsFragment;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Scanner;
import java.util.TreeMap;

public class IITC_PluginPreferenceActivity extends PreferenceActivity {

    private List<Header> mHeaders;
    // we use a tree map to have a map with alphabetical order
    private static TreeMap<String, ArrayList<IITC_PluginPreference>> sPlugins = null;
    public static final String USER_PLUGIN = "00000";
    private static int mDeletedPlugins = 0;

    @Override
    public void setListAdapter(ListAdapter adapter) {
        if (adapter == null) {
            super.setListAdapter(null);
        } else {
            super.setListAdapter(new HeaderAdapter(this, mHeaders));
        }
    }

    @Override
    public void onBuildHeaders(List<Header> target) {
        getActionBar().setDisplayHomeAsUpEnabled(true);

        mHeaders = target;
        // since the plugins container is static,
        // it is enough to parse the plugin only on first start.
        if (sPlugins == null) {
            Log.d("iitcm", "opened plugin prefs the first time since app start -> parse plugins");
            sPlugins = new TreeMap<String, ArrayList<IITC_PluginPreference>>();
            setUpPluginPreferenceScreen();
        } else {
            checkForNewPlugins();
        }
        addHeaders();
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        if (onIsMultiPane()) {
            getIntent()
                    .putExtra(PreferenceActivity.EXTRA_SHOW_FRAGMENT, PluginsFragment.class.getName());
        }
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void onResume() {

        // Call super :
        super.onResume();

        // Select the displayed fragment in the headers (when using a tablet) :
        // This should be done by Android, it is a bug fix
        // thx to http://stackoverflow.com/a/16793839
        if (mHeaders != null) {

            final String displayedFragment = getIntent().getStringExtra(EXTRA_SHOW_FRAGMENT);
            if (displayedFragment != null) {
                for (final Header header : mHeaders) {
                    if (displayedFragment.equals(header.fragment)) {
                        switchToHeader(header);
                        break;
                    }
                }
            }
        }
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        switch (item.getItemId()) {
            case android.R.id.home: // exit settings when home button (iitc icon) is pressed
                onBackPressed();
                return true;
            default:
                return super.onOptionsItemSelected(item);
        }
    }

    @Override
    protected boolean isValidFragment(String s) {
        return true;
    }

    // called by Plugins Fragment
    public static ArrayList<IITC_PluginPreference> getPluginPreference(String key) {
        return sPlugins.get(key);
    }

    private String[] getAssetPlugins() {
        AssetManager am = getAssets();
        String[] asset_array = null;
        try {
            asset_array = am.list("plugins");
        } catch (IOException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
        if (asset_array == null) {
            asset_array = new String[0];
        }
        return asset_array;
    }

    private File[] getUserPlugins() {
        String iitc_path = Environment.getExternalStorageDirectory().getPath()
                + "/IITC_Mobile/";
        File directory = new File(iitc_path + "plugins/");
        File[] files = directory.listFiles();
        if (files == null) {
            files = new File[0];
        }
        return files;
    }

    void checkForNewPlugins() {
        File[] user = getUserPlugins();
        String[] official = getAssetPlugins();
        int numPlugins = 0;
        for (Map.Entry<String, ArrayList<IITC_PluginPreference>> entry : sPlugins.entrySet()) {
            numPlugins += entry.getValue().size();
        }
        if ((user.length + official.length) != (numPlugins + mDeletedPlugins)) {
            Log.d("iitcm", "new or less plugins found since last start, rebuild preferences");
            sPlugins.clear();
            setUpPluginPreferenceScreen();
        }
    }

    void setUpPluginPreferenceScreen() {

        // get all plugins from asset manager
        String[] asset_array = getAssetPlugins();

        for (String anAsset_array : asset_array) {
            // find user plugin name for user readable entries
            Scanner s = null;
            String src = "";
            try {
                s = new Scanner(getAssets().open("plugins/" + anAsset_array))
                        .useDelimiter("\\A");
            } catch (IOException e2) {
                // TODO Auto-generated catch block
                e2.printStackTrace();
            }
            if (s != null) {
                src = s.hasNext() ? s.next() : "";
            }
            // now we have all stuff together and can build the pref screen
            addPluginPreference(src, anAsset_array, false);
        }

        // load user plugins from <storage-path>/IITC_Mobile/plugins/
        File[] files = getUserPlugins();
        for (File file : files) {
            Scanner s = null;
            String src = "";
            try {
                s = new Scanner(file).useDelimiter("\\A");
            } catch (FileNotFoundException e) {
                e.printStackTrace();
                Log.d("iitcm", "failed to parse file " + file);
            }
            if (s != null) {
                src = s.hasNext() ? s.next() : "";
            }

            // now we have all stuff together and can build the pref screen
            addPluginPreference(src, file.toString(), true);
        }
    }

    void addPluginPreference(String src, String plugin_key, boolean user) {

        // parse plugin name, description and category
        // we need default versions here otherwise iitcm may crash
        HashMap<String,String> info = IITC_WebViewClient.getScriptInfo(src);
        String plugin_name = info.get("name");
        String plugin_cat = info.get("category");
        String plugin_desc = info.get("description");

        // remove IITC plugin prefix from plugin_name
        plugin_name = plugin_name.replace("IITC Plugin: ", "");
        plugin_name = plugin_name.replace("IITC plugin: ", "");

        // add [User] tag to user plugins
        if (user) {
            plugin_cat = USER_PLUGIN + plugin_cat;
        }

        // do not add deleted plugins
        if (plugin_cat.equals("Deleted")) {
            mDeletedPlugins++;
            return;
        }

        // now we have all stuff together and can build the preference
        // first check if we need a new category
        if (!sPlugins.containsKey(plugin_cat)) {
            sPlugins.put(plugin_cat, new ArrayList<IITC_PluginPreference>());
            Log.d("iitcm", "create " + plugin_cat + " and add " + plugin_name);
        }

        // now build a new checkable preference for the plugin
        IITC_PluginPreference plugin_pref = new IITC_PluginPreference(this);
        plugin_pref.setKey(plugin_key);
        plugin_pref.setTitle(plugin_name);
        plugin_pref.setSummary(plugin_desc);
        plugin_pref.setDefaultValue(false);
        plugin_pref.setPersistent(true);
        ArrayList<IITC_PluginPreference> list = sPlugins.get(plugin_cat);
        list.add(plugin_pref);
    }

    void addHeaders() {
        boolean first_user = true;
        boolean first_official = true;
        // every fragment handles 1 plugin category
        // push the category to the fragment and add the header to the list
        for (Map.Entry<String, ArrayList<IITC_PluginPreference>> entry : sPlugins.entrySet()) {
            Bundle bundle = new Bundle();
            String plugin_cat = entry.getKey();
            bundle.putString("category", plugin_cat);
            if (plugin_cat.startsWith(USER_PLUGIN)) {
                if (first_user) {
                    Header category = new Header();
                    category.title = "User Plugins";
                    first_user = false;
                    mHeaders.add(category);
                }
                plugin_cat = plugin_cat.replace(USER_PLUGIN, "");
            } else if (first_official) {
                Header category = new Header();
                category.title = "Official Plugins";
                first_official = false;
                mHeaders.add(category);
            }
            Header newHeader = new Header();
            newHeader.title = plugin_cat;
            newHeader.fragmentArguments = bundle;
            newHeader.fragment = "com.cradle.iitc_mobile.fragments.PluginsFragment";
            mHeaders.add(newHeader);
        }
    }

    /*
     * This code is only for header categories. Thx to Android that we haven't this by default and
     * thx to Stackoverflow for this post: http://stackoverflow.com/a/18720212
     */
    private static class HeaderAdapter extends ArrayAdapter<Header> {
        static final int HEADER_TYPE_CATEGORY = 0;
        static final int HEADER_TYPE_NORMAL = 1;
        private static final int HEADER_TYPE_COUNT = HEADER_TYPE_NORMAL + 1;

        private static class HeaderViewHolder {
            TextView title;
            TextView summary;
        }

        private final LayoutInflater mInflater;

        static int getHeaderType(Header header) {
            if (header.fragment == null && header.intent == null) {
                return HEADER_TYPE_CATEGORY;
            } else {
                return HEADER_TYPE_NORMAL;
            }
        }

        @Override
        public int getItemViewType(int position) {
            Header header = getItem(position);
            return getHeaderType(header);
        }

        @Override
        public boolean areAllItemsEnabled() {
            return false; // because of categories
        }

        @Override
        public boolean isEnabled(int position) {
            return getItemViewType(position) != HEADER_TYPE_CATEGORY;
        }

        @Override
        public int getViewTypeCount() {
            return HEADER_TYPE_COUNT;
        }

        @Override
        public boolean hasStableIds() {
            return true;
        }

        public HeaderAdapter(Context context, List<Header> objects) {
            super(context, 0, objects);

            mInflater = (LayoutInflater) context
                    .getSystemService(Context.LAYOUT_INFLATER_SERVICE);

        }

        @Override
        public View getView(int position, View convertView, ViewGroup parent) {
            HeaderViewHolder holder;
            Header header = getItem(position);
            int headerType = getHeaderType(header);
            View view = null;

            if (convertView == null) {
                holder = new HeaderViewHolder();
                switch (headerType) {
                    case HEADER_TYPE_CATEGORY:
                        view = new TextView(getContext(), null,
                                android.R.attr.listSeparatorTextViewStyle);
                        holder.title = (TextView) view;
                        break;

                    case HEADER_TYPE_NORMAL:
                        view = mInflater.inflate(R.layout.preference_header_item,
                                parent, false);
                        holder.title = (TextView) view
                                .findViewById(R.id.plug_pref_title);
                        holder.summary = (TextView) view
                                .findViewById(R.id.plug_pref_summary);
                        break;
                }
                view.setTag(holder);
            } else {
                view = convertView;
                holder = (HeaderViewHolder) view.getTag();
            }

            // All view fields must be updated every time, because the view may
            // be recycled
            switch (headerType) {
                case HEADER_TYPE_CATEGORY:
                    holder.title.setText(header.getTitle(getContext()
                            .getResources()));
                    break;
                case HEADER_TYPE_NORMAL:
                    holder.title.setText(header.getTitle(getContext()
                            .getResources()));
                    CharSequence summary = header.getSummary(getContext()
                            .getResources());
                    if (!TextUtils.isEmpty(summary)) {
                        holder.summary.setVisibility(View.VISIBLE);
                        holder.summary.setText(summary);
                    } else {
                        holder.summary.setVisibility(View.GONE);
                    }
                    break;
            }

            return view;
        }
    }
}
