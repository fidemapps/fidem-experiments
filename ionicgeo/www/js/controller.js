angular.module('starter.controllers', ['ionic', 'ngMap', 'starter.services'])
  .controller('HomeCtrl', function ($rootScope, $scope, fdGeo, $filter,$ionicPlatform) {
    function addInfo(info) {
      var date = $filter('date')(new Date(), 'mediumTime');
      console.log(info);
      $scope.messages = date + ':' + info + '<br/>' + $scope.messages;
    };

    $scope.messages = '';
    $scope.isAggressive = false;
    $scope.process = 'Start';

    ionic.Platform.ready(function () {
      fdGeo.deviceReady();
    });

    $ionicPlatform.on('pause', function () {
      fdGeo.onPause();
      addInfo('On Pause');
    });

    $ionicPlatform.on('resume', function () {
      fdGeo.onResume();
      addInfo('On Resume');
    });


    $scope.$on('mapInitialized', function (event, map) {
      fdGeo.setMap(map);
      // Add custom LongPress event to google map so we can add Geofences with longpress event!
      new LongPress(fdGeo.getMap(), 500);
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
      fdGeo.resetClicked();
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
      fdGeo.goHome();
    };

    $rootScope.$on('fdGeo:message', function (event, data) {
     addInfo(data);
    });


  }
);
