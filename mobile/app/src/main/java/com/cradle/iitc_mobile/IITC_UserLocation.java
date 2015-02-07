package com.cradle.iitc_mobile;

import android.content.Context;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.view.Surface;

import com.cradle.iitc_mobile.compass.Compass;
import com.cradle.iitc_mobile.compass.CompassListener;

public class IITC_UserLocation implements CompassListener, LocationListener {
    private static final int TWO_MINUTES = 1000 * 60 * 2;

    private final Compass mCompass;
    private boolean mFollowing = false;
    private final IITC_Mobile mIitc;
    private Location mLastLocation = null;
    private final LocationManager mLocationManager;
    private boolean mLocationRegistered = false;
    private int mMode = 0;
    private double mOrientation = 0;
    private boolean mOrientationRegistered = false;
    private boolean mRunning = false;

    public IITC_UserLocation(final IITC_Mobile iitc) {
        mIitc = iitc;

        mCompass = Compass.getDefaultCompass(mIitc);

        // Acquire a reference to the Location Manager and Sensor Manager
        mLocationManager = (LocationManager) iitc.getSystemService(Context.LOCATION_SERVICE);
    }

    // Checks whether two providers are the same
    private boolean isSameProvider(final String provider1, final String provider2) {
        if (provider1 == null) { return provider2 == null; }
        return provider1.equals(provider2);
    }

    private void setOrientation(Double orientation) {
        // we have a transition defined for the rotation
        // changes to the orientation should always be less than 180°

        if (orientation != null) {
            while (orientation < mOrientation - 180)
                orientation += 360;
            while (orientation > mOrientation + 180)
                orientation -= 360;
            mOrientation = orientation;
        }

        mIitc.getWebView().loadJS("if(window.plugin && window.plugin.userLocation)"
                + "window.plugin.userLocation.onOrientationChange(" + String.valueOf(orientation) + ");");
    }

    private void updateListeners() {
        final boolean useLocation = mRunning && mMode != 0 && !mIitc.isLoading();
        final boolean useOrientation = useLocation && mMode == 2;

        if (useLocation && !mLocationRegistered) {
            try {
                mLocationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 0, 0, this);
            } catch (final IllegalArgumentException e) {
                // if the given provider doesn't exist
                Log.w(e);
            }
            try {
                mLocationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 0, 0, this);
            } catch (final IllegalArgumentException e) {
                // if the given provider doesn't exist
                Log.w(e);
            }
            mLocationRegistered = true;
        }
        if (!useLocation && mLocationRegistered) {
            mLocationManager.removeUpdates(this);
            mLocationRegistered = false;
        }

        if (useOrientation && !mOrientationRegistered) {
            mCompass.registerListener(this);
            mOrientationRegistered = true;
        }
        if (!useOrientation && mOrientationRegistered) {
            mCompass.unregisterListener(this);
            mOrientationRegistered = false;
        }
    }

    /**
     * Determines whether one Location reading is better than the current Location fix
     *
     * @param location
     *            The new Location that you want to evaluate
     * @param currentBestLocation
     *            The current Location fix, to which you want to compare the new one
     *
     *            code copied from http://developer.android.com/guide/topics/location/strategies.html#BestEstimate
     */
    protected boolean isBetterLocation(final Location location, final Location currentBestLocation) {
        if (currentBestLocation == null) {
            // A new location is always better than no location
            return true;
        }

        // Check whether the new location fix is newer or older
        final long timeDelta = location.getTime() - currentBestLocation.getTime();
        final boolean isSignificantlyNewer = timeDelta > TWO_MINUTES;
        final boolean isSignificantlyOlder = timeDelta < -TWO_MINUTES;
        final boolean isNewer = timeDelta > 0;

        // If it's been more than two minutes since the current location, use the new location
        // because the user has likely moved
        if (isSignificantlyNewer) {
            return true;
            // If the new location is more than two minutes older, it must be worse
        } else if (isSignificantlyOlder) { return false; }

        // Check whether the new location fix is more or less accurate
        final int accuracyDelta = (int) (location.getAccuracy() - currentBestLocation.getAccuracy());
        final boolean isLessAccurate = accuracyDelta > 0;
        final boolean isMoreAccurate = accuracyDelta < 0;
        final boolean isSignificantlyLessAccurate = accuracyDelta > 100;

        // Check if the old and new location are from the same provider
        final boolean isFromSameProvider = isSameProvider(location.getProvider(),
                currentBestLocation.getProvider());

        // Determine location quality using a combination of timeliness and accuracy
        if (isMoreAccurate) {
            return true;
        } else if (isNewer && !isLessAccurate) {
            return true;
        } else if (isNewer && !isSignificantlyLessAccurate && isFromSameProvider) { return true; }
        return false;
    }

    public boolean hasCurrentLocation() {
        if (!mLocationRegistered) return false;
        return mLastLocation != null;
    }

    public boolean isFollowing() {
        return mFollowing;
    }

    public void locate(final boolean persistentZoom) {
        // do not touch the javascript while iitc boots
        if (mIitc.isLoading()) return;

        final Location location = mLastLocation;
        if (location == null) return;

        mIitc.getWebView().loadJS("if(window.plugin && window.plugin.userLocation)"
                + "window.plugin.userLocation.locate("
                + location.getLatitude() + ", " + location.getLongitude() + ", "
                + location.getAccuracy() + ", " + persistentZoom + ");");
    }

    @Override
    public void onCompassChanged(final float x, final float y, final float z) {
        double orientation = Math.toDegrees(x);

        final int rotation = mIitc.getWindowManager().getDefaultDisplay().getRotation();
        switch (rotation) {
            case Surface.ROTATION_90:
                orientation += 90;
                break;
            case Surface.ROTATION_180:
                orientation += 180;
                break;
            case Surface.ROTATION_270:
                orientation += 270;
                break;
        }

        setOrientation(orientation);
    }

    public void onLoadingStateChanged() {
        updateListeners();
    }

    @Override
    public void onLocationChanged(final Location location) {
        if (!isBetterLocation(location, mLastLocation)) return;

        mLastLocation = location;

        // do not touch the javascript while iitc boots
        if (mIitc.isLoading()) return;

        mIitc.getWebView().loadJS("if(window.plugin && window.plugin.userLocation)"
                + "window.plugin.userLocation.onLocationChange("
                + location.getLatitude() + ", " + location.getLongitude() + ");");
    }

    @Override
    public void onProviderDisabled(final String provider) {
    }

    @Override
    public void onProviderEnabled(final String provider) {
    }

    public void onStart() {
        mRunning = true;
        updateListeners();

        // in case we just switched from loc+sensor to loc-only, let javascript know
        if (mMode == 1) {
            setOrientation(null);
        }
    }

    @Override
    public void onStatusChanged(final String provider, final int status, final Bundle extras) {

    }

    public void onStop() {
        mRunning = false;
        updateListeners();
    }

    public void reset() {
        setFollowMode(false);
    }

    public void setFollowMode(final boolean follow) {
        mFollowing = follow;
        mIitc.invalidateOptionsMenu();
    }

    /**
     * set the location mode to use. Available modes:
     * 0: don't show user's position
     * 1: show user's position
     * 2: show user's position and orientation
     *
     * @return whether a reload is needed to reflect the changes made to the preferences
     */
    public boolean setLocationMode(final int mode) {
        final boolean needsReload = (mode == 0 && mMode != 0) || (mode != 0 && mMode == 0);
        mMode = mode;

        return needsReload;
    }
}