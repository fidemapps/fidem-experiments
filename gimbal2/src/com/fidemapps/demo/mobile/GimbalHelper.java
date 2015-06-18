package com.fidemapps.demo.mobile;

import android.util.Log;
import com.gimbal.android.BeaconManager;
import com.gimbal.android.Gimbal;

/**
 * Created by cgu on 15-06-17.
 */
public class GimbalHelper {
    private MyApplication mApplication;
    private static volatile GimbalHelper mInstance;
    private boolean mIsInitialized;
    private boolean mIsGimbalServiceRunning;
    private boolean mHasOptions;
    private BeaconManager mBeaconManager;
    private GimbalBeaconListener mGimbalBeaconListener;
    private static final String TAG = GimbalHelper.class.getSimpleName();


    private GimbalHelper() {
        mApplication = null;
        mIsInitialized = false;
        mIsGimbalServiceRunning = false;

    }

    public static GimbalHelper getInstance() {
        if (mInstance == null) {
            synchronized (GimbalHelper.class) {
                if (mInstance == null) {
                    mInstance = new GimbalHelper();
                }
            }
        }

        return mInstance;
    }

    public boolean getIsGimbalServiceRunning() {
        return mIsGimbalServiceRunning;
    }


    public void setIsGimbalServiceRunning(boolean isGimbalServiceRunning) {
        mIsGimbalServiceRunning = isGimbalServiceRunning;
    }

    public void startGimbalService() {
        if (!getIsGimbalServiceRunning()) {
            Log.i(TAG, "Starting the Gimbal Service.");

            if (mApplication == null) {
                throw new IllegalArgumentException("mApplication cannot be null. Did you set the application reference using setApplication()?");
            }

            if (!mIsInitialized) {
                initialize();
                if (mGimbalBeaconListener == null) {
                    mGimbalBeaconListener = new GimbalBeaconListener();
                }

                getBeaconManager().addListener(mGimbalBeaconListener);
                getBeaconManager().startListening();
                Log.d(TAG, "Beacon Manager start listening");
            }
        } else {
            Log.d(TAG, "Cannot start service as it's already running.");
        }
    }

    public void stopGimbalService() {
        if (mIsGimbalServiceRunning) {
            Log.d(TAG, "Stopping the Gimbal Service.");

            mGimbalBeaconListener = null;
            getBeaconManager().stopListening();
            getBeaconManager().removeListener(mGimbalBeaconListener);

            mBeaconManager = null;
        } else {
            Log.d(TAG, "Cannot stop service as it isn't currently running.");
        }
    }

    private void initialize() {
        if (mApplication == null) {
            throw new IllegalArgumentException("mApplication cannot be null. Did you properly set the application reference?");
        } else if (!mIsInitialized) {
            Gimbal.setApiKey(mApplication, "0c2a6d3c-7377-457b-ae77-4b6ccd22b068");
            mIsInitialized = true;
            Log.d(TAG, "Initialize Gimbal Service");
        } else {
            Log.d(TAG, "Cannot initialize as Gimbal Service is already running.");
        }
    }

    public BeaconManager getBeaconManager() {
        if (mBeaconManager == null) {
            mBeaconManager = new BeaconManager();
        }

        return mBeaconManager;
    }

    public MyApplication getApplication() {
        return mApplication;
    }

    public void setApplication(MyApplication application) {
        mApplication = application;
    }

}
