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
    float[] mValuesGravity = null, mValuesGeomagnetic = null;

    public IITC_UserLocation(IITC_Mobile iitc) {
        mIitc = iitc;

        // Acquire a reference to the Location Manager and Sensor Manager
        mLocationManager = (LocationManager) iitc.getSystemService(Context.LOCATION_SERVICE);
        mSensorManager = (SensorManager) iitc.getSystemService(Context.SENSOR_SERVICE);
        mSensorAccelerometer = mSensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        mSensorMagnetometer = mSensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD);
    }

    private void updateListeners() {
        boolean useLocation = mRunning && mMode != 0;
        boolean useOrientation = mRunning && mMode == 2;

        if (useLocation && !mLocationRegistered) {
            try {
                mLocationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 0, 0, this);
            } catch (IllegalArgumentException e) {
                // if the given provider doesn't exist
                e.printStackTrace();
            }
            try {
                mLocationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 0, 0, this);
            } catch (IllegalArgumentException e) {
                // if the given provider doesn't exist
                e.printStackTrace();
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

    public void locate() {
        // do not touch the javascript while iitc boots
        if (mIitc.isLoading()) return;

        Location location = mLastLocation;
        if (location == null) return;

        mIitc.getWebView().loadJS("if(window.plugin && window.plugin.userLocation)"
                + "window.plugin.userLocation.locate("
                + location.getLatitude() + ", " + location.getLongitude() + ", " + location.getAccuracy() + ");");
    }

    public void onStart() {
        mRunning = true;
        updateListeners();

        // in case we just switched from loc+sensor to loc-only, let javascript know
        if (mMode == 1) {
            mIitc.getWebView().loadJS("if(window.plugin && window.plugin.userLocation)"
                    + "window.plugin.userLocation.onOrientationChange(null);");
        }
    }

    public void onStop() {
        mRunning = false;
        updateListeners();
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
        mLastLocation = location;

        // throw away all positions with accuracy > 100 meters should avoid gps glitches
        if (location.getAccuracy() > 100) return;

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

        mIitc.getWebView().loadJS("if(window.plugin && window.plugin.userLocation)"
                + "window.plugin.userLocation.onOrientationChange(" + direction + ");");
    }

    // </interface SensorEventListener>
}