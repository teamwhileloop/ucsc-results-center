const express = require('express');
const router = express.Router();

const profile = require('./profile/profile');

router.use('/', function (req, res, next) {
    req.isPublicAPI = true;
    next();
});
router.use('/profile', profile);

module.exports = router;