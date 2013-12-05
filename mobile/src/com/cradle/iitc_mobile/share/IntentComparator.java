package com.cradle.iitc_mobile.share;

import android.app.Activity;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;

import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.Serializable;
import java.util.Comparator;
import java.util.HashMap;

public class IntentComparator implements Comparator<ResolveInfo> {
    public static class Component implements Serializable {
        private static final long serialVersionUID = -5043782754318376792L;

        public String name;
        public String packageName;

        public Component() {
            name = null;
            packageName = null;
        }

        public Component(ResolveInfo info) {
            name = info.activityInfo.name;
            packageName = info.activityInfo.applicationInfo.packageName;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;

            if (o == null) return false;
            if (o.getClass() != this.getClass()) return false;

            Component c = (Component) o;

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

    private static final String INTENT_MAP_FILE = "share_intent_map";

    private ShareActivity mActivity;
    private HashMap<Component, Integer> mIntentMap = new HashMap<Component, Integer>();
    private PackageManager mPackageManager;

    IntentComparator(ShareActivity activity) {
        mActivity = activity;
        mPackageManager = activity.getPackageManager();

        load();
    }

    @SuppressWarnings("unchecked")
    private void load() {
        ObjectInputStream objectIn = null;

        try {
            FileInputStream fileIn = mActivity.openFileInput(INTENT_MAP_FILE);
            objectIn = new ObjectInputStream(fileIn);
            mIntentMap = (HashMap<Component, Integer>) objectIn.readObject();
        } catch (FileNotFoundException e) {
            // Do nothing
        } catch (IOException e) {
            e.printStackTrace();
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        } finally {
            if (objectIn != null) {
                try {
                    objectIn.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }

    @Override
    public int compare(ResolveInfo lhs, ResolveInfo rhs) {
        int order;

        // we might be merging multiple intents, so there could be more than one default
        if (lhs.isDefault && !rhs.isDefault)
            return -1;
        if (rhs.isDefault && !lhs.isDefault)
            return 1;

        // Show more frequently used items in top
        Integer lCount = mIntentMap.get(new Component(lhs));
        Integer rCount = mIntentMap.get(new Component(rhs));

        if (lCount == null) lCount = 0;
        if (rCount == null) rCount = 0;

        if (lCount > rCount) return -1;
        if (lCount < rCount) return 1;

        // don't known how these are set (or if they can be set at all), but it sounds promising...
        if (lhs.preferredOrder != rhs.preferredOrder)
            return rhs.preferredOrder - lhs.preferredOrder;
        if (lhs.priority != rhs.priority)
            return rhs.priority - lhs.priority;

        // still no order. fall back to alphabetical order
        order = lhs.loadLabel(mPackageManager).toString().compareTo(
                rhs.loadLabel(mPackageManager).toString());
        if (order != 0) return order;

        if (lhs.nonLocalizedLabel != null && rhs.nonLocalizedLabel != null) {
            order = lhs.nonLocalizedLabel.toString().compareTo(rhs.nonLocalizedLabel.toString());
            if (order != 0) return order;
        }

        order = lhs.activityInfo.packageName.compareTo(rhs.activityInfo.packageName);
        if (order != 0) return order;

        order = lhs.activityInfo.name.compareTo(rhs.activityInfo.name);
        if (order != 0) return order;

        return 0;
    }

    public void save() {
        ObjectOutputStream objectOut = null;
        try {
            FileOutputStream fileOut = mActivity.openFileOutput(INTENT_MAP_FILE, Activity.MODE_PRIVATE);
            objectOut = new ObjectOutputStream(fileOut);
            objectOut.writeObject(mIntentMap);
            fileOut.getFD().sync();
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            if (objectOut != null) {
                try {
                    objectOut.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }

    public void trackIntentSelection(ResolveInfo info) {
        Component component = new Component(info);

        Integer counter = mIntentMap.get(component);
        if (counter == null) {
            counter = 1;
        } else {
            counter++;
        }

        mIntentMap.put(component, counter);
    }
}