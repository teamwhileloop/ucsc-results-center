const express = require('express');
const router = express.Router();

const log = require('perfect-logger');
const mysql = require('../../../modules/database');
const postman = require('../../../modules/postman');
const _ = require('lodash');

function reportError(req, res, error, sendResponse = false) {
    log.crit(error.sqlMessage, _.assignIn(error,{
        meta: req.facebookVerification,
        env: req.headers.host
    }));
    if (sendResponse){
        res.status(500).send({ error: error });
    }
}

function getUserDetails(fbId = 0) {
    return new Promise((resolve, _reject)=>{
        mysql.query('SELECT * FROM `facebook` WHERE `facebook`.`id` = ?', [fbId], function (error, payload) {
            if (!error){
                resolve(payload)
            }else{
                log.crit(error.sqlMessage, error);
            }
        })
    })
}

router.get('/',function (req,res) {
    let page = parseInt(req.query.page) || 1;
    let count = parseInt(req.query.count) || 999999;
    let state = req.query.state || 'e';
    let sort = req.query.sort || 'name';
    let search = req.query.search || '';
    if (['name', 'fname', 'lname', 'id' ].indexOf(sort) === -1){
        res.status(400).send({
            error: {
                code: 0x001,
                message: `Invalid sort command ${sort}`
            }
        });
        return;
    }

    mysql.query(`SELECT \`tblMain\`.*, \`facebook\`.\`name\` as 'handlerName'  FROM (SELECT * FROM \`facebook\` WHERE \`state\` LIKE ? AND (\`name\` LIKE ? OR \`index_number\` LIKE ?) ORDER BY ${sort} LIMIT ?,?) as tblMain LEFT JOIN \`facebook\` ON \`facebook\`.\`id\` = \`tblMain\`.\`handle\`;`,
    // mysql.query(`SELECT x\`main\`.*, \`facebook\`.\`name\` as handlerName FROM \`facebook\` as main LEFT JOIN \`facebook\` ON \`main\`.\`handle\` = \`facebook\`.\`id\` AND \`main\`.\`state\` LIKE ? AND (\`main\`.\`name\` LIKE ? OR \`main\`.\`index_number\` LIKE ?) ORDER BY \`main\`.\`${sort}\` ASC LIMIT ?,?;`,
    [`%${state}%`, `%${search}%`, `%${search}%`, (page - 1)*count, count],
    function (err, payload) {
        if (!err){
            mysql.query('SELECT COUNT(*) as total FROM `facebook` WHERE `state` LIKE ? AND (`name` LIKE ? OR `index_number` LIKE ?) ',
            [`%${state}%`, `%${search}%`, `%${search}%`, ],
            function (err_meta, payload_meta) {
                if (!err_meta){
                    res.send({
                        meta:{
                            page: page,
                            count: count,
                            state: state || 'all',
                            total: payload_meta[0].total,
                            totalPages: Math.ceil(payload_meta[0].total / count)
                        },
                        data: payload
                    });
                }else {
                    reportError(req, res, err, true);
                }
            });
        }else{
            reportError(req, res, err, true);
        }
    });
});

router.patch('/:fbId', function (req, res) {
    let fbId = parseInt(req.params['fbId']) || 0;
    let state = req.body.state;
    if (['verified', 'pending', 'blocked', 'guest' ].indexOf(state) === -1){
        res.status(400).send({
            error: {
                code: 0x001,
                message: `Invalid user state ${state}`
            }
        });
        return;
    }

    log.debug(`User state change for ${fbId} to ${state} requested by ${req.facebookVerification.name}`);

    mysql.query('SELECT * FROM `facebook` WHERE `id` = ?', [fbId], function (err_check, payload_check) {
        if (!err_check){
            if (payload_check.length){
                let power = 0;
                log.debug(`User state change for ${payload_check[0].name}(${fbId}) in progress`);
                switch (state){
                    case 'verified':
                        power = payload_check[0].power > 10 ? payload_check[0].power : 10;
                        break;
                    case 'pending':
                        power = payload_check[0].power > 10 ? payload_check[0].power : 0;
                        break;
                    case 'blocked':
                        power = payload_check[0].power > 10 ? payload_check[0].power : 0;
                        break;
                    case 'guest':
                        power = payload_check[0].power > 10 ? payload_check[0].power : 0;
                        break;
                }
                mysql.query(
                'UPDATE `facebook` SET `state` = ?, `power` = ?, `handle` = ? WHERE `id` = ?;',
                [state, power, req.facebookVerification.id || -1, fbId],
                function (err, payload) {
                    if (!err){
                        if (payload.affectedRows === 0){
                            res.send({
                                success: false,
                                code: 0x001,
                                message: `User with fbId ${fbId} was not found`
                            });
                            log.debug(`User State change request for ${fbId} to ${state} failed: User not found`);
                        }else{
                            res.send({
                                success: true
                            });
                            log.info(`User State change request by ${req.facebookVerification.name} for ${payload_check[0].name}(${fbId}) to ${state} completed.`);
                        }
                    }else{
                        reportError(req, res, err, true);
                    }
                });
            }else{
                res.send({
                    success: false,
                    code: 0x001,
                    message: `User with fbId ${fbId} was not found`
                });
                log.debug(`User State change request for ${fbId} to ${state} failed: User not found`);
            }
        }else{
            reportError(req, res, err_check, true);
        }
    })
});

router.post('/approve/:fbId', function (req, res) {
    let fbId = parseInt(req.params['fbId']) || 0;
    mysql.query(
        'UPDATE ' +
            '`facebook` ' +
        'SET `state` = ?, ' +
            '`power` = IF(`power` > 10, `power`, 10), ' +
            '`handle` = ? ' +
        'WHERE `id` = ? AND `state` = \'pending\';',
        ['verified', req.facebookVerification.id || -1, fbId],
        function (err, payload) {
            if (!err){
                if (payload.affectedRows === 0){
                    res.send({
                        success: false,
                        code: 0x001,
                        message: `User with fbId ${fbId} in 'pending' state was not found`
                    })
                }else{
                    res.send({
                        success: true
                    });
                    getUserDetails(fbId).then((response)=>{
                        log.info(`Join Request of ${response[0].name} was accepted by ${req.facebookVerification.name}`);
                        postman.sendTemplateMail(
                            response[0].alternate_email || response[0].email,
                            'Request Accepted',
                            'templates/emails/request-approved.ejs',
                            {
                                firstName: response[0].short_name
                            }
                        );
                    });
                }
            }else{
                reportError(req, res, err, true);
            }
        });
});

router.post('/reject/:fbId', function (req, res) {
    let fbId = parseInt(req.params['fbId']) || 0;
    mysql.query(
        'UPDATE ' +
            '`facebook` ' +
        'SET `state` = ?, ' +
            '`power` = IF(`power` > 10, `power`, 0), ' +
            '`handle` = ?, ' +
            '`index_number` = NULL' +
        'WHERE `id` = ? AND `state` = \'pending\';',
        ['blocked', req.facebookVerification.id || -1, fbId],
        function (err, payload) {
            if (!err){
                if (payload.affectedRows === 0){
                    res.send({
                        success: false,
                        code: 0x001,
                        message: `User with fbId ${fbId} in 'pending' state was not found`
                    })
                }else{
                    res.send({
                        success: true
                    });
                    getUserDetails(fbId).then((response)=>{
                        log.info(`Join Request of ${response[0].name} was rejected by ${req.facebookVerification.name}`);
                        postman.sendTemplateMail(
                            response[0].alternate_email || response[0].email,
                            'Request Rejected',
                            'templates/emails/request-rejected.ejs',
                            {
                                firstName: response[0].short_name
                            }
                        );
                    });
                }
            }else{
                reportError(req, res, err, true);
            }
        });
});

router.post('/reset/:fbId', function (req, res) {
    let fbId = parseInt(req.params['fbId']) || 0;
    log.debug(`User state reset for ${fbId} was requested by ${req.facebookVerification.name}`);
    mysql.query(
        'UPDATE ' +
            '`facebook` SET `state` = ?, ' +
            '`power` = IF(`power` > 10, `power`, 0), ' +
            '`index_number` = NULL, ' +
            '`handle` = ? ' +
        'WHERE `id` = ?;',
        ['guest', req.facebookVerification.id || -1, fbId],
        function (err, payload) {
            if (!err){
                if (payload.affectedRows === 0){
                    res.send({
                        success: false,
                        code: 0x001,
                        message: `User with fbId ${fbId} was not found`
                    });
                    log.debug(`User state reset failed: ${fbId} not found`);
                }else{
                    res.send({
                        success: true
                    });
                    log.info(`User state of ${fbId} was resetted as requested by ${req.facebookVerification.name}`);
                }
            }else{
                reportError(req, res, err, true);
            }
        });
});

router.post('/role', function (req, res) {
    log.debug(`Role change request received from ${req.facebookVerification.name}`);
    log.writeData(req.body);
    let targetId = req.body.id || '-1';
    let newPower = parseInt(req.body.power) || 0;

    if (targetId === '-1'){
        res.status(400).send({
            success: false,
            error: 'Invalid user id'
        });
        return;
    }

    if (newPower < 10){
        res.status(400).send({
            success: false,
            error: `New power cannot be less than 10 (< ${newPower})`
        });
        return;
    }

    if (req.facebookVerification.id === targetId){
        res.status(403).send({
            success: false,
            error: `You cannot promote or demote yourself. Self demoting and promoting is forbidden.`
        });
        return;
    }

    const query = "UPDATE `facebook` SET `power` = ? WHERE `id` = ? AND `power` >= 10;";
    mysql.query(query, [newPower, targetId], function(err, payload){
        if (err){
            reportError(req, res, err, true);
            return;
        }

        mysql.query("SELECT `name`, `power` from `facebook` WHERE `id` = ?;",[targetId], function (err, resp) {
            log.warn(`${req.facebookVerification.name} change the power of ${resp[0].name} to ${newPower}`);
        });

        if (payload.affectedRows === 0){
            res.status(404).send({
                success: false,
                error: `User(${targetId}) not found.`
            });
        }else{
            res.send({
                success: true
            });
        }
    });
});

module.exports = router;