var ENV = (function () {

  var localStorage = window.localStorage;

  return {
    settings: {
      /**
       * state-mgmt
       */
      enabled: localStorage.getItem('enabled') || 'true',
      aggressive: localStorage.getItem('aggressive') || 'false'
    },
    toggle: function (key) {
      var value = localStorage.getItem(key)
      newValue = ((new String(value)) == 'true') ? 'false' : 'true';

      localStorage.setItem(key, newValue);
      return newValue;
    }
  }
})();
angular.module('starter.services', ['ionic', 'ngMap'])
  .service('fdGeo', function ($rootScope) {

    var service = this;
    service.currentLocation = null;
    service.map = null;
    service.currentLocationMarker = undefined;
    service.path = undefined;
    service.aggressiveEnabled = false;
    service.locations = [];
    service.geofence = undefined;


    service.deviceReady = function () {
      service.receivedEvent('Device Ready');
      service.configureBackgroundGeoLocation();
      service.watchForegroundPosition();

    };

    service.receivedEvent = function (eventCode) {
      $rootScope.$broadcast('fdGeo:message', 'fdGeo : Received Event: ' + eventCode);
    };
    service.configureBackgroundGeoLocation = function () {
      $rootScope.$broadcast('fdGeo:message', 'configureBackgroundGeoLocation');
      var bgGeo = window.plugins.backgroundGeoLocation;

      service.goHome();

      /**
       * This would be your own callback for Ajax-requests after POSTing background geolocation to your server.
       */
      var yourAjaxCallback = function (response) {
        // Very important to call #finish -- it signals to the native plugin that it can destroy the background thread, which your callbackFn is running in.
        // IF YOU DON'T, THE OS CAN KILL YOUR APP FOR RUNNING TOO LONG IN THE BACKGROUND
        bgGeo.finish();
      };

      /**
       * This callback will be executed every time a geolocation is recorded in the background.
       */
      var callbackFn = function (location) {
        $rootScope.$broadcast('fdGeo:message', '[js] BackgroundGeoLocation callback:  ' + JSON.stringify(location));

        // Update our current-position marker.
        service.setCurrentLocation(location);

        // After you Ajax callback is complete, you MUST signal to the native code, which is running a background-thread, that you're done and it can gracefully kill that thread.
        yourAjaxCallback.call(this);
      };

      var failureFn = function (error) {
        $rootScope.$broadcast('fdGeo:message', 'BackgroundGeoLocation error');
      };

      // Only ios emits this stationary event
      bgGeo.onStationary(function (location) {
        $rootScope.$broadcast('fdGeo:message', '[js] BackgroundGeoLocation onStationary ' + JSON.stringify(location));

        service.setCurrentLocation(location);

        var coords = location.coords;

        // Center ourself on map
        service.goHome();

        if (!service.stationaryRadius) {
          service.stationaryRadius = new google.maps.Circle({
            fillColor: '#cc0000',
            fillOpacity: 0.4,
            strokeOpacity: 0,
            map: service.map
          });
        }
        var radius = 50;
        var center = new google.maps.LatLng(coords.latitude, coords.longitude);
        service.stationaryRadius.setRadius(radius);
        service.stationaryRadius.setCenter(center);

      });

      // BackgroundGeoLocation is highly configurable.
      bgGeo.configure(callbackFn, failureFn, {
        debug: true, // <-- enable this hear sounds for background-geolocation life-cycle.
        desiredAccuracy: 0,
        stationaryRadius: 50,
        distanceFilter: 25,
        disableElasticity: false, // <-- [iOS] Default is 'false'.  Set true to disable speed-based distanceFilter elasticity
        locationUpdateInterval: 5000,
        minimumActivityRecognitionConfidence: 80,   // 0-100%.  Minimum activity-confidence for a state-change
        fastestLocationUpdateInterval: 5000,
        activityRecognitionInterval: 10000,
        stopTimeout: 0,
        forceReload: true,      // <-- [Android] If the user closes the app **while location-tracking is started** , reboot app (WARNING: possibly distruptive to user)
        stopOnTerminate: false, // <-- [Android] Allow the background-service to run headless when user closes the app.
        startOnBoot: true,      // <-- [Android] Auto start background-service in headless mode when device is powered-up.
        activityType: 'AutomotiveNavigation',
        /**
         * HTTP Feature:  set an url to allow the native background service to POST locations to your server
         */
        url: 'http://posttestserver.com/post.php?dir=cordova-background-geolocation',
        batchSync: false,       // <-- [Default: false] Set true to sync locations to server in a single HTTP request.
        autoSync: true,         // <-- [Default: true] Set true to sync each location to server as it arrives.
        maxDaysToPersist: 1,    // <-- Maximum days to persist a location in plugin's SQLite database when HTTP fails
        headers: {
          "X-FOO": "bar"
        },
        params: {
          "auth_token": "maybe_your_server_authenticates_via_token_YES?"
        }
      });

      bgGeo.onGeofence(function (identifier) {
        alert('Enter Geofence: ' + identifier);
        console.log('[js] Geofence ENTER: ', identifier);
      });

      // Add longpress event for adding GeoFence of hard-coded radius 200m.
      google.maps.event.addListener(service.map, 'longpress', function (e) {
        if (service.geofence) {
          service.geofence.setMap(null);
        }
        bgGeo.addGeofence({
          identifier: 'MyGeofence',
          radius: 200,
          latitude: e.latLng.lat(),
          longitude: e.latLng.lng()
        }, function () {
          service.geofence = new google.maps.Circle({
            fillColor: '#00cc00',
            fillOpacity: 0.4,
            strokeOpacity: 0,
            radius: 200,
            center: e.latLng,
            map: service.map
          });
        })
      });

      // Turn ON the background-geolocation system.  The user will be tracked whenever they suspend the app.
      var settings = ENV.settings;

      if (settings.enabled == 'true') {
        bgGeo.start();

        if (settings.aggressive == 'true') {
          bgGeo.changePace(true);
        }
      }
    };

    service.goHome = function () {
      var location = service.currentLocation;
      $rootScope.$broadcast('fdGeo:message', 'goHome - Location: ' +    JSON.stringify(location));
      if (!location) {
        // No location recorded yet; bail out.
        return;
      }
      var map = service.map,
        coords = location.coords,
        ll = new google.maps.LatLng(coords.latitude, coords.longitude),
        zoom = map.getZoom();

      map.setCenter(ll);

      if (zoom < 15) {
        map.setZoom(15);
      }
    };
    service.setMap = function (map) {
      service.map = map;
    };
    service.getMap = function () {
      return service.map;
    };

    service.setCurrentLocation = function (location) {
      // Set currentLocation @property
      service.currentLocation = location;

      var coords = location.coords;
      $rootScope.$broadcast('fdGeo:message', 'setCurrentLocation - coords: ' +   JSON.stringify(coords));

      if (!service.currentLocationMarker) {
        service.currentLocationMarker = new google.maps.Marker({
          map: service.map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 3,
            fillColor: 'blue',
            strokeColor: 'blue',
            strokeWeight: 5
          }
        });
        service.locationAccuracyMarker = new google.maps.Circle({
          fillColor: '#3366cc',
          fillOpacity: 0.4,
          strokeOpacity: 0,
          map: service.map
        });
        service.goHome();
      }
      if (!service.path) {
        service.path = new google.maps.Polyline({
          map: service.map,
          strokeColor: '#3366cc',
          fillOpacity: 0.4
        });
      }
      var latlng = new google.maps.LatLng(coords.latitude, coords.longitude);


      if (service.previousLocation) {
        var prevLocation = service.previousLocation;
        // Drop a breadcrumb of where we've been.
        service.locations.push(new google.maps.Marker({
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 3,
            fillColor: 'green',
            strokeColor: 'green',
            strokeWeight: 5
          },
          map: service.map,
          position: new google.maps.LatLng(prevLocation.coords.latitude, prevLocation.coords.longitude)
        }));
      }

      // Update our current position marker and accuracy bubble.
      service.currentLocationMarker.setPosition(latlng);
      service.locationAccuracyMarker.setCenter(latlng);
      service.locationAccuracyMarker.setRadius(location.coords.accuracy);

      // Add breadcrumb to current Polyline path.
      service.path.getPath().push(latlng);
      service.previousLocation = location;
    }


    /**
     * We use standard cordova-plugin-geolocation to watch position in foreground.
     */
    service.watchForegroundPosition = function () {
      var fgGeo = window.navigator.geolocation;
      if (service.foregroundWatchId) {
        service.stopWatchingForegroundPosition();
      }
      // Watch foreground location
      service.foregroundWatchId = fgGeo.watchPosition(function (location) {
        service.setCurrentLocation(location);
      });
    };
    service.stopWatchingForegroundPosition = function () {
      var fgGeo = window.navigator.geolocation;
      if (service.foregroundWatchId) {
        fgGeo.clearWatch(service.foregroundWatchId);
        service.foregroundWatchId = undefined;
      }
    };


    service.onPause = function () {
      console.log('[js] onPause');
      service.stopWatchingForegroundPosition();
    };
    /**
     * Once in foreground, re-engage foreground geolocation watch with standard Cordova GeoLocation api
     */
    service.onResume = function () {
      console.log('[js] onResume');
      service.watchForegroundPosition();
    }

    service.resetClicked = function() {
      // Clear prev location markers.
      var locations = service.locations;
      $rootScope.$broadcast('fdGeo:message', 'resetClicked - Locations: ' + locations);
      if (locations) {
        for (var n = 0, len = locations.length; n < len; n++) {
          locations[n].setMap(null);
        }
      }
      service.locations = [];

      // Clear Polyline.
      if(service.path) app.path.setMap(null);
      service.path = undefined;
    }

  });