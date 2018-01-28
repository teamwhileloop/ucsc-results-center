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

    // if (page){
    //     paginatedResults = result.slice((page -1)*count, ((page -1)*count) + count);
    // }
    // res.send({
    //     meta:{
    //         page: page,
    //         count: count,
    //         state: state || 'all',
    //         total: result.length,
    //         totalPages: Math.ceil(result.length / count)
    //     },
    //     data: page ? paginatedResults : result
    // });
});

module.exports = router;