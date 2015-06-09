angular.module('starter.controllers', ['ionic', 'starter.services'])

  .controller('MapCtrl', function ($rootScope, $scope, fdGeo, $filter, $ionicPlatform) {
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
).controller('SettingsCtrl', function ($rootScope, $scope, fdGeo) {
    $scope.settings = fdGeo.getSettings();
    console.log($scope.settings);
    $scope.update = function() {
      fdGeo.updateSettings($scope.settings);
    };

  });

