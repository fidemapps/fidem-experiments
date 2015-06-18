// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic', 'starter.controllers', 'ionic.service.core', 'ionic.service.push'])

  .config(['$ionicAppProvider', function ($ionicAppProvider) {
    // Identify app
    $ionicAppProvider.identify({
      // Your App ID
      app_id: '7a8105e0',
      // The public API key services will use for this app
      api_key: 'f3f58649f8b3e6297bd97c408f9b19a99d04b218b8b6e12c',
      // Your GCM sender ID/project number (Uncomment if supporting Android)
      gcm_id: '623105855894'
      // Set the app to use development pushes
      //dev_push: true
    });

  }])

  .run(function ($ionicPlatform, $rootScope, $ionicPush, $cordovaPush) {
    $ionicPlatform.ready(function () {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      }
      if (window.StatusBar) {
        StatusBar.styleDefault();
      }
    });
  })

  .config(function ($stateProvider, $urlRouterProvider) {

    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider
      .state('home', {
        url: "/home",
        templateUrl: "templates/home.html",
        controller: 'AppCtrl'
      });

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/home');

  });

