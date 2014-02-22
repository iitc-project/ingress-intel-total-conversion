package com.cradle.iitc_mobile;

import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.res.AssetManager;
import android.net.Uri;
import android.os.Bundle;
import android.preference.PreferenceActivity;
import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.ListAdapter;
import android.widget.TextView;
import android.widget.Toast;

import com.cradle.iitc_mobile.fragments.PluginsFragment;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

public class IITC_PluginPreferenceActivity extends PreferenceActivity {

    private final static int COPY_PLUGIN_REQUEST = 1;

    private List<Header> mHeaders;
    // we use a tree map to have a map with alphabetical order
    // don't initialize the asset plugin map, because it tells us if the settings are started the first time
    // and we have to parse plugins to build the preference screen
    private static TreeMap<String, ArrayList<IITC_PluginPreference>> sAssetPlugins = null;
    // user plugins can be initialized.
    private static final TreeMap<String, ArrayList<IITC_PluginPreference>> sUserPlugins =
            new TreeMap<String, ArrayList<IITC_PluginPreference>>();
    private static int mDeletedPlugins = 0;

    private IITC_FileManager mFileManager;

    @Override
    public void setListAdapter(final ListAdapter adapter) {
        if (adapter == null) {
            super.setListAdapter(null);
        } else {
            super.setListAdapter(new HeaderAdapter(this, mHeaders));
        }
    }

    @Override
    public void onBuildHeaders(final List<Header> target) {
        getActionBar().setDisplayHomeAsUpEnabled(true);

        // notify about external plugins
        final IITC_NotificationHelper nh = new IITC_NotificationHelper(this);
        nh.showNotice(IITC_NotificationHelper.NOTICE_EXTPLUGINS);

        mHeaders = target;
        // since the plugins container is static,
        // it is enough to parse the plugin only on first start.
        if (sAssetPlugins == null) {
            Log.d("opened plugin prefs the first time since app start -> parse plugins");
            sAssetPlugins = new TreeMap<String, ArrayList<IITC_PluginPreference>>();
            setUpPluginPreferenceScreen();
        } else {
            checkForNewPlugins();
        }
        addHeaders();
    }

    @Override
    protected void onCreate(final Bundle savedInstanceState) {
        // on tablets, select a default fragment BEFORE calling super onCreate
        // otherwise the application will crash, because the first header (the
        // category) does not have a fragment assigned
        if (onIsMultiPane()) {
            getIntent()
                    .putExtra(PreferenceActivity.EXTRA_SHOW_FRAGMENT, PluginsFragment.class.getName());
        }

        mFileManager = new IITC_FileManager(this);

        final Uri uri = getIntent().getData();
        if (uri != null) {
            mFileManager.installPlugin(uri, true);
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
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.plugins, menu);
        return super.onCreateOptionsMenu(menu);
    }

