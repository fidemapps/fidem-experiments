/*
 *
 * Cordova Gimbal Plugin
 * by Cyrille Guerin
 *
 *
 *   cordova.exec(onSuccess, onFail, 'AlertPlugin', 'alert', [content]);
 */

var exec = require('cordova/exec');

exports.startService = function(appId, appSecret, callbackUrl, success, failed) {
  exec(success, failed, 'Gimbal', 'startService', [appId]);
};

exports.stopService = function(success, failed) {
  exec(success, failed, 'Gimbal', 'stopService', []);
};

exports.startScanSightings = function(smoothWindow) {
  if (typeof smoothWindow === 'undefined') {
    smoothWindow = '';
  }

  exec(function() {}, function() {}, 'Gimbal', 'startScanSightings', [smoothWindow]);
};

exports.didReceiveSighting = function(success) {
  exec(success, function() {}, 'Gimbal', 'didReceiveSighting', []);
};

exports.stopScanSightings = function() {
  exec(function() {}, function() {}, 'Gimbal', 'stopScanSightings', []);
};