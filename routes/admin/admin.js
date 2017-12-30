const express = require('express');
const router = express.Router();

let permission = require('../modules/permissions');
let logger = require('../modules/logger');

let console = require('./admin/console/root');

// Authentication and Verification Middleware
router.use('/', permission());

//Modules
router.use('/console',console);

module.exports = router;