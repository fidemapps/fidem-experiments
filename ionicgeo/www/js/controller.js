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
})()

var app = {

  /**
   * @property {google.maps.Map} map
   */
  map: undefined,
  /**
   * @property {google.maps.Marker} location The current location
   */
  currentLocationMarker: undefined,
  /**
   * @property {google.map.PolyLine} path The list of background geolocations
   */
  path: undefined,
  /**
   * @property {Boolean} aggressiveEnabled
   */
  aggressiveEnabled: false,
  /**
   * @property {Array} locations List of rendered map markers of prev locations
   */
  locations: [],
  /**
   * @property currentLocation {Location}
   */
  currentLocation: null,
  /**
   * @property geofence {google.maps.Cirlce}
   */
  geofence: undefined,
  /**
   * @private
   */
  btnEnabled: undefined,
  btnPace: undefined,
  btnHome: undefined,
  btnReset: undefined,

  onDeviceReady: function () {
    app.receivedEvent('deviceready');
    app.configureBackgroundGeoLocation();
    app.watchForegroundPosition();
  },


  configureBackgroundGeoLocation: function () {
    var bgGeo = window.plugins.backgroundGeoLocation;

    app.onClickHome();

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
      console.log('[js] BackgroundGeoLocation callback:  ' + JSON.stringify(location));

      // Update our current-position marker.
      app.setCurrentLocation(location);

      // After you Ajax callback is complete, you MUST signal to the native code, which is running a background-thread, that you're done and it can gracefully kill that thread.
      yourAjaxCallback.call(this);
    };

    var failureFn = function (error) {
      console.log('BackgroundGeoLocation error');
    };

    // Only ios emits this stationary event
    bgGeo.onStationary(function (location) {
      console.log('[js] BackgroundGeoLocation onStationary ' + JSON.stringify(location));

      app.setCurrentLocation(location);

      var coords = location.coords;

      // Center ourself on map
      app.onClickHome();

      if (!app.stationaryRadius) {
        app.stationaryRadius = new google.maps.Circle({
          fillColor: '#cc0000',
          fillOpacity: 0.4,
          strokeOpacity: 0,
          map: app.map
        });
      }
      var radius = 50;
      var center = new google.maps.LatLng(coords.latitude, coords.longitude);
      app.stationaryRadius.setRadius(radius);
      app.stationaryRadius.setCenter(center);

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
    google.maps.event.addListener(app.map, 'longpress', function (e) {
      if (app.geofence) {
        app.geofence.setMap(null);
      }
      bgGeo.addGeofence({
        identifier: 'MyGeofence',
        radius: 200,
        latitude: e.latLng.lat(),
        longitude: e.latLng.lng()
      }, function () {
        app.geofence = new google.maps.Circle({
          fillColor: '#00cc00',
          fillOpacity: 0.4,
          strokeOpacity: 0,
          radius: 200,
          center: e.latLng,
          map: app.map
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
  },

  onClickHome: function () {
    var location = app.currentLocation;
    if (!location) {
      // No location recorded yet; bail out.
      return;
    }
    var map = app.map,
      coords = location.coords,
      ll = new google.maps.LatLng(coords.latitude, coords.longitude),
      zoom = map.getZoom();

    map.setCenter(ll);

    if (zoom < 15) {
      map.setZoom(15);
    }
  },

  /**
   * We use standard cordova-plugin-geolocation to watch position in foreground.
   */
  watchForegroundPosition: function () {
    var fgGeo = window.navigator.geolocation;
    if (app.foregroundWatchId) {
      app.stopWatchingForegroundPosition();
    }
    // Watch foreground location
    app.foregroundWatchId = fgGeo.watchPosition(function (location) {
      app.setCurrentLocation(location);
    });
  },
  stopWatchingForegroundPosition: function () {
    var fgGeo = window.navigator.geolocation;
    if (app.foregroundWatchId) {
      fgGeo.clearWatch(app.foregroundWatchId);
      app.foregroundWatchId = undefined;
    }
  },

  setCurrentLocation: function (location) {
    // Set currentLocation @property
    app.currentLocation = location;

    var coords = location.coords;

    if (!app.currentLocationMarker) {
      app.currentLocationMarker = new google.maps.Marker({
        map: app.map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 3,
          fillColor: 'blue',
          strokeColor: 'blue',
          strokeWeight: 5
        }
      });
      app.locationAccuracyMarker = new google.maps.Circle({
        fillColor: '#3366cc',
        fillOpacity: 0.4,
        strokeOpacity: 0,
        map: app.map
      });
      app.onClickHome();
    }
    if (!app.path) {
      app.path = new google.maps.Polyline({
        map: app.map,
        strokeColor: '#3366cc',
        fillOpacity: 0.4
      });
    }
    var latlng = new google.maps.LatLng(coords.latitude, coords.longitude);


    if (app.previousLocation) {
      var prevLocation = app.previousLocation;
      // Drop a breadcrumb of where we've been.
      app.locations.push(new google.maps.Marker({
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 3,
          fillColor: 'green',
          strokeColor: 'green',
          strokeWeight: 5
        },
        map: app.map,
        position: new google.maps.LatLng(prevLocation.coords.latitude, prevLocation.coords.longitude)
      }));
    }

    // Update our current position marker and accuracy bubble.
    app.currentLocationMarker.setPosition(latlng);
    app.locationAccuracyMarker.setCenter(latlng);
    app.locationAccuracyMarker.setRadius(location.coords.accuracy);

    // Add breadcrumb to current Polyline path.
    app.path.getPath().push(latlng);
    app.previousLocation = location;
  },
  onPause: function() {
    console.log('[js] onPause');
    app.stopWatchingForegroundPosition();
  },
  /**
   * Once in foreground, re-engage foreground geolocation watch with standard Cordova GeoLocation api
   */
  onResume: function() {
    console.log('[js] onResume');
    app.watchForegroundPosition();
  },

  // Update DOM on a Received Event
  receivedEvent: function (id) {
    console.log('Received Event: ' + id);
  }

};


angular.module('starter.controllers', ['ionic', 'ngMap'])
  .controller('HomeCtrl', function ($scope, $filter,$ionicPlatform) {
    function addInfo(info) {
      var date = $filter('date')(new Date(), 'mediumTime');
      console.log(info);
      $scope.messages = date + ':' + info + '<br/>' + $scope.messages;

    };

    $scope.messages = '';
    $scope.isAggressive = false;
    $scope.process = 'Start';

    ionic.Platform.ready(function () {
      app.onDeviceReady();
      addInfo('Device Ready');
    });

    $ionicPlatform.on('pause', function () {
      app.onPause();
      addInfo('On Pause');
    });

    $ionicPlatform.on('resume', function () {
      app.onResume();
      addInfo('On Resume');
    });


    $scope.$on('mapInitialized', function (event, map) {
      app.map = map;
      // Add custom LongPress event to google map so we can add Geofences with longpress event!
      new LongPress(app.map, 500);
    });

    $scope.onClickChangePace = function () {
      var bgGeo = window.plugins.backgroundGeoLocation;
      var isAggressive = ENV.toggle('aggressive');

      if (isAggressive == 'true') {
        bgGeo.changePace(true);
      } else {
        bgGeo.changePace(false);
      }
      $scope.isAggressive = isAggressive;
      addInfo('onClickChangePace - isAggressive : ' + isAggressive);
    };
    $scope.onClickReset = function () {
      // Clear prev location markers.
      var locations = app.locations;
      if (locations) {
        for (var n = 0, len = locations.length; n < len; n++) {
          locations[n].setMap(null);
        }
      }
      app.locations = [];

      // Clear Polyline.
      if(app.path) app.path.setMap(null);
      app.path = undefined;
      addInfo('onClickReset');
    };

    $scope.toggleEnabled = function () {
      var bgGeo = window.plugins.backgroundGeoLocation,
        isEnabled = ENV.toggle('enabled');
      if (isEnabled == 'true') {
        bgGeo.start();
        $scope.process = 'Stop';
      } else {
        bgGeo.stop();
        $scope.process = 'Start';
      }
      addInfo('toggleEnabled - enabled : ' + isEnabled);
    };

    $scope.onClickHome = function () {
      addInfo('onClickHome');
      app.onClickHome();
    };


  }
);
