const express = require('express');
const router = express.Router();
const _ = require('lodash');

const logger = require('../../../modules/logger');

router.post('/ping',function (req,res) {
    if (!global.monitoring.online){
        logger.log("Monitoring client connected.")
    }

    if (global.monitoring.online && global.monitoring.notResponding){
        logger.log("Monitoring client responded.")
    }

    global.monitoring = Object.assign({
        status: "Offline",
        lastPing: + new Date(),
        online: true,
        notResponding: false,
        forceScan: global.monitoring.forceScan
    },req.body);


    let returnCode = "200";
    if (global.monitoring.forceScan){
        returnCode = "100";
        global.monitoring.forceScan = false;
    }
    res.send(returnCode);
});

router.post('/report', function (req, res) {
    if (['info', 'warn', 'crit'].indexOf(req.body.type) === -1){
        res.status(400).send("Invalid log type");
        return;
    }

    if (req.body.text && req.body.text.length > 0){
        logger.log('Monitoring client: ' + req.body.text, req.body.type);
        res.send({});
    }else{
        res.status(400).send("log text is missing");
    }
});

module.exports = router;