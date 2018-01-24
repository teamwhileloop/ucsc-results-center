const express = require('express');
const router = express.Router();

let permission = require('../../modules/permissions');
let logger = require('../../modules/logger');

let console = require('./console/console');
let calculate = require('./calculate/calculate');
let result = require('./result/result');
let system = require('./system/system');

// Authentication and Verification Middleware
router.use('/', permission());

//Modules
router.use('/console',console);
router.use('/calculate',calculate);
router.use('/result',result);
router.use('/system',system);

module.exports = router;