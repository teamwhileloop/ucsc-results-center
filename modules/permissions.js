const _ = require('lodash');
const crypto = require('crypto');
const log = require('perfect-logger');
const postman = require('../modules/postman');
const mysql = require('../modules/database.js');
const facebook = require('../modules/facebook');
const credentials = require('../modules/credentials');
const permissionJSON = require('../configs/permission');

let permissionCollection = {};
_.forEach(Object.keys(permissionJSON),function (mainRoute) {
    _.forEach(Object.keys(permissionJSON[mainRoute]['routes']),function (subRoute) {
        permissionCollection[`^/${mainRoute}${subRoute}$`] = permissionJSON[mainRoute]['routes'][subRoute];
    });
    permissionCollection[`base:^/${mainRoute}*`] = permissionJSON[mainRoute]['base'];
});

function checkPermission(url='',userPower = 0) {
    let permissionStatus = false;
    let powerRequired = 0;
    let method = 'unset';

    _.some(Object.keys(permissionCollection),function (endpointUrlRegExp) {
        if (endpointUrlRegExp.startsWith('base:')){
            if (new RegExp(endpointUrlRegExp.substr(5),'gm').test(url)){
                method = 'base';
                permissionStatus = permissionCollection[endpointUrlRegExp] <= userPower;
                powerRequired = permissionCollection[endpointUrlRegExp];
                return true;
            }
        }else{
            if (new RegExp(endpointUrlRegExp,'gm').test(url)){
                method = 'url';
                permissionStatus = permissionCollection[endpointUrlRegExp] <= userPower;
                powerRequired = permissionCollection[endpointUrlRegExp];
                return true;
            }
        }
    });

    return {
        status: permissionStatus,
        powerRequired:  powerRequired,
        method : method,
        userPower: userPower
    }
}

module.exports = function() {
    return function(req, res, next) {
        let fbToken = req.header('fbToken');
        let fbUid = req.header('fbUid');
        let accessToken = req.header('accessToken');

        //Grant access when using accessToken
        if (accessToken && crypto.createHash('sha1').update(accessToken).digest('hex') === credentials.accessToken){
            req.accessTokenUsed = true;
            req.facebookVerification = {
                email: 'administrator@ucscresult.com',
                first_name: 'Default',
                last_name: 'Administrator',
                gender: 'male',
                link: '',
                short_name: 'Administrator',
                name: 'Default Administrator',
                id: fbUid || '-21',
                success: true,
                uidMatched: true,
                indexNumber: 0,
                state: 'verified',
                power: 100,
                alternate_email: null,
                alert_version: '8' };
            if (fbUid && !credentials.isDeployed){
                mysql.query("SELECT * FROM `facebook` WHERE `id` = ?;", [fbUid], function (err, payload) {
                    if (!err){
                        if (payload.length > 0){
                            req.facebookVerification = payload[0]
                        }
                        let permissionDetails = checkPermission(req.originalUrl, req.facebookVerification.power);
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
                            log.debug(`Denied access to ${req.originalUrl} for ${req.facebookVerification.name}`);
                        }else{
                            next()
                        }
                    }else{
                        res.status(500).send({
                            systemError: {
                                type: 'database',
                                message: 'Internal server error while executing database query',
                                error: err
                            }
                        });
                        log.crit_nodb('Unable to fetch Facebook user', err);
                    }
                })
            }else {
                next();
            }
            return;
        }

        // Increment API hit counter
        global.APIhits += 1;

        if (!fbToken || !fbUid){
            res.status(401).send({
                error:{
                    message: 'Facebook userID and access token missing',
                    fbUid: fbUid,
                    accessToken: accessToken
                }
            });
            return;
        }

        //Grant access when using FacebookAPI
        facebook.validateAccessToken(fbToken,fbUid)
            .then(validationReport=>{
                req.accessTokenUsed = false;
                mysql.query(
                    'SELECT `index_number` as indexNumber,`state`,`power`,`alternate_email`, `alert_version` ' +
                    'FROM facebook WHERE id=?;',[validationReport.id],
                    function (error,payload) {
                    if(error){
                        log.crit('Failed to validate user',_.assignIn(error,{
                            meta: validationReport,
                            env: req.headers.host,
                            uid: fbUid
                        }));
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
                        let permissionDetails = checkPermission(req.originalUrl,payload[0].power);
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
                            log.debug(`Denied access to ${req.originalUrl} for ${req.facebookVerification.name}`);
                            log.writeData(req.headers);
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
    }
};