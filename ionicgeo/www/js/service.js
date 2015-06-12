angular.module('starter.services', ['ionic'])
  .service('fdGeo', function ($rootScope, $http) {

    var service = this;
    service.currentLocation = null;
    service.isStarted = false;
    service.isMoving = false;

    service.settings = {
      debug: true,
      url: 'http://requestb.in/1gsb3421',
      desiredAccuracy: 10,
      stationaryRadius: 50,
      distanceFilter: 25,
      locationUpdateInterval: 5000,
      minimumActivityRecognitionConfidence: 80,
      fastestLocationUpdateInterval: 5000,
      activityRecognitionInterval: 10000
    };

    service.deviceReady = function () {
      service.configureBackgroundGeoLocation();
      service.watchForegroundPosition();
    };

    service.configureBackgroundGeoLocation = function () {
      $rootScope.$broadcast('fdGeo:message', 'configureBackgroundGeoLocation');
      var bgGeo = window.plugins.backgroundGeoLocation;
      service.displayCurrentLocation();

      var yourAjaxCallback = function (response) {
        bgGeo.finish();
      };

      /**
       * This callback will be executed every time a geolocation is recorded in the background.
       */
      var callbackFn = function (location) {
        // Update our current-position marker.
        service.setCurrentLocation(location);

        $rootScope.$broadcast('fdGeo:message', '[js-BgGeo] - long :  ' + JSON.stringify(location.coords.longitude));

        $http.post(service.settings.url, {src: 'AjaxCallback', location: location}).
          success(function (data, status, headers, config) {
            $rootScope.$broadcast('fdGeo:message', '[js-BgGeo] Success AjaxCallback: ' + data);
          }).
          error(function (data, status, headers, config) {
            $rootScope.$broadcast('fdGeo:message', '[js-BgGeo] Error AjaxCallback: ' + data);
          });
        // After you Ajax callback is complete, you MUST signal to the native code, which is running a background-thread, that you're done and it can gracefully kill that thread.
        yourAjaxCallback.call(this);
      };

      var failureFn = function (error) {
        $rootScope.$broadcast('fdGeo:message', 'BackgroundGeoLocation error');
      };

      // Only ios emits this stationary event
      bgGeo.onStationary(function (location) {
        $rootScope.$broadcast('fdGeo:message', '[js-BgGeo] onStationary ' + JSON.stringify(location.coords.longitude));
        service.setCurrentLocation(location);
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
        $rootScope.$broadcast('fdGeo:message', '[js-BgGeo] Geofence ENTER: ', identifier);
      });
    };

    service.forceMoving = function () {
      if (service.isStarted) {
        var bgGeo = window.plugins.backgroundGeoLocation;
        bgGeo.changePace(true, function () {
          service.isMoving = true;
          $rootScope.$broadcast('fdGeo:message', '[js-BgGeo] Force Moving');
        });
      } else {
        $rootScope.$broadcast('fdGeo:message', '[js-BgGeo] Service is not started');
      }
    };

    service.forceStationary = function () {
      if (!service.isMoving) {
        return
      }
      if (service.isStarted) {
        var bgGeo = window.plugins.backgroundGeoLocation;
        bgGeo.changePace(false, function () {
          service.isMoving = false;
          $rootScope.$broadcast('fdGeo:message', '[js-BgGeo] Force Stationary');
        });
      } else {
        $rootScope.$broadcast('fdGeo:message', '[js-BgGeo] Service is not started');
      }
    }

    service.stopBG = function () {
      service.forceStationary();
      var bgGeo = window.plugins.backgroundGeoLocation;
      bgGeo.stop(function () {
        service.isStarted = false;
        $rootScope.$broadcast('fdGeo:message', '[js-BgGeo] Stopped');
      }, function (error) {
        service.isStarted = true;
        $rootScope.$broadcast('fdGeo:message', '[js-BgGeo] Error on Stopped ' + error);
      });

    };
    service.startBG = function () {
      var bgGeo = window.plugins.backgroundGeoLocation;
      bgGeo.start(function () {
        service.isStarted = true;
        $rootScope.$broadcast('fdGeo:message', '[js-BgGeo] Started');
      }, function (error) {
        service.isStarted = false;
        $rootScope.$broadcast('fdGeo:message', '[js-BgGeo] Error on Started ' + error);
      });
    };

    service.displayCurrentLocation = function () {
      var location = service.currentLocation;
      if (location) {
        $rootScope.$broadcast('fdGeo:message', 'Current Location: ' + JSON.stringify(location));
      }
    };

    service.setCurrentLocation = function (location) {
      service.currentLocation = location;
      service.displayCurrentLocation();
    };


    /**
     * We use standard cordova-plugin-geolocation to watch position in foreground.
     */
    service.watchForegroundPosition = function () {
      $rootScope.$broadcast('fdGeo:message', '[js] watchForegroundPosition');
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
      $rootScope.$broadcast('fdGeo:message', '[js] stopWatchingForegroundPosition');
      var fgGeo = window.navigator.geolocation;
      if (service.foregroundWatchId) {
        fgGeo.clearWatch(service.foregroundWatchId);
        service.foregroundWatchId = undefined;
      }
    };


    service.onPause = function () {
      $rootScope.$broadcast('fdGeo:message', '[js] onPause');
      service.stopWatchingForegroundPosition();
    };
    /**
     * Once in foreground, re-engage foreground geolocation watch with standard Cordova GeoLocation api
     */
    service.onResume = function () {
      $rootScope.$broadcast('fdGeo:message', '[js] onResume');
      service.watchForegroundPosition();
    };

    service.getSettings = function () {
      return service.settings;
    };
    service.updateSettings = function (settings) {
      service.settings = settings;
    }

    service.moving = function () {
      return service.isMoving
    }

    service.started = function () {
      return service.isStarted;
    }
  })
;