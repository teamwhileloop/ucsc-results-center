const express = require('express');
const router = express.Router();

let permission = require('../../modules/permissions');
let logger = require('../../modules/logger');

let console = require('./console/console');
let calculate = require('./calculate/calculate');
let result = require('./result/result');
let system = require('./system/system');
let users = require('./users/users');
let monitoring = require('./monitoring/monitoring');
let alerts = require('./alerts/alerts');

// Authentication and Verification Middleware
router.use('/', permission());

//Modules
router.use('/console',console);
router.use('/calculate',calculate);
router.use('/result',result);
router.use('/system',system);
router.use('/users',users);
router.use('/monitoring',monitoring);
router.use('/alerts',alerts);

module.exports = router;