const express = require('express');
const _ = require('lodash');
const router = express.Router();

let logger = require('../../modules/logger');
let mysql = require('../../modules/database');

router.get('/status', function (req, res) {
    let query = "SELECT *, id as remoteId FROM alerts WHERE id > ? or showAlways != 0;";
    mysql.query(query,[req.facebookVerification.alert_version],function (err,payload) {
        if (!err){
            res.send(payload);
        } else{
            res.status(500).send({success:false,error:err});
        }
    });
});

router.get('/ack/:remoteId', function (req, res) {
    let remoteId = req.params['remoteId'] || 0;
    if (req.facebookVerification.alert_version < remoteId){
        let query = "UPDATE facebook SET alert_version = ? WHERE id = ? AND alert_version < ?";
        mysql.query(query,[remoteId, req.facebookVerification.id, remoteId],function (err,payload) {
            if (err){
                logger.log(err.toString(), 'crit');
            }
        });
    }
    res.send({});
});

module.exports = router;