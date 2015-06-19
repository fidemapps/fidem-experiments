angular.module('starter.controllers', [])

  .controller('DashCtrl', function ($scope, $rootScope, $window, $filter, $ionicPlatform, $timeout) {

    $scope.$on('fdGimbal:message', function (event, data) {
      var date = $filter('date')(new Date(), 'mediumTime');
      var message = date + ':' + data;
      console.log(message);
      $timeout(function () {
          if ($scope.geoMessages.length >= 20) {
            $scope.geoMessages.splice(-1, 1);
          }
          $scope.geoMessages.unshift(message);
        }

        , 100);


    });


    $ionicPlatform.ready(function () {
      var appId = '0c2a6d3c-7377-457b-ae77-4b6ccd22b068';
      Gimbal.startService(appId, 'appSecret', 'callback://url', function () {
        $scope.$emit('fdGimbal:message', 'Service started for app key: ' + appId);

        Gimbal.didReceiveSighting(function (result) {
          $scope.$emit('fdGimbal:message', 'Receive Sighting: ' + JSON.stringify(result));
        });
      }, function () {
        $scope.$emit('fdGimbal:message', 'Service not started : error');
      });
    });

    $scope.stop = function () {
      Gimbal.stopService(function () {
        $scope.$emit('fdGimbal:message', 'Service stopped');
      }, function () {
        $scope.$emit('fdGimbal:message', 'Service not stopped : error');
      });
    };


    $scope.start = function () {
      Gimbal.startService('appId', 'appSecret', 'callback://url', function () {
        $scope.$emit('fdGimbal:message', 'Service started');
      }, function () {
        $scope.$emit('fdGimbal:message', 'Service not started : error');
      });
    };


    $scope.startScanSightings = function () {
      Gimbal.startScanSightings();
      $scope.$emit('fdGimbal:message', 'Start Scan Sightings');
    };

    $scope.stopScanSightings = function () {
      Gimbal.stopScanSightings();
      $scope.$emit('fdGimbal:message', 'Stop Scan Sightings');
    };

    $scope.geoMessages = ['--start'];


  })
  .controller('ChatsCtrl', function ($scope, Chats) {
    $scope.chats = Chats.all();
    $scope.remove = function (chat) {
      Chats.remove(chat);
    }
  })

  .controller('ChatDetailCtrl', function ($scope, $stateParams, Chats) {
    $scope.chat = Chats.get($stateParams.chatId);
  })

  .controller('AccountCtrl', function ($scope) {
    $scope.settings = {
      enableFriends: true
    };
  });
