var gulp = require('gulp');
var nodemon = require('gulp-nodemon');

gulp.task('server', function () {
  return nodemon({script: 'server.js'});
});

gulp.task('default', ['server']);
