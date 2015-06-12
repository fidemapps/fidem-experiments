angular.module('starter.controllers', ['ionic', 'starter.services'])

  .controller('MapCtrl', function ($rootScope, $scope, fdGeo, $filter, $ionicPlatform) {
    $scope.messages = '';
    $scope.isStarted = false;
    $scope.isMoving = false;

    function addInfo(info) {
      var date = $filter('date')(new Date(), 'mediumTime');
      console.log(info);
      $scope.messages = date + ':' + info + '<br/>' + $scope.messages;
    };


    $rootScope.$on('fdGeo:message', function (event, data) {
      addInfo(data);
    });


    ionic.Platform.ready(function () {
      fdGeo.deviceReady();
    });

    $ionicPlatform.on('pause', function () {
      fdGeo.onPause();
    });

    $ionicPlatform.on('resume', function () {
      fdGeo.onResume();
    });

    $scope.forceMoving = function () {
        $scope.isMoving = true;
        fdGeo.forceMoving();

    };

    $scope.forceStationary = function () {
      $scope.isMoving = false;
      fdGeo.forceStationary();

    };


    $scope.startBgGeo = function () {
      $scope.isStarted = true;
      fdGeo.startBG();
    };

    $scope.stopBgGeo= function () {
      $scope.isMoving = false;
      $scope.isStarted = false;
      fdGeo.stopBG();
    };

    $scope.onClickCurrentLocation = function () {
      fdGeo.displayCurrentLocation();
    };

  }
).controller('SettingsCtrl', function ($rootScope, $scope, fdGeo) {
    $scope.settings = fdGeo.getSettings();
    console.log($scope.settings);
    $scope.update = function () {
      fdGeo.updateSettings($scope.settings);
    };

  });

