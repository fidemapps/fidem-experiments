angular.module('starter.controllers', [])

  .controller('AppCtrl', function ($scope, $rootScope, $ionicPush, $ionicUser) {
    $rootScope.$on('$cordovaPush:tokenReceived', function (event, data) {
      console.log('Got token', data.token, data.platform);
      $scope.token = data.token;
      alert("Got token:" + data.token);
    });
    //Basic registration
    $scope.pushRegister = function () {
      alert('Registering...');

      $ionicPush.register({
        canShowAlert: true, //Can pushes show an alert on your screen?
        canSetBadge: true, //Can pushes update app icon badges?
        canPlaySound: true, //Can notifications play a sound?
        canRunActionsOnWake: true, //Can run actions outside the app,
        onNotification: function (notification) {
          // Called for each notification for custom handling
          $scope.lastNotification = JSON.stringify(notification);
        }
      }).then(function (deviceToken) {
        alert("Register:" + deviceToken);
        $scope.token = deviceToken;
      });
    };

    $scope.identifyUser = function () {
      alert('Identifying');
      console.log('Identifying user');

      var user = $ionicUser.get();
      if (!user.user_id) {
        alert('Will generate one');
        // Set your user_id here, or generate a random one
        user.user_id = $ionicUser.generateGUID()
      }

      alert(user.user_id);

      angular.extend(user, {
        name: 'Test User',
        message: 'I come from planet Ion'
      });

      $ionicUser.identify(user);

    }
  });
