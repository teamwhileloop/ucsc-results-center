const express = require('express');
const router = express.Router();

const _ = require('lodash');
const crypto = require('crypto');

const logger = require('../modules/logger');
const postman = require('../modules/postman');
const mysql = require('../modules/database.js');
const facebook = require('../modules/facebook');
let credentials = require('../modules/credentials');
let permission = require('../modules/permissions');

//Common Queries
let queryValidateIndexNumber = "SELECT `base`.`index` as `indexNumber`, " +
    "IF (`facebook`.`state` IN ('verified','blocked','pending'), 'conflict', IFNULL(`facebook`.`state`, 'available')) as state " +
    "FROM (SELECT * FROM `result` WHERE `result`.`index` = ? LIMIT 1) AS `base` " +
    "LEFT OUTER JOIN `facebook` " +
    "ON `facebook`.`index_number` = `base`.`index`;";

// Authentication and Verification Middleware
router.use('/', function (req,res,next) {
    let fbToken = req.header('fbToken');
    let fbUid = req.header('fbUid');
    let accessToken = req.header('accessToken');

    //Grant access when using accessToken
    if (accessToken && crypto.createHash('sha1').update(accessToken).digest('hex') === credentials.accessToken){
        req.accessTokenUsed = true;
        req.facebookVerification = {};
        next();
        return;
    }

    if (!fbToken || !fbUid){
        res.status(401).send({
            error:{
                message: 'Facebook userID and access token missing',
                fbUid: fbUid,
                accessToken: accessToken
            }
        })
    }

    //Grant access when using FacebookAPI
    facebook.validateAccessToken(fbToken,fbUid)
    .then(validationReport=>{
        req.accessTokenUsed = false;
        mysql.query('SELECT `index_number` as indexNumber,`state`,`power`,`alternate_email` FROM facebook WHERE id=?;',[validationReport.id],function (error,payload) {
            if(error){
                logger.log(JSON.stringify(_.assignIn(error,{
                    meta: validationReport,
                    env: req.headers.host,
                    uid: fbUid
                })),'crit',true);
                res.status(500).send({
                    systemError: {
                        type: 'database',
                        message: 'Internal server error while executing database query',
                        error: error
                    }
                });
            }else {
                if (payload.length === 0 ){
                    payload.push({
                        power: 0,
                        indexNumber : null,
                        state : 'guest'
                    });
                }
                req.facebookVerification = _.assignIn(validationReport,payload[0]);
                let permissionDetails = permission(req.originalUrl,payload[0].power);
                if (!permissionDetails.status){
                    res.status(401).send({
                        error: {
                            systemError: {
                                type: 'permission',
                                message: 'Required permissions unmet',
                                error: permissionDetails
                            }
                        }
                    });
                }else{
                    next()
                }
            }
        });
    })
    .catch(errorReport=>{
        res.status(401).send({
            facebookError: errorReport
        });

    });
});

router.get('/validate', function (req, res) {
    let query = 'INSERT INTO `results`.`facebook` (`id`, `name`, `fname`, `lname`, `gender`, `link`, `short_name`, `picture`, `cover`, `index_number`,`state`,`lastvisit`,`email`)' +
        ' VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ' +
        'ON DUPLICATE KEY UPDATE ' +
        '`lastvisit` = VALUES(lastvisit),' +
        '`name` = VALUES(name),' +
        '`fname` = VALUES(fname),' +
        '`lname` = VALUES(lname),' +
        '`link` = VALUES(link),' +
        '`short_name` = VALUES(short_name),' +
        '`picture` = VALUES(picture),' +
        '`cover` = VALUES(cover),' +
        '`email` = VALUES(email);';
    mysql.query(query,[
        req.facebookVerification.id,
        req.facebookVerification.name,
        req.facebookVerification.first_name,
        req.facebookVerification.last_name,
        req.facebookVerification.gender,
        req.facebookVerification.link,
        req.facebookVerification.short_name,
        req.facebookVerification.picture.data.url,
        req.facebookVerification.cover ? req.facebookVerification.cover.source : '',
        req.facebookVerification.indexNumber,
        req.facebookVerification.state,
        new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' }),
        req.facebookVerification.email
    ],function (error, _payload) {
        if (error){
            logger.log(error.sqlMessage,'crit',true, JSON.stringify(_.assignIn(error,{
                meta: req.facebookVerification,
                env: req.headers.host
            })));
            res.status(500).send({ error: error });
        }
    });
    res.send(req.facebookVerification);
});

router.get('/state/:indexNumber',function (req,res) {
    let indexNumber = parseInt(req.params['indexNumber']) || 0;
    mysql.query(queryValidateIndexNumber,[indexNumber],function (error,payload) {
        if (!error){
            if (payload[0]){
                res.send(payload[0]);
            }else{
                res.send({
                    indexNumber : indexNumber,
                    state: 'not-found'
                });
            }
        }else{
            logger.log(error.sqlMessage,'crit',true, JSON.stringify(_.assignIn(error,{
                meta: req.facebookVerification,
                env: req.headers.host
            })));
            res.status(500).send({ error: error });
        }
    })
});

router.post('/request',function (req,res) {
    let alternateEmail = req.body.email || null;
    let indexNumber = req.body.indexNumber || 0;

   if(req.facebookVerification.state !== 'guest'){
       res.status(400).send({
           error: {
               code: 0x003,
               message: `Required the requester's state to be \`guest\`, \`${req.facebookVerification.state}\` found.`
           }
       });
       return;
   }

    mysql.query(queryValidateIndexNumber,[indexNumber],function (error,payload) {
        if (!error){
            if (payload[0]){
                let indexNumberDetails = payload[0];
                if (indexNumberDetails.state === 'available'){
                    let query = "UPDATE facebook " +
                            "SET `facebook`.`state`='pending', " +
                                "`facebook`.`index_number` = ?, " +
                                "`facebook`.`alternate_email` = ? " +
                            "WHERE `facebook`.`state`='guest' and `facebook`.`id`=?;";
                    mysql.query(query,[indexNumber, alternateEmail, req.facebookVerification.id],function (error_q2,payload_q2) {
                        if (!error_q2){
                            if (payload_q2.changedRows === 1){
                                res.send({
                                    success: true,
                                    info: payload_q2
                                });
                            }else{
                                logger.log(payload_q2,'crit',true, JSON.stringify(_.assignIn(payload_q2,{
                                    meta: req.facebookVerification,
                                    env: req.headers.host,
                                    data: req.body,
                                    endpoint: '/request'
                                })));
                                res.status(500).send({ error: payload_q2 });
                            }
                        }else {
                            logger.log(error_q2.sqlMessage,'crit',true, JSON.stringify(_.assignIn(error_q2,{
                                meta: req.facebookVerification,
                                env: req.headers.host,
                                data: req.body,
                                endpoint: '/request'
                            })));
                            res.status(500).send({ error: error_q2 });
                        }
                    });
                }else{
                    res.status(400).send({
                        error: {
                            code: 0x002,
                            message: `State of the Index number required to be \`available\`, \`${indexNumberDetails.state}\` found.`
                        }
                    });
                }
            }else{
                res.status(400).send({
                    error: {
                        code: 0x001,
                        message: 'Required field `indexNumber` was not found.'
                    }
                });
            }
        }else{
            logger.log(error.sqlMessage,'crit',true, JSON.stringify(_.assignIn(error,{
                meta: req.facebookVerification,
                env: req.headers.host
            })));
            res.status(500).send({ error: error });
        }
    })

});

module.exports = router;