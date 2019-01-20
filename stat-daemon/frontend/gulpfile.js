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

gulp.task('default', function() {
    runSequence('styles','javascript','templates')
});

gulp.task('release', function() {
    runSequence('styles-production','javascript-production','templates')
});

gulp.task('styles',function(){
    return gulp.src('./scss/styles.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(concat('ssd-styles.css'))
        .pipe(gulp.dest('../../public/css'));
});

gulp.task('styles-production',function(){
    return gulp.src('./scss/styles.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(uglifycss({
            "maxLineLen": 0,
            "uglyComments": true
        }))
        .pipe(concat('ssd-styles.css'))
        .pipe(gulp.dest('../../public/css'));
});

gulp.task('javascript',function(){
    return gulp.src('./app/**/*.js')
        .pipe(concat('aa-ssd-app.js'))
        .pipe(gulp.dest('../../public/js'));
});

gulp.task('templates',function(){
    return gulp.src('./app/**/*.html')
        .pipe(gulp.dest('../../public/html-ssd'));
});

gulp.task('javascript-production',function(){
    return gulp.src('./app/**/*.js')
        .pipe(concat('aa-ssd-app.js'))
        .pipe(uglify({
            mangle: false,
            compress: {
                warnings: false
            }
        }))
        .pipe(gulp.dest('../../public/js'));
});

gulp.task('watch',function () {
    watch('./**',function () {
        runSequence('styles','javascript','templates');
    });
});