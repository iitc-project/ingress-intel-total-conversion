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
    private static final double SENSOR_DELAY_USER = 100*1e6;
    private boolean mLocationEnabled = false;
    private boolean mSensorEnabled = true;
    private long mLastUpdate = 0;
    private IITC_Mobile mIitc;
    private Location mLastLocation = null;
    private LocationManager mLocationManager;
    private boolean mRegistered = false;
    private boolean mRunning = false;
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

    private void registerListeners() {
        if (mRegistered) return;
        mRegistered = true;

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

        if (mSensorAccelerometer != null && mSensorMagnetometer != null && mSensorEnabled) {
            mSensorManager.registerListener(this, mSensorAccelerometer, SensorManager.SENSOR_DELAY_NORMAL);
            mSensorManager.registerListener(this, mSensorMagnetometer, SensorManager.SENSOR_DELAY_NORMAL);
        }
    }

    private void unregisterListeners() {
        if (!mRegistered) return;
        mRegistered = false;

        mLocationManager.removeUpdates(this);

        if (mSensorAccelerometer != null && mSensorMagnetometer != null && mSensorEnabled) {
            mSensorManager.unregisterListener(this, mSensorAccelerometer);
            mSensorManager.unregisterListener(this, mSensorMagnetometer);
        }

    }

    private void updateListeners() {
        if (mRunning && mLocationEnabled)
            registerListeners();
        else
            unregisterListeners();
    }

    public boolean hasCurrentLocation() {
        if (!mRegistered) return false;
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
    }

    public void onStop() {
        mRunning = false;
        updateListeners();
    }

    public void setLocationEnabled(boolean enabled) {
        if (enabled == mLocationEnabled) return;

        mLocationEnabled = enabled;
        updateListeners();
    }

    public void setSensorEnabled(boolean enabled) {
        if (enabled == mSensorEnabled) return;

        mSensorEnabled = enabled;
        updateListeners();
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
        // save some battery 10 updates per second should be enough
        if ((event.timestamp - mLastUpdate) < SENSOR_DELAY_USER) return;
        mLastUpdate = event.timestamp;

        if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER)
            mValuesGravity = event.values;
        if (event.sensor.getType() == Sensor.TYPE_MAGNETIC_FIELD)
            mValuesGeomagnetic = event.values;

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