const express = require('express');
const router = express.Router();
const _ = require('lodash');

const logger = require('../../../modules/logger');

router.post('/ping',function (req,res) {
    if (!global.monitoring.online){
        logger.log("Monitoring client connected.")
    }
    global.monitoring = Object.assign({
        status: "Offline",
        lastPing: + new Date(),
        online: true,
        notResponding: false
    },req.body);
    res.send({});
});

module.exports = router;