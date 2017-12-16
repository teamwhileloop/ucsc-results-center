const express = require('express');
const router = express.Router();

const _ = require('lodash');
const crypto = require('crypto');

const logger = require('../modules/logger');
const postman = require('../modules/postman');
const mysql = require('../modules/database.js');
const facebook = require('../modules/facebook');
let credentials = require('../modules/credentials');

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
        mysql.query('SELECT `index_number` as indexNumber,`state`,`power` FROM facebook WHERE id=?;',[validationReport.id],function (error,payload) {
            if(error){
                logger.log(JSON.stringify(_.assignIn(error,{
                    meta: validationReport,
                    env: req.headers.host,
                    uid: fbUid
                })),'crit',true);
                res.status(500).send({
                    error: error
                });
            }else {
                req.facebookVerification = _.assignIn(validationReport,payload[0]);
                next()
            }
        });
    })
    .catch(errorReport=>{
        res.status(401).send({
            error: errorReport
        });

    });
});

router.get('/validate', function (req, res) {
    res.send({
        _faceboook:req.facebookVerification
    });
});

module.exports = router;