    @Override
    public boolean onOptionsItemSelected(final MenuItem item) {
        switch (item.getItemId()) {
            case android.R.id.home: // exit settings when home button (iitc icon) is pressed
                onBackPressed();
                return true;
            case R.id.menu_plugins_add:
                // create the chooser Intent
                final Intent target = new Intent(Intent.ACTION_GET_CONTENT);
                // iitcm only parses *.user.js scripts
                target.setType("file/*");
                target.addCategory(Intent.CATEGORY_OPENABLE);

                try {
                    startActivityForResult(Intent.createChooser(target, "Choose file"), COPY_PLUGIN_REQUEST);
                } catch (final ActivityNotFoundException e) {
                    Toast.makeText(this, "No activity to select a file found." +
                            "Please install a file browser of your choice!", Toast.LENGTH_LONG).show();
                }
            default:
                return super.onOptionsItemSelected(item);
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        switch(requestCode) {
            case COPY_PLUGIN_REQUEST:
                if (data != null && data.getData() != null) {
                    mFileManager.installPlugin(data.getData(), true);
                    return;
                }
                break;
            default:
                super.onActivityResult(requestCode, resultCode, data);
                break;

        }
    }

    @Override
    protected boolean isValidFragment(final String s) {
        return true;
    }

    // called by Plugins Fragment
    public static ArrayList<IITC_PluginPreference> getPluginPreference(final String key, final boolean userPlugin) {
        if (userPlugin) return sUserPlugins.get(key);

        return sAssetPlugins.get(key);
    }

    private String[] getAssetPlugins() {
        final AssetManager am = getAssets();
        String[] asset_array = null;
        try {
            asset_array = am.list("plugins");
        } catch (final IOException e) {
            Log.w(e);
        }
        if (asset_array == null) {
            asset_array = new String[0];
        }
        return asset_array;
    }

    private File[] getUserPlugins() {
        final File directory = new File(IITC_FileManager.PLUGINS_PATH);
        File[] files = directory.listFiles();
        if (files == null) {
            files = new File[0];
        }
        return files;
    }

    void checkForNewPlugins() {
        final File[] userPlugins = getUserPlugins();
        final String[] officialPlugins = getAssetPlugins();
        int numPlugins = 0;
        for (final Map.Entry<String, ArrayList<IITC_PluginPreference>> entry : sUserPlugins.entrySet()) {
            numPlugins += entry.getValue().size();
        }
        for (final Map.Entry<String, ArrayList<IITC_PluginPreference>> entry : sAssetPlugins.entrySet()) {
            numPlugins += entry.getValue().size();
        }
        if ((userPlugins.length + officialPlugins.length) != (numPlugins + mDeletedPlugins)) {
            Log.d("new or less plugins found since last start, rebuild preferences");
            sAssetPlugins.clear();
            sUserPlugins.clear();
            mDeletedPlugins = 0;
            setUpPluginPreferenceScreen();
        }
    }

    void setUpPluginPreferenceScreen() {
        // get all plugins from asset manager
        final String[] assets = getAssetPlugins();
        for (final String asset : assets) {
            // find user plugin name for user readable entries
            try {
                final InputStream is = getAssets().open("plugins/" + asset);
                addPluginPreference(IITC_FileManager.readStream(is), asset, false);
            } catch (final FileNotFoundException e) {
                Log.e(asset + " not found", e);
            } catch (final IOException e) {
                Log.e("couldn't read plugin " + asset, e);
            }
        }

        // load user plugins from <storage-path>/IITC_Mobile/plugins/
        final File[] files = getUserPlugins();
        for (final File file : files) {
            try {
                final InputStream is = new FileInputStream(file);
                addPluginPreference(IITC_FileManager.readStream(is), file.toString(), true);
            } catch (final FileNotFoundException e) {
                Log.e("couldn't read plugin " + file.toString(), e);
            }
        }
    }

    void addPluginPreference(final String src, final String plugin_key, final boolean userPlugin) {
        // parse plugin name, description and category
        // we need default versions here otherwise iitcm may crash
        final HashMap<String, String> info = IITC_FileManager.getScriptInfo(src);
        String plugin_name = info.get("name");
        final String plugin_cat = info.get("category");
        final String plugin_desc = info.get("description");

        // remove IITC plugin prefix from plugin_name
        plugin_name = plugin_name.replace("IITC Plugin: ", "");
        plugin_name = plugin_name.replace("IITC plugin: ", "");

        // do not add deleted or stock map plugins
        if (plugin_cat.equals("Deleted") || plugin_cat.equals("Stock")) {
            mDeletedPlugins++;
            return;
        }

        // now we have all stuff together and can build the preference
        // first check if we need a new category
        if (userPlugin) {
            if (!sUserPlugins.containsKey(plugin_cat)) {
                sUserPlugins.put(plugin_cat, new ArrayList<IITC_PluginPreference>());
                Log.d("create " + plugin_cat + " and add " + plugin_name);
            }
        } else {
            if (!sAssetPlugins.containsKey(plugin_cat)) {
                sAssetPlugins.put(plugin_cat, new ArrayList<IITC_PluginPreference>());
                Log.d("create " + plugin_cat + " and add " + plugin_name);
            }
        }

        // now build a new checkable preference for the plugin
        final IITC_PluginPreference plugin_pref = new IITC_PluginPreference(this);
        plugin_pref.setKey(plugin_key);
        plugin_pref.setTitle(plugin_name);
        plugin_pref.setSummary(plugin_desc);
        plugin_pref.setDefaultValue(false);
        plugin_pref.setPersistent(true);
        final ArrayList<IITC_PluginPreference> list =
                userPlugin ? sUserPlugins.get(plugin_cat) : sAssetPlugins.get(plugin_cat);
        list.add(plugin_pref);
    }

    void addHeaders() {
        if (sUserPlugins.size() > 0) {
            final Header category = new Header();
            category.title = "User Plugins";
            mHeaders.add(category);
            for (final Map.Entry<String, ArrayList<IITC_PluginPreference>> entry : sUserPlugins.entrySet()) {
                addHeader(entry.getKey(), true);
            }
        }
        if (sAssetPlugins.size() > 0) {
            final Header category = new Header();
            category.title = "Official Plugins";
            mHeaders.add(category);
            for (final Map.Entry<String, ArrayList<IITC_PluginPreference>> entry : sAssetPlugins.entrySet()) {
                addHeader(entry.getKey(), false);
            }
        }
    }

    private void addHeader(final String title, final boolean userPlugin) {
        final Bundle bundle = new Bundle();
        bundle.putString("category", title);
        bundle.putBoolean("userPlugin", userPlugin);
        final Header newHeader = new Header();
        newHeader.title = title;
        newHeader.fragmentArguments = bundle;
        newHeader.fragment = "com.cradle.iitc_mobile.fragments.PluginsFragment";
        mHeaders.add(newHeader);
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

        static int getHeaderType(final Header header) {
            if (header.fragment == null && header.intent == null) {
                return HEADER_TYPE_CATEGORY;
            } else {
                return HEADER_TYPE_NORMAL;
            }
        }

        @Override
        public int getItemViewType(final int position) {
            final Header header = getItem(position);
            return getHeaderType(header);
        }

        @Override
        public boolean areAllItemsEnabled() {
            return false; // because of categories
        }

        @Override
        public boolean isEnabled(final int position) {
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

        public HeaderAdapter(final Context context, final List<Header> objects) {
            super(context, 0, objects);

            mInflater = (LayoutInflater) context.getSystemService(Context.LAYOUT_INFLATER_SERVICE);

        }

        @Override
        public View getView(final int position, final View convertView, final ViewGroup parent) {
            HeaderViewHolder holder;
            final Header header = getItem(position);
            final int headerType = getHeaderType(header);
            View view = null;

            if (convertView == null) {
                holder = new HeaderViewHolder();
                switch (headerType) {
                    case HEADER_TYPE_CATEGORY:
                        view = new TextView(getContext(), null, android.R.attr.listSeparatorTextViewStyle);
                        holder.title = (TextView) view;
                        break;

                    case HEADER_TYPE_NORMAL:
                        view = mInflater.inflate(R.layout.preference_header_item, parent, false);
                        holder.title = (TextView) view.findViewById(R.id.plug_pref_title);
                        holder.summary = (TextView) view.findViewById(R.id.plug_pref_summary);
                        break;
                }
                view.setTag(holder);
            } else {
                view = convertView;
                holder = (HeaderViewHolder) view.getTag();
            }

            // All view fields must be updated every time, because the view may be recycled
            switch (headerType) {
                case HEADER_TYPE_CATEGORY:
                    holder.title.setText(header.getTitle(getContext().getResources()));
                    break;
                case HEADER_TYPE_NORMAL:
                    holder.title.setText(header.getTitle(getContext().getResources()));
                    final CharSequence summary = header.getSummary(getContext().getResources());
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
