let gulp = require('gulp');
let runSequence = require('run-sequence');
let uglify = require('gulp-uglify-es').default;
let concat = require('gulp-concat');
let sass = require('gulp-sass');
let uglifycss = require('gulp-uglifycss');
let watch = require('gulp-watch');
let gutil = require('gulp-util');
let rename = require("gulp-rename");
let clean = require('gulp-clean');
var replace = require('gulp-token-replace');
const os = require('os');

gulp.task('default', function() {
    runSequence('styles','javascript','templates')
});

gulp.task('release', function() {
    runSequence('clean','styles-production','javascript-production','templates', 'token-replace')
});

gulp.task('clean', function() {
    runSequence(['clean-css','clean-html','clean-js'])
});

gulp.task('styles',function(){
    return gulp.src('./scss/styles.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(concat('styles.css'))
        .pipe(gulp.dest('../public/css'));
});

gulp.task('styles-production',function(){
    return gulp.src('./scss/styles.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(uglifycss({
            "maxLineLen": 0,
            "uglyComments": true
        }))
        .pipe(concat('styles.css'))
        .pipe(gulp.dest('../public/css'));
});

gulp.task('javascript',function(){
    return gulp.src('./app/**/*.js')
        .pipe(concat('application.js'))
        .pipe(gulp.dest('../public/js'));
});

gulp.task('templates',function(){
    return gulp.src('./app/**/*.html')
        .pipe(gulp.dest('../public/html'));
});

gulp.task('javascript-production',function(){
    return gulp.src('./app/**/*.js')
        .pipe(concat('application.js'))
        .pipe(uglify({
            mangle: false,
            compress: {
                warnings: false
            }
        }))
        .pipe(gulp.dest('../public/js'));
});

gulp.task('watch',function () {
    watch('./**',function () {
        runSequence('styles','javascript','templates');
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

gulp.task('token-replace', function(){
    var config = {
        system: {
            domain: process.env.INT_DOMAIN,
            fbappid: process.env.FB_APPID
        }
    };
    return gulp.src(['../public/js/application.js'])
        .pipe(replace({global: config}))
        .pipe(gulp.dest('../public/js'))
});