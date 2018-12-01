const express = require('express');
const crypto = require("crypto");
const _ = require('lodash');

const messenger = require('../../modules/messenger');
const router = express.Router();

let logger = require('../../modules/logger');
let mysql = require('../../modules/database');

function attachSubscriptionToken(userId, token, exp){
    return new Promise(function(resolve, reject){
        let query = 'INSERT INTO `results`.`messnger_subscription_tokens` (`userId`, `token`, `expirydate`)' +
            ' VALUES (?, ?, ?) ' +
            'ON DUPLICATE KEY UPDATE ' +
            '`token` = VALUES(token),' +
            '`expirydate` = VALUES(expirydate);';
        mysql.query(query, [userId, token, exp], function (err, payload) {
            if (err){
                reject(err)
            }else {
                resolve(payload);
            }
        });
    });
}

router.get('/status', function (req, res) {
    let responseObject = {
        success: true,
        messenger: {
            subscribed: false
        }
    };
    let query = "SELECT `psid` FROM `facebook` WHERE `id` = ?;";
    mysql.query(query,[req.facebookVerification.id],function (err,payload) {
        if (!err){
            if (payload.length === 0){
                res.status(404).send({success: false,err:"User not found"});
                return;
            }

            if (parseInt(payload[0].psid || 0) === 0){
                responseObject.messenger.subscribed = false;
                const newToken = crypto.randomBytes(16).toString("hex").substr(0,6).toUpperCase();
                const expiration =  + new Date() + 1000*60*15;
                responseObject.messenger.subscriptionToken = newToken;
                responseObject.messenger.subscriptionTokenExpirationStr = new Date(expiration).toLocaleString('en-US', { timeZone: 'Asia/Colombo' });
                responseObject.messenger.subscriptionTokenExpiration = expiration;
                attachSubscriptionToken(req.facebookVerification.id, newToken, expiration)
                    .then((attachResp)=>{
                        responseObject.messenger.dbr = attachResp;
                        res.send(responseObject);
                    })
                    .catch((attachErr)=>{
                        responseObject.success = true;
                        responseObject.messenger.dbr = attachErr;
                        res.send(responseObject);
                    });
                return;
            }else{
                responseObject.messenger.subscribed = true;
                res.send(responseObject);
                return;
            }
        } else{
            res.status(500).send({success:false,error:err});
        }
    });
});

router.post('/settings', function (req, res) {
    let configObject = {
        'my_result_published': 0,
        'my_gpa_rank_updated': 0,
        'user_approval_request': 0,
        'system_warn_err_thrown': 0,
        'system_restart': 0,
        'system_new_dataset': 0
    };

    configObject.my_result_published = parseInt(req.body.my_result_published) === 1 ? 1 : 0;
    configObject.my_gpa_rank_updated = parseInt(req.body.my_gpa_rank_updated) === 1 ? 1 : 0;

    if (req.facebookVerification.power > 10){
        configObject.user_approval_request = parseInt(req.body.user_approval_request) === 1 ? 1 : 0;
        configObject.system_warn_err_thrown = parseInt(req.body.system_warn_err_thrown) === 1 ? 1 : 0;
        configObject.system_new_dataset = parseInt(req.body.system_new_dataset) === 1 ? 1 : 0;
        configObject.system_restart = parseInt(req.body.system_restart) === 1 ? 1 : 0;
    }

    let query = 'INSERT INTO `results`.`event_subscriptions` (`fbid`, `event`, `value`)' +
        ' VALUES (?, "my_result_published", ?), ' +
        ' (?, "my_gpa_rank_updated", ?), ' +
        ' (?, "user_approval_request", ?), ' +
        ' (?, "system_warn_err_thrown", ?), ' +
        ' (?, "system_restart", ?), ' +
        ' (?, "system_new_dataset", ?) ' +
        'ON DUPLICATE KEY UPDATE `value` = VALUES(value);';

    mysql.query(query,[
        req.facebookVerification.id, configObject.my_result_published,
        req.facebookVerification.id, configObject.my_gpa_rank_updated,
        req.facebookVerification.id, configObject.user_approval_request,
        req.facebookVerification.id, configObject.system_warn_err_thrown,
        req.facebookVerification.id, configObject.system_restart,
        req.facebookVerification.id, configObject.system_new_dataset
    ],function (err, payload) {
        if (err){
            res.status(500).send(err);
        }else{
            res.send(payload);
        }
    })
});


router.get('/settings', function (req, res) {
    let query = "SELECT `event`, `value` FROM `event_subscriptions` WHERE `fbid` = ?";
    mysql.query(query, [req.facebookVerification.id], function (err, payload) {
        if (err){
            res.status(500).send(err);
        }else{
            let configObject = {
                'my_result_published': 0,
                'my_gpa_rank_updated': 0,
                'user_approval_request': 0,
                'system_warn_err_thrown': 0,
                'system_restart': 0,
                'system_new_dataset': 0
            };
            _.forEach(payload, function (row) {
                configObject[row.event] = row.value;
            });
            res.send(configObject);
        }
    })
});

router.get('/test',function (req, res) {
    messenger.sendToEventSubscribers(`system_restart`,1,1);
    res.send({});
});


module.exports = router;