const fbPage = require('../modules/facebook-page');

module.exports = function (body) {
    fbPage.createPost(body);
};