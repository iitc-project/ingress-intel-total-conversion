package com.cradle.iitc_mobile;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.AssetManager;
import android.net.Uri;
import android.os.Environment;
import android.preference.PreferenceManager;
import android.util.Base64;
import android.util.Base64OutputStream;
import android.webkit.WebResourceResponse;
import android.widget.Toast;

import com.cradle.iitc_mobile.IITC_Mobile.ResponseHandler;

import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.PipedInputStream;
import java.io.PipedOutputStream;
import java.net.URL;
import java.net.URLEncoder;
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

    private WebResourceResponse getFileRequest(Uri uri) {
        return new FileRequest(uri);
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

    public String getFileRequestPrefix() {
        return "//file-request" + DOMAIN + "/";
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
        if ("file-request".equals(host))
            return getFileRequest(uri);

        Log.e("could not generate response for url: " + uri);
        return EMPTY;
    }

    private class FileRequest extends WebResourceResponse implements ResponseHandler {
        private PipedOutputStream mStreamOut;
        private String mFunctionName;

        private FileRequest(Uri uri) {
            super("application/x-javascript", "UTF-8", new PipedInputStream());

            try {
                mStreamOut = new PipedOutputStream((PipedInputStream) getData());
            } catch (IOException e) {
                Log.w(e);
            }

            mFunctionName = uri.getPathSegments().get(0);

            final Intent target = new Intent(Intent.ACTION_GET_CONTENT);
            target.setType("file/*");
            target.addCategory(Intent.CATEGORY_OPENABLE);

            // Create the chooser Intent
            Intent intent = Intent.createChooser(target, "Choose file");
            try {
                mIitc.startActivityForResult(intent, this);
            } catch (ActivityNotFoundException e) {
                Toast.makeText(mIitc, "No activity to select a file found." +
                        "Please install a file browser of your choice!", Toast.LENGTH_LONG).show();
            }
        }

        @Override
        public void onActivityResult(int resultCode, Intent data) {
            mIitc.deleteResponseHandler(this); // to enable garbage collection

            try {
                if (resultCode == Activity.RESULT_OK && data != null) {
                    Uri uri = data.getData();
                    File file = new File(uri.getPath());

                    mStreamOut.write(
                            (mFunctionName + "('" + URLEncoder.encode(file.getName(), "UTF-8") + "', '").getBytes());

                    Base64OutputStream encoder =
                            new Base64OutputStream(mStreamOut, Base64.NO_CLOSE | Base64.NO_WRAP | Base64.DEFAULT);

                    FileInputStream fileinput = new FileInputStream(file);
                    int c;
                    while ((c = fileinput.read()) != -1)
                    {
                        encoder.write(c);
                    }

                    encoder.close();
                    mStreamOut.write("');".getBytes());
                }

                mStreamOut.close();
            } catch (IOException e) {
                Log.w(e);

                // try to close stream, but ignore errors
                try {
                    mStreamOut.close();
                } catch (IOException e1) {
                }
            }
        }
    }
}
