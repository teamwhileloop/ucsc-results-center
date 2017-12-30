const express = require('express');
const router = express.Router();

const _ = require('lodash');
const crypto = require('crypto');

const logger = require('../modules/logger');
const postman = require('../modules/postman');
const mysql = require('../modules/database.js');
let permission = require('../modules/permissions');

//Common Queries
let queryValidateIndexNumber = "SELECT `base`.`index` as `indexNumber`, " +
    "IF (`facebook`.`state` IN ('verified','blocked','pending'), 'conflict', IFNULL(`facebook`.`state`, 'available')) as state " +
    "FROM (SELECT * FROM `result` WHERE `result`.`index` = ? LIMIT 1) AS `base` " +
    "LEFT OUTER JOIN `facebook` " +
    "ON `facebook`.`index_number` = `base`.`index`;";

// Authentication and Verification Middleware
router.use('/', permission());

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