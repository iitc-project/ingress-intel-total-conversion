package com.cradle.iitc_mobile.share;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.ResolveInfo;

import com.cradle.iitc_mobile.Log;

import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.Serializable;
import java.util.Comparator;
import java.util.HashMap;

public class IntentComparator implements Comparator<Intent> {
    private static final String INTENT_MAP_FILE = "share_intent_map";

    private final ShareActivity mActivity;

    private HashMap<Component, Integer> mIntentMap = new HashMap<Component, Integer>();

    IntentComparator(final ShareActivity activity) {
        mActivity = activity;
        load();
    }

    @SuppressWarnings("unchecked")
    private void load() {
        ObjectInputStream objectIn = null;

        try {
            final FileInputStream fileIn = mActivity.openFileInput(INTENT_MAP_FILE);
            objectIn = new ObjectInputStream(fileIn);
            mIntentMap = (HashMap<Component, Integer>) objectIn.readObject();
        } catch (final FileNotFoundException e) {
            // Do nothing
        } catch (final IOException e) {
            Log.w(e);
        } catch (final ClassNotFoundException e) {
            Log.w(e);
        } finally {
            if (objectIn != null) {
                try {
                    objectIn.close();
                } catch (final IOException e) {
                    Log.w(e);
                }
            }
        }
    }

    @Override
    public int compare(final Intent lhs, final Intent rhs) {
        int order;

        // we might be merging multiple intents, so there could be more than one default
        if (IntentGenerator.isDefault(lhs) && !IntentGenerator.isDefault(rhs))
            return -1;
        if (IntentGenerator.isDefault(rhs) && !IntentGenerator.isDefault(lhs))
            return 1;

        final ComponentName lComponent = lhs.getComponent();
        final ComponentName rComponent = rhs.getComponent();

        // Show more frequently used items in top
        Integer lCount = mIntentMap.get(new Component(lComponent));
        Integer rCount = mIntentMap.get(new Component(rComponent));

        if (lCount == null) lCount = 0;
        if (rCount == null) rCount = 0;

        if (lCount > rCount) return -1;
        if (lCount < rCount) return 1;

        // still no order. fall back to alphabetical order
        try {
            order = IntentGenerator.getTitle(lhs).compareTo(IntentGenerator.getTitle(rhs));
            if (order != 0) return order;
        } catch(IllegalArgumentException e) {
            Log.w(e);
        }
        order = lComponent.getPackageName().compareTo(rComponent.getPackageName());
        if (order != 0) return order;

        order = lComponent.getClassName().compareTo(rComponent.getClassName());
        if (order != 0) return order;

        return 0;
    }

    public void save() {
        ObjectOutputStream objectOut = null;
        try {
            final FileOutputStream fileOut = mActivity.openFileOutput(INTENT_MAP_FILE, Activity.MODE_PRIVATE);
            objectOut = new ObjectOutputStream(fileOut);
            objectOut.writeObject(mIntentMap);
            fileOut.getFD().sync();
        } catch (final IOException e) {
            Log.w(e);
        } finally {
            if (objectOut != null) {
                try {
                    objectOut.close();
                } catch (final IOException e) {
                    Log.w(e);
                }
            }
        }
    }

    public void trackIntentSelection(final Intent intent) {
        final Component component = new Component(intent.getComponent());

        Integer counter = mIntentMap.get(component);
        if (counter == null) {
            counter = 1;
        } else {
            counter++;
        }

        mIntentMap.put(component, counter);
    }

    public static class Component implements Serializable {
        private static final long serialVersionUID = -5043782754318376792L;

        public String name;
        public String packageName;

        public Component() {
            name = null;
            packageName = null;
        }

        public Component(final ComponentName cn) {
            name = cn.getClassName();
            packageName = cn.getPackageName();
        }

        public Component(final ResolveInfo info) {
            name = info.activityInfo.name;
            packageName = info.activityInfo.applicationInfo.packageName;
        }

        @Override
        public boolean equals(final Object o) {
            if (this == o) return true;

            if (o == null) return false;
            if (o.getClass() != this.getClass()) return false;

            final Component c = (Component) o;

            if (name == null) {
                if (c.name != null) return false;
            } else {
                if (!name.equals(c.name)) return false;
            }

            if (name == null) {
                if (c.name != null) return false;
            } else {
                if (!name.equals(c.name)) return false;
            }

            if (packageName == null) {
                if (c.packageName != null) return false;
            } else {
                if (!packageName.equals(c.packageName)) return false;
            }

            return true;
        }

        @Override
        public int hashCode() {
            int hc = 2;
            final int hashMultiplier = 7;

            hc += (name == null) ? 0 : name.hashCode();
            hc *= hashMultiplier;
            hc += (packageName == null) ? 0 : packageName.hashCode();

            return hc;
        }

        @Override
        public String toString() {
            return packageName + "/" +
                    (name.startsWith(packageName + ".")
                            ? name.substring(packageName.length())
                            : name);
        }
    }
}