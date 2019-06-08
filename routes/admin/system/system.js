const express = require('express');
const router = express.Router();
const _ = require('lodash');
const request = require('request');
const fbPage = require('../../../modules/facebook-page');

const log = require('perfect-logger');

router.post('/maintenance',function (req,res) {
    global.maintananceMode = Object.assign({
        event: 'Server maintenance mode',
        status: true,
        message: 'System under maintenance',
        time: Date().toLocaleString(),
        activationCode: ''
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

router.get('/maintenance',function (req,res) {
    res.send(global.maintananceMode);
});

router.get('/forcescan', function (req, res) {
    global.monitoring.forceScan = true;
    log.debug("Force scan requested by " + req.facebookVerification.name);
    res.send({});
});

router.get('/run-backup/:name', function (req, res) {
    const options = {
        url: 'http://127.0.0.1:8888/backup',
        headers: {
            'name': req.params['name'],
            'challenge':  process.env.CHALLENGE_CODE
        }
    };

    log.debug(`On demand database backup(@${req.params['name']}) requested by ${req.facebookVerification.name}`);
    request(options, function (err, resp) {
        if (err || resp.statusCode !== 200){
            res.send({
                success: false,
                err: err || resp
            });
            log.crit(`On demand database backup(@${req.params['name']}) request by ${req.facebookVerification.name} failed.`, err || resp);
        }else {
            log.info(`On demand database backup(@${req.params['name']}) request by ${req.facebookVerification.name} completed.`);
            res.send({
                success: true
            });
        }
    });
});

router.get('/test-fb', function (req,res) {
    log.warn("Facebook Test Post was requested by " + req.facebookVerification.name);
    fbPage.createPost(`This is a test post requested by : ${req.facebookVerification.name} on ${new Date()}`);
    res.send({});
});

module.exports = router;