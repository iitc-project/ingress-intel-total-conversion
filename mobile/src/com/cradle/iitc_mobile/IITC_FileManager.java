package com.cradle.iitc_mobile;

import android.content.SharedPreferences;
import android.content.res.AssetManager;
import android.net.Uri;
import android.os.Environment;
import android.preference.PreferenceManager;
import android.webkit.WebResourceResponse;

import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.util.HashMap;

public class IITC_FileManager {
    private static final WebResourceResponse EMPTY =
            new WebResourceResponse("text/plain", "UTF-8", new ByteArrayInputStream("".getBytes()));
    private static final String WRAPPER_NEW = "wrapper(info);";
    private static final String WRAPPER_OLD =
            "script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));\n"
                    + "(document.body || document.head || document.documentElement).appendChild(script);";

    public static final String DOMAIN = ".iitcm.localhost";

    public static HashMap<String, String> getScriptInfo(String js) {
        HashMap<String, String> map = new HashMap<String, String>();
        String header = "";
        if (js != null) {
            header = js.substring(js.indexOf("==UserScript=="),
                    js.indexOf("==/UserScript=="));
        }
        // remove new line comments
        header = header.replace("\n//", " ");
        // get a list of key-value
        String[] attributes = header.split("  +");
        // add default values
        map.put("version", "not found");
        map.put("name", "unknown");
        map.put("description", "");
        map.put("category", "Misc");
        // add parsed values
        for (int i = 0; i < attributes.length; i++) {
            // search for attributes and use the value
            if (attributes[i].equals("@version")) {
                map.put("version", attributes[i + 1]);
            }
            if (attributes[i].equals("@name")) {
                map.put("name", attributes[i + 1]);
            }
            if (attributes[i].equals("@description")) {
                map.put("description", attributes[i + 1]);
            }
            if (attributes[i].equals("@category")) {
                map.put("category", attributes[i + 1]);
            }
        }
        return map;
    }

    private AssetManager mAssetManager;
    private IITC_Mobile mIitc;
    private String mIitcPath;

    private SharedPreferences mPrefs;

    public IITC_FileManager(IITC_Mobile iitc) {
        mIitc = iitc;
        mIitcPath = Environment.getExternalStorageDirectory().getPath() + "/IITC_Mobile/";
        mPrefs = PreferenceManager.getDefaultSharedPreferences(iitc);
        mAssetManager = mIitc.getAssets();
    }

    private InputStream getAssetFile(String filename) throws IOException {
        if (mPrefs.getBoolean("pref_dev_checkbox", false)) {
            File file = new File(mIitcPath + "dev/" + filename);
            try {
                return new FileInputStream(file);
            } catch (FileNotFoundException e) {
                Log.w(e);
            }
        }

        String source = mPrefs.getString("pref_iitc_source", "local");
        if (!source.equals("local")) {
            // load iitc script from web or asset folder
            if (source.contains("http")) {
                try {
                    URL context = new URL(source);
                    URL url = new URL(context, filename);
                    return url.openStream();
                } catch (IOException e) {
                    Log.w(e);
                }
            } else {
                File file = new File(source + File.separatorChar + filename);
                try {
                    return new FileInputStream(file);
                } catch (FileNotFoundException e) {
                    Log.w(e);
                }
            }
        }

        // load plugins from asset folder
        return mAssetManager.open(filename);
    }

    private WebResourceResponse getScript(Uri uri) {
        InputStream stream;
        try {
            stream = getAssetFile(uri.getPath().substring(1));
        } catch (IOException e) {
            Log.w(e);
            return EMPTY;
        }

        InputStream data = prepareUserScript(stream);

        return new WebResourceResponse("application/x-javascript", "UTF-8", data);
    }

    private HashMap<String, String> getScriptInfo(InputStream stream) {
        return getScriptInfo(readStream(stream));
    }

    private WebResourceResponse getUserPlugin(Uri uri) {
        if (!mPrefs.getBoolean(uri.getPath(), false)) {
            Log.e("Attempted to inject user script that is not enabled by user: " + uri.getPath());
            return EMPTY;
        }

        InputStream stream;
        try {
            stream = new FileInputStream(new File(uri.getPath()));
        } catch (IOException e) {
            Log.w(e);
            return EMPTY;
        }

        InputStream data = prepareUserScript(stream);

        return new WebResourceResponse("application/x-javascript", "UTF-8", data);
    }

    private InputStream prepareUserScript(InputStream stream) {
        String content = readStream(stream);
        HashMap<String, String> info = getScriptInfo(content);

        JSONObject jObject = new JSONObject(info);
        String gmInfo = "var GM_info={\"script\":" + jObject.toString() + "}";

        content = content.replace(WRAPPER_OLD, WRAPPER_NEW);

        return new ByteArrayInputStream((gmInfo + content).getBytes());
    }

    private String readStream(InputStream stream) {
        ByteArrayOutputStream os = new ByteArrayOutputStream();
        byte[] buffer = new byte[4096];

        try {
            while (true) {
                int read = stream.read(buffer);
                if (read == -1)
                    break;
                os.write(buffer, 0, read);
            }
        } catch (IOException e) {
            Log.w(e);
            return "";
        }
        return os.toString();
    }

    public String getIITCVersion() throws IOException {
        InputStream stream = getAssetFile("total-conversion-build.user.js");

        return getScriptInfo(stream).get("version");
    }

    public WebResourceResponse getResponse(Uri uri) {
        String host = uri.getHost();
        if (!host.endsWith(DOMAIN))
            return EMPTY;

        host = host.substring(0, host.length() - DOMAIN.length());

        if ("script".equals(host))
            return getScript(uri);
        if ("user-plugin".equals(host))
            return getUserPlugin(uri);

        Log.e("could not generate response for url: " + uri);
        return EMPTY;
    }
}
