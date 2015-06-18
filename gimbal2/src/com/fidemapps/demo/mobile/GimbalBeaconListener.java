package com.fidemapps.demo.mobile;

import android.util.Log;
import com.gimbal.android.BeaconEventListener;
import com.gimbal.android.BeaconSighting;

public class GimbalBeaconListener extends BeaconEventListener {
    @Override
    public void onBeaconSighting(BeaconSighting sighting) {

        Log.i("Beacon", "Beacon Cool " + sighting.getBeacon().getName() + " with a signal strength of " + sighting.getRSSI() + " has been sighted.");
    }
}