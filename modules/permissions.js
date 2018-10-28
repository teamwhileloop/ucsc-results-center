const _ = require('lodash');
const crypto = require('crypto');
const logger = require('../modules/logger');
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
            req.facebookVerification = {};
            next();
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