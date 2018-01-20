const express = require('express');
const router = express.Router();

let permission = require('../modules/permissions');

const profile = require('./profile/profile');
const search = require('./search/search');

// Authentication and Verification Middleware
router.use('/', permission());
router.use('/profile', profile);
router.use('/search', search);

module.exports = router;