const express = require('express');
const router = express.Router();

const logger = require('../../../modules/logger');
const mysql = require('../../../modules/database');
const _ = require('lodash');

function reportError(req, res, error, sendResponse = false) {
    logger.log(error.sqlMessage,'crit',true, JSON.stringify(_.assignIn(error,{
        meta: req.facebookVerification,
        env: req.headers.host
    })));
    if (sendResponse){
        res.status(500).send({ error: error });
    }
}

router.get('/',function (req,res) {
    let page = parseInt(req.query.page) || 1;
    let count = parseInt(req.query.count) || 999999;
    let state = req.query.state || 'e';

    mysql.query('SELECT * FROM `facebook` WHERE `state` LIKE ? LIMIT ?,?',
    [`%${state}%`, (page - 1)*count, count],
    function (err, payload) {
        if (!err){
            mysql.query('SELECT COUNT(*) as total FROM `facebook` WHERE `state` LIKE ?',
            [`%${state}%`],
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

    mysql.query('SELECT * FROM `facebook` WHERE `id` = ?', [fbId], function (err_check, payload_check) {
        if (!err_check){
            if (payload_check.length){
                let power = 0;
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
                            })
                        }else{
                            res.send({
                                success: true
                            });
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
            }
        }else{
            reportError(req, res, err_check, true);
        }
    })
});

module.exports = router;