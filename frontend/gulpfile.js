var gulp = require('gulp');
var runSequence = require('run-sequence');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var uglifycss = require('gulp-uglifycss');
var watch = require('gulp-watch');
var gutil = require('gulp-util');

gulp.task('default', function() {
    runSequence('styles','javascript')
});

gulp.task('release', function() {
    runSequence('styles-production','javascript-production')
});

gulp.task('styles',function(){
    return gulp.src('./scss/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('../public/css'));
});

gulp.task('styles-production',function(){
    return gulp.src('./scss/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(uglifycss({
            "maxLineLen": 0,
            "uglyComments": true
        }))
        .pipe(gulp.dest('../public/css'));
});

gulp.task('javascript',function(){
    return gulp.src('./app/**/*.js')
        .pipe(concat('application.js'))
        .pipe(gulp.dest('../public/js'));
});

gulp.task('javascript-production',function(){
    return gulp.src('./app/**/*.js')
        .pipe(concat('application.js'))
        .pipe(uglify({
            mangle: {toplevel: true},
            compress: {
                warnings: false
            }
        }))
        .pipe(gulp.dest('../public/js'));
});

gulp.task('watch',function () {
    watch('./app/**/*.js',function () {
        gulp.src('./app/**/*.js')
            .pipe(concat('application.js'))
            .pipe(gulp.dest('../public/js'));
        gutil.log('Scripts reloaded')
    });
    watch('./scss/**/*.scss',function () {
        gulp.src('./scss/**/*.scss')
            .pipe(sass().on('error', sass.logError))
            .pipe(gulp.dest('../public/css'));
        gutil.log('Styles reloaded');
    });
});