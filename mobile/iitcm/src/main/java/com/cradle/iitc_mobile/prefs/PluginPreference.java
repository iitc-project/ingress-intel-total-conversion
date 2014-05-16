package com.cradle.iitc_mobile.prefs;

import android.content.Context;
import android.preference.CheckBoxPreference;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

// multiline checkbox preference
public class PluginPreference extends CheckBoxPreference {

    public PluginPreference(Context context) {
        super(context);
    }

    protected void onBindView(View view) {
        super.onBindView(view);
        makeMultiline(view);
    }

    protected void makeMultiline(View view) {
        if (view instanceof ViewGroup) {
            ViewGroup grp = (ViewGroup) view;
            for (int index = 0; index < grp.getChildCount(); index++) {
                makeMultiline(grp.getChildAt(index));
            }
        } else if (view instanceof TextView) {
            TextView t = (TextView) view;
            t.setSingleLine(false);
            t.setEllipsize(null);
        }
    }

}
