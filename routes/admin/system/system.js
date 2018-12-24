const express = require('express');
const router = express.Router();
const _ = require('lodash');

const log = require('perfect-logger');

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
        log.warn(`Server was put to maintenance mode by ${adminName}`, global.maintananceMode);
    }else{
        log.warn(`Server brought online by ${adminName}`);
    }
    log.writeData(global.maintananceMode);
    res.send(global.maintananceMode);
});

router.get('/forcescan', function (req, res) {
    global.monitoring.forceScan = true;
    log.debug("Force scan requested by " + req.facebookVerification.name);
    res.send({});
});

module.exports = router;