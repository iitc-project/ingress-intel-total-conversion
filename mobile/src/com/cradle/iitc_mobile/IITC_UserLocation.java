package com.cradle.iitc_mobile;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.view.Surface;

public class IITC_UserLocation implements LocationListener, SensorEventListener {
    private static final double SENSOR_DELAY_USER = 100 * 1e6; // 100 milliseconds
    private int mMode = 0;
    private boolean mRunning = false;
    private boolean mLocationRegistered = false;
    private boolean mOrientationRegistered = false;
    private long mLastUpdate = 0;
    private IITC_Mobile mIitc;
    private Location mLastLocation = null;
    private LocationManager mLocationManager;
    private Sensor mSensorAccelerometer, mSensorMagnetometer;
    private SensorManager mSensorManager = null;
    private float[] mValuesGravity = null, mValuesGeomagnetic = null;
    private double mOrientation = 0;
    private boolean mFollowing = false;

    public IITC_UserLocation(IITC_Mobile iitc) {
        mIitc = iitc;

        // Acquire a reference to the Location Manager and Sensor Manager
        mLocationManager = (LocationManager) iitc.getSystemService(Context.LOCATION_SERVICE);
        mSensorManager = (SensorManager) iitc.getSystemService(Context.SENSOR_SERVICE);
        mSensorAccelerometer = mSensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        mSensorMagnetometer = mSensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD);
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
        } else {
            mOrientation = 0;
        }

        mIitc.getWebView().loadJS("if(window.plugin && window.plugin.userLocation)"
                + "window.plugin.userLocation.onOrientationChange(" + String.valueOf(orientation) + ");");
    }

    private void updateListeners() {
        boolean useLocation = mRunning && mMode != 0;
        boolean useOrientation = mRunning && mMode == 2;

        if (useLocation && !mLocationRegistered) {
            try {
                mLocationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 0, 0, this);
            } catch (IllegalArgumentException e) {
                // if the given provider doesn't exist
                Log.w(e);
            }
            try {
                mLocationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 0, 0, this);
            } catch (IllegalArgumentException e) {
                // if the given provider doesn't exist
                Log.w(e);
            }
            mLocationRegistered = true;
        }
        if (!useLocation && mLocationRegistered) {
            mLocationManager.removeUpdates(this);
            mLocationRegistered = false;
        }

        if (useOrientation && !mOrientationRegistered && mSensorAccelerometer != null && mSensorMagnetometer != null) {
            mSensorManager.registerListener(this, mSensorAccelerometer, SensorManager.SENSOR_DELAY_NORMAL);
            mSensorManager.registerListener(this, mSensorMagnetometer, SensorManager.SENSOR_DELAY_NORMAL);
            mOrientationRegistered = true;
        }
        if (!useOrientation && mOrientationRegistered && mSensorAccelerometer != null && mSensorMagnetometer != null) {
            mSensorManager.unregisterListener(this, mSensorAccelerometer);
            mSensorManager.unregisterListener(this, mSensorMagnetometer);
            mOrientationRegistered = false;
        }
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

        Location location = mLastLocation;
        if (location == null) return;

        mIitc.getWebView().loadJS("if(window.plugin && window.plugin.userLocation)"
                + "window.plugin.userLocation.locate("
                + location.getLatitude() + ", " + location.getLongitude() + ", "
                + location.getAccuracy() + ", " + persistentZoom + ");");
    }

    public void onStart() {
        mRunning = true;
        updateListeners();

        // in case we just switched from loc+sensor to loc-only, let javascript know
        if (mMode == 1) {
            setOrientation(null);
        }
    }

    public void onStop() {
        mRunning = false;
        updateListeners();
    }

    public void reset() {
        setFollowMode(false);
    }

    public void setFollowMode(boolean follow) {
        mFollowing = follow;
        mIitc.invalidateOptionsMenu();
    }

    private static final int TWO_MINUTES = 1000 * 60 * 2;

    /**
      * Determines whether one Location reading is better than the current Location fix
      * @param location  The new Location that you want to evaluate
      * @param currentBestLocation  The current Location fix, to which you want to compare the new one
      *
      * code copied from http://developer.android.com/guide/topics/location/strategies.html#BestEstimate
      */
    protected boolean isBetterLocation(Location location, Location currentBestLocation) {
        if (currentBestLocation == null) {
            // A new location is always better than no location
            return true;
        }

        // Check whether the new location fix is newer or older
        long timeDelta = location.getTime() - currentBestLocation.getTime();
        boolean isSignificantlyNewer = timeDelta > TWO_MINUTES;
        boolean isSignificantlyOlder = timeDelta < -TWO_MINUTES;
        boolean isNewer = timeDelta > 0;

        // If it's been more than two minutes since the current location, use the new location
        // because the user has likely moved
        if (isSignificantlyNewer) {
            return true;
        // If the new location is more than two minutes older, it must be worse
        } else if (isSignificantlyOlder) {
            return false;
        }

        // Check whether the new location fix is more or less accurate
        int accuracyDelta = (int) (location.getAccuracy() - currentBestLocation.getAccuracy());
        boolean isLessAccurate = accuracyDelta > 0;
        boolean isMoreAccurate = accuracyDelta < 0;
        boolean isSignificantlyLessAccurate = accuracyDelta > 100;

        // Check if the old and new location are from the same provider
        boolean isFromSameProvider = isSameProvider(location.getProvider(),
                currentBestLocation.getProvider());

        // Determine location quality using a combination of timeliness and accuracy
        if (isMoreAccurate) {
            return true;
        } else if (isNewer && !isLessAccurate) {
            return true;
        } else if (isNewer && !isSignificantlyLessAccurate && isFromSameProvider) {
            return true;
        }
        return false;
    }

    // Checks whether two providers are the same
    private boolean isSameProvider(String provider1, String provider2) {
        if (provider1 == null) {
          return provider2 == null;
        }
        return provider1.equals(provider2);
    }

    /**
     * set the location mode to use. Available modes:
     * 0: don't show user's position
     * 1: show user's position
     * 2: show user's position and orientation
     * 
     * @return whether a reload is needed to reflect the changes made to the preferences
     */
    public boolean setLocationMode(int mode) {
        boolean needsReload = (mode == 0 && mMode != 0) || (mode != 0 && mMode == 0);
        mMode = mode;

        return needsReload;
    }

    // ------------------------------------------------------------------------

    // <interface LocationListener>

    @Override
    public void onLocationChanged(Location location) {
        if (!isBetterLocation(location, mLastLocation)) return;

        mLastLocation = location;

        // do not touch the javascript while iitc boots
        if (mIitc.isLoading()) return;

        mIitc.getWebView().loadJS("if(window.plugin && window.plugin.userLocation)"
                + "window.plugin.userLocation.onLocationChange("
                + location.getLatitude() + ", " + location.getLongitude() + ");");
    }

    @Override
    public void onProviderDisabled(String provider) {
    }

    @Override
    public void onProviderEnabled(String provider) {
    }

    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {

    }

    // </interface LocationListener>

    // ------------------------------------------------------------------------

    // <interface SensorEventListener>

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER)
            mValuesGravity = event.values;
        if (event.sensor.getType() == Sensor.TYPE_MAGNETIC_FIELD)
            mValuesGeomagnetic = event.values;

        // save some battery, 10 updates per second should be enough
        if ((event.timestamp - mLastUpdate) < SENSOR_DELAY_USER) return;
        mLastUpdate = event.timestamp;

        // do not touch the javascript while iitc boots
        if (mIitc.isLoading()) return;

        // wait until both sensors have given us an event
        if (mValuesGravity == null || mValuesGeomagnetic == null) return;

        float R[] = new float[9];
        float I[] = new float[9];
        float orientation[] = new float[3];

        if (!SensorManager.getRotationMatrix(R, I, mValuesGravity, mValuesGeomagnetic)) return;
        SensorManager.getOrientation(R, orientation);

        double direction = orientation[0] / Math.PI * 180;

        int rotation = mIitc.getWindowManager().getDefaultDisplay().getRotation();
        switch (rotation) {
            case Surface.ROTATION_90:
                direction += 90;
                break;
            case Surface.ROTATION_180:
                direction += 180;
                break;
            case Surface.ROTATION_270:
                direction += 270;
                break;
        }

        setOrientation(direction);
    }

    // </interface SensorEventListener>
}