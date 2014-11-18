var gulp = require('gulp');
var browserSync = require('browser-sync');
var watchify = require('watchify');
var browserify  = require('browserify');
var source = require('vinyl-source-stream');

// Static server.
gulp.task('browser-sync', function() {
  browserSync({
    server: {
      baseDir: './'
    }
  });
});

gulp.task('watchify', function () {
  var bundler = watchify(browserify('./main.js'));
  bundler.on('update', bundle);

  function bundle() {
    return bundler.bundle()
      .pipe(source('./bundle.js'))
      .pipe(gulp.dest('./'))
      .pipe(browserSync.reload({stream: true, once: true}));
  }

  return bundle();
});

gulp.task('default', ['browser-sync', 'watchify']);
