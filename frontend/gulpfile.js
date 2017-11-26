var gulp = require('gulp');
var runSequence = require('run-sequence');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var uglifycss = require('gulp-uglifycss');
var watch = require('gulp-watch');
var gutil = require('gulp-util');
var rename = require("gulp-rename");
var clean = require('gulp-clean');

gulp.task('default', function() {
    runSequence('styles','javascript','templates')
});

gulp.task('release', function() {
    runSequence('clean','styles-production','javascript-production','templates')
});

gulp.task('clean', function() {
    runSequence(['clean-css','clean-html','clean-js'])
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

gulp.task('templates',function(){
    return gulp.src('./app/**/*.html')
        .pipe(rename({dirname: ''}))
        .pipe(gulp.dest('../public/html'));
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
    watch('./app/**/*.html',function () {
        gulp.src('./app/**/*.html')
            .pipe(gulp.dest('../public/html'));
        gutil.log('Templates reloaded');
    });
});

gulp.task('clean-js',function () {
    return gulp.src('../public/js', {read: false})
        .pipe(clean({force: true}));
});

gulp.task('clean-css',function () {
    return gulp.src('../public/css/', {read: false})
        .pipe(clean({force: true}));
});

gulp.task('clean-html',function () {
    return gulp.src('../public/html/', {read: false})
        .pipe(clean({force: true}));
});