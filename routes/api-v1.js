const express = require('express');
const router = express.Router();

let permission = require('../modules/permissions');

const profile = require('./profile/profile');
const alerts = require('./alerts/alerts');
const search = require('./search/search');
const statistics = require('./statistics/statistics');

// Authentication and Verification Middleware
router.use('/', permission());
router.use('/profile', profile);
router.use('/search', search);
router.use('/alerts', alerts);
router.use('/statistics', statistics);

module.exports = router;