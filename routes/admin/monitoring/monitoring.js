const express = require('express');
const router = express.Router();
const _ = require('lodash');

const log = require('perfect-logger');

router.post('/ping',function (req,res) {
    if (!global.monitoring.online){
        log.info("Monitoring client connected.")
    }

    if (global.monitoring.online && global.monitoring.notResponding){
        log.info("Monitoring client responded.")
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

    let toolName = req.body.tool || 'Unknown Tool';

    if (req.body.text && req.body.text.length > 0){
         log[req.body.type](toolName + ': ' + req.body.text);
        res.send({});
    }else{
        res.status(400).send("log text is missing");
    }
});

module.exports = router;