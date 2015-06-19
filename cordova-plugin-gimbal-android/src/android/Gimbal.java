package com.fidemapps.demo.mobile;

import android.os.Build;
import android.util.Log;
import com.gimbal.android.BeaconEventListener;
import com.gimbal.android.BeaconManager;
import com.gimbal.android.BeaconSighting;
import com.gimbal.android.GimbalDebugger;
import org.apache.cordova.*;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class Gimbal extends CordovaPlugin {

    private boolean isServiceRunning = false;
    private boolean isInitialized = false;
    private BeaconManager beaconManager = null;
    private BeaconEventListener gimbalBeaconListener = null;
    private CallbackContext beaconFoundCallback = null;


    private static final String TAG = Gimbal.class.getSimpleName() + "-fidemapps";

    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);
        Log.d(TAG, "CODENAME: " + Build.VERSION.CODENAME);
        Log.d(TAG, "INCREMENTAL: " + Build.VERSION.INCREMENTAL);
        Log.d(TAG, "RELEASE: " + Build.VERSION.RELEASE);
        Log.d(TAG, "SDK_INT: " + Build.VERSION.SDK_INT);
    }


    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        if ("startService".equals(action)) {
            this.startService(args.getString(0));
            callbackContext.success();
            return true;
        } else if ("stopService".equals(action)) {
            this.stopService();
            callbackContext.success();
            return true;
        } else if ("startScanSightings".equals(action)) {
            this.startScanSightings(args.getString(0));
            callbackContext.success();
            return true;
        } else if ("didReceiveSighting".equals(action)) {
            this.didReceiveSighting(callbackContext);
            return true;
        } else if ("stopScanSightings".equals(action)) {
            this.stopScanSightings();
            callbackContext.success();
            return true;
        }
        callbackContext.error("Gimbal Android Error : " + action + " not found !");
        return false;  // Returning false results in a "MethodNotFound" error.

    }


    private void initialize(String appKey) {
        Log.i(TAG, "Initializing the Gimbal Service");
        try {
            com.gimbal.android.Gimbal.setApiKey(this.cordova.getActivity().getApplication(), appKey);
        } catch (Exception ex) {
            Log.d(TAG, "Erroor : " + ex.getMessage());
        }
        isInitialized = true;
        Log.d(TAG, "Gimbal Service Initialized");
    }


    private void startScanSightings(String smoothWindow) {
        Log.i(TAG, "startScanSightings");
        if (gimbalBeaconListener == null) {
            Log.d(TAG, "Beacon Listener Creation");
            gimbalBeaconListener = new BeaconEventListener() {
                @Override
                public void onBeaconSighting(BeaconSighting sighting) {
                    Log.i(TAG, "BeaconSighting : " + sighting.toString());
                    if (beaconFoundCallback != null) {
                        JSONObject beaconSighting = buildResult(sighting);
                        PluginResult result = new PluginResult(PluginResult.Status.OK, beaconSighting);
                        result.setKeepCallback(true);
                        beaconFoundCallback.sendPluginResult(result);
                    }
                }
            };
        }
        getBeaconManager().addListener(gimbalBeaconListener);
        getBeaconManager().startListening();
        Log.d(TAG, "Beacon Manager start listening");
    }


    private void startService(String appKey) {
        Log.i(TAG, "Start Gimbal Service");
        if (!isServiceRunning) {
            Log.i(TAG, "Starting the Gimbal Service.");
            if (!isInitialized) {
                initialize(appKey);
            }
            isServiceRunning = true;
            GimbalDebugger.enableBeaconSightingsLogging();
            Log.d(TAG, "Debugger " + GimbalDebugger.isBeaconSightingsLoggingEnabled());
        } else {
            Log.d(TAG, "Cannot start the Gimbal Service as it's already running.");
        }
    }

    private void stopService() {
        Log.i(TAG, "Stop Gimbal Service");
        if (isServiceRunning) {
            Log.d(TAG, "Stopping the Gimbal Service.");
            stopScanSightings();

            GimbalDebugger.disableBeaconSightingsLogging();
            isServiceRunning = false;
        } else {
            Log.d(TAG, "Cannot stop service as it isn't currently running.");
        }
    }

    private void didReceiveSighting(CallbackContext callbackContext) {
        Log.i(TAG, "didReceiveSighting");
        this.beaconFoundCallback = callbackContext;
    }

    private void stopScanSightings() {
        Log.i(TAG, "Stop Gimbal Scan Sightings");
        if (isServiceRunning) {
            Log.d(TAG, "Stopping Gimbal Scan Sightings");
            gimbalBeaconListener = null;
            getBeaconManager().stopListening();
            getBeaconManager().removeListener(gimbalBeaconListener);
            beaconManager = null;
        } else {
            Log.d(TAG, "Cannot stop  Gimbal Scan Sightings as Gimbal service  isn't currently running.");
        }
    }

    private JSONObject buildResult(BeaconSighting sighting) {
        JSONObject beaconSighting = new JSONObject();
        try {
            JSONObject transmitter = new JSONObject();
            transmitter.put("identifier", sighting.getBeacon().getIdentifier());
            transmitter.put("name", sighting.getBeacon().getName());
            transmitter.put("batteryLevel", sighting.getBeacon().getBatteryLevel());
            transmitter.put("temperature", sighting.getBeacon().getTemperature());
            transmitter.put("iconURL", sighting.getBeacon().getIconURL());
            
            beaconSighting.put("transmitter", transmitter);
            beaconSighting.put("RSSI", sighting.getRSSI());
            beaconSighting.put("timeInMillis", sighting.getTimeInMillis());
        } catch (JSONException e) {
            Log.e(TAG, e.toString());
        }
        return beaconSighting;
    }

    public BeaconManager getBeaconManager() {
        if (beaconManager == null) {
            beaconManager = new BeaconManager();
        }
        return beaconManager;
    }

    public void onDestroy() {
        if (isServiceRunning) {
            this.stopService();
        }
    }
}


