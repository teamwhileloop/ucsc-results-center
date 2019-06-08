const FB = require('fb');
const credentials = require('./credentials');
const log = require('perfect-logger');

exports.createPost = function (body) {
    FB.setAccessToken(credentials.facebook.pagePostToken);
    FB.api('me/feed', 'post', { message: body }, function (res) {
        if(!res || res.error) {
            log.warn("Failed to post to Facebook page: " + body);
            log.writeData(res);
            return;
        }
        log.info("Facebook post created: " + res.id);
        log.writeData(res);
    });
};