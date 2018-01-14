const express = require('express');
const router = express.Router();

let permission = require('../modules/permissions');

const profile = require('./profile/profile');

// Authentication and Verification Middleware
router.use('/', permission());

router.use('/profile', profile);

module.exports = router;