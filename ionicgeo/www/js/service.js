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
angular.module('starter.services', ['ionic'])
  .service('fdGeo', function ($rootScope, $http) {

    var service = this;
    service.currentLocation = null;
    service.map = null;
    service.withMap = false;

    service.currentLocationMarker = undefined;
    service.path = undefined;
    service.aggressiveEnabled = false;
    service.locations = [];
    service.geofence = undefined;

    //
    service.settings = {
      debug: true,
      url: 'http://requestb.in/yyszziyy',
      desiredAccuracy: 0,
      stationaryRadius: 50,
      distanceFilter: 25,
      locationUpdateInterval: 5000,
      minimumActivityRecognitionConfidence: 80,
      fastestLocationUpdateInterval: 5000,
      activityRecognitionInterval: 10000
    };

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
        $rootScope.$broadcast('fdGeo:message', 'fdGeo : AjaxCallback: ' + response);


        bgGeo.finish();
      };

      /**
       * This callback will be executed every time a geolocation is recorded in the background.
       */
      var callbackFn = function (location) {
        $rootScope.$broadcast('fdGeo:message', '[js] BackgroundGeoLocation callback:  ' + JSON.stringify(location));

        $http.post(service.settings.url, {src:'AjaxCallback', location:location}).
          success(function(data, status, headers, config) {
            $rootScope.$broadcast('fdGeo:message', 'fdGeo : Success AjaxCallback: ' + data);
          }).
          error(function(data, status, headers, config) {
            $rootScope.$broadcast('fdGeo:message', 'fdGeo : Error AjaxCallback: ' + data);
          });

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

      });

      // BackgroundGeoLocation is highly configurable.
      bgGeo.configure(callbackFn, failureFn, {
        debug: service.settings.debug, // <-- enable this hear sounds for background-geolocation life-cycle.
        desiredAccuracy: service.settings.desiredAccuracy,
        stationaryRadius: service.settings.stationaryRadius,
        distanceFilter: service.settings.distanceFilter,
        disableElasticity: false, // <-- [iOS] Default is 'false'.  Set true to disable speed-based distanceFilter elasticity
        locationUpdateInterval: service.settings.locationUpdateInterval,
        minimumActivityRecognitionConfidence: service.settings.minimumActivityRecognitionConfidence,   // 0-100%.  Minimum activity-confidence for a state-change
        fastestLocationUpdateInterval: service.settings.fastestLocationUpdateInterval,
        activityRecognitionInterval: service.settings.activityRecognitionInterval,
        stopTimeout: 0,
        forceReload: true,      // <-- [Android] If the user closes the app **while location-tracking is started** , reboot app (WARNING: possibly distruptive to user)
        stopOnTerminate: false, // <-- [Android] Allow the background-service to run headless when user closes the app.
        startOnBoot: true,      // <-- [Android] Auto start background-service in headless mode when device is powered-up.
        activityType: 'AutomotiveNavigation',
        /**
         * HTTP Feature:  set an url to allow the native background service to POST locations to your server
         */
        url: service.settings.url + '?dir=cordova-background-geolocation',
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
        $rootScope.$broadcast('[js] Geofence ENTER: ', identifier);
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
      $rootScope.$broadcast('fdGeo:message', 'goHome - Location: ' + JSON.stringify(location));
      if (!location) {
        // No location recorded yet; bail out.
        return;
      }

    };

    service.setMap = function (map) {
      service.map = map;
      service.withMap = true;
    };
    service.getMap = function () {
      return service.map;
    };

    service.setCurrentLocation = function (location) {
      // Set currentLocation @property
      service.currentLocation = location;

      var coords = location.coords;
      $rootScope.$broadcast('fdGeo:message', 'setCurrentLocation - coords: ' + JSON.stringify(coords));

    };


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
      $rootScope.$broadcast('[js] onPause');
      service.stopWatchingForegroundPosition();
    };
    /**
     * Once in foreground, re-engage foreground geolocation watch with standard Cordova GeoLocation api
     */
    service.onResume = function () {
      $rootScope.$broadcast('[js] onResume');
      service.watchForegroundPosition();
    }

    service.resetClicked = function () {
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
      if (service.path) app.path.setMap(null);
      service.path = undefined;
    };


    service.getSettings = function () {
      return service.settings;
    };
    service.updateSettings = function (settings) {
      service.settings = settings;
    }
  })
;