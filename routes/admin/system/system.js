const express = require('express');
const router = express.Router();
const _ = require('lodash');

const logger = require('../../../modules/logger');

router.post('/maintenance',function (req,res) {
    global.maintananceMode = Object.assign({
        event: 'Server maintenance mode',
        status: true,
        message: 'System under maintenance'
    }, req.body);
    let adminName = 'Administrator';
    if (req.facebookVerification.name){
        adminName = req.facebookVerification.name;
    }
    global.maintananceMode.adminName = adminName;
    if (global.maintananceMode.status){
        logger.log(`Server was put to maintenance mode by ${adminName}`, 'warn', true);
    }else{
        logger.log(`Server brought online by ${adminName}`, 'warn', true);
    }
    res.send(global.maintananceMode);
});

router.get('/forcescan', function (req, res) {
    global.monitoring.forceScan = true;
    logger.log("Force scan requested by " + req.facebookVerification.name);
    res.send({});
});

module.exports = router;