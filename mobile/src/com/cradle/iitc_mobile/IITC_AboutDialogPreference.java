package com.cradle.iitc_mobile;

import android.content.Context;
import android.preference.Preference;
import android.text.Html;
import android.text.method.LinkMovementMethod;
import android.util.AttributeSet;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

public class IITC_AboutDialogPreference extends Preference {
    private String mBuildVersion = "";
    private String mIitcVersion = "";

    public IITC_AboutDialogPreference(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    @Override
    public View getView(View convertView, ViewGroup parent) {
        /*
         * I found no better way for clickable links in a TextView then using Html.fromHtml(). Linkify
         * is just broken and does not understand html href tags, so let's tag the @string/about_msg
         * with CDATA and use Html.fromHtml() for clickable hrefs with tags.
         */
        final TextView tv = new TextView(getContext());
        String text = getContext().getText(R.string.pref_about_text).toString();
        text = String.format(text, mBuildVersion, mIitcVersion);

        tv.setText(Html.fromHtml(text));
        tv.setMovementMethod(LinkMovementMethod.getInstance());

        return tv;
    }

    public void setVersions(String iitcVersion, String buildVersion) {
        mIitcVersion = iitcVersion;
        mBuildVersion = buildVersion;
    }
}
