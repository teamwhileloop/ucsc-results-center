const express = require('express');
const router = express.Router();
const _ = require('lodash');

const logger = require('../../../modules/logger');
const mysql = require('../../../modules/database.js');

function getUndergraduates(pattern) {
    return new Promise(function (resolve,reject) {
        mysql.query('SELECT  DISTINCT `result`.`index` as `indexNumber` FROM `result` WHERE `result`.`index` LIKE ? ORDER BY `indexNumber`;',
            [`${pattern}%`]
            ,function (error,payload) {
            if (!error){
                resolve(payload);
            }else{
                reject(error);
            }
        })
    })
}

router.post('/pattern/:pattern',function (req,res) {
    let academicYear = parseInt(req.body.year);
    let academicSemester = parseInt(req.body.semester);
    let pattern = parseInt(req.params['pattern']);

    // academicYear validation
    if (!new RegExp('^[1-4]$','gm').test(academicYear)){
        res.status(400).send({
            error: {
                code: 0x001,
                message: `Invalid academic year ${academicYear}`
            }
        });
        return;
    }

    // academicSemester validation
    if (!new RegExp('^[1-2]$','gm').test(academicSemester)){
        res.status(400).send({
            error: {
                code: 0x001,
                message: `Invalid academic semester ${academicSemester}`
            }
        });
        return;
    }

    // pattern validation
    if (!new RegExp('^[0-9]{2}(00|02)$','gm').test(pattern)){
        res.status(400).send({
            error: {
                code: 0x001,
                message: `Invalid pattern ${req.params['pattern']}`
            }
        });
        return;
    }

    getUndergraduates(pattern)
    .then((data)=>{
        res.send(data);
    })
    .catch((error)=>{
        logger.log(error.sqlMessage,'crit',true, JSON.stringify(_.assignIn(error,{
            meta: req.facebookVerification,
            env: req.headers.host
        })));
        res.status(500).send({ error: error });
    })
});

module.exports = router;