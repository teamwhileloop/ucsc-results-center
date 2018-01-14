const express = require('express');
const router = express.Router();

let permission = require('../../modules/permissions');
let logger = require('../../modules/logger');

let console = require('./console/console');
let calculate = require('./calculate/calculate');
let result = require('./result/result');

// Authentication and Verification Middleware
router.use('/', permission());

//Modules
router.use('/console',console);
router.use('/calculate',calculate);
router.use('/result',result);

module.exports = router;