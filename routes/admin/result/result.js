const express = require('express');
const router = express.Router();
const _ = require('lodash');
const messenger = require('../../../modules/messenger');

const log = require('perfect-logger');
const mysql = require('../../../modules/database');

function validateSubject(subjectCode = '') {
    return new Promise(function (resolve,reject) {
        mysql.query('SELECT COUNT(`code`) as count FROM `subject` WHERE `code` = ?', [subjectCode], function (error, payload) {
            if (!error){
                resolve(payload[0]['count'] === 1);
            }else {
                reject(error);
            }
        })
    });
}

function createNewDatasetEntry(subjectCode, description) {
    return new Promise(function (resolve,reject) {
        let date;
        date = new Date();
        date = date.getUTCFullYear() + '-' +
            ('00' + (date.getUTCMonth()+1)).slice(-2) + '-' +
            ('00' + date.getUTCDate()).slice(-2) + ' ' +
            ('00' + date.getUTCHours()).slice(-2) + ':' +
            ('00' + date.getUTCMinutes()).slice(-2) + ':' +
            ('00' + date.getUTCSeconds()).slice(-2);
        mysql.query("INSERT INTO `dataset` (`subject`, `description`, `date`) VALUES ( ?,?,? );",
            [subjectCode, description, date],
            function (error, payload) {
                if (!error) {
                    resolve(payload.insertId);
                } else {
                    reject(error);
                }
            });
    });
}

function reportError(req, res, error, sendResponse = false) {
    log.crit(error.sqlMessage, _.assignIn(error,{
        meta: req.facebookVerification,
        env: req.headers.host
    }));
    if (sendResponse){
        res.status(500).send({ error: error });
    }
    console.trace(error)
}

function reportBadRequest(res, code, message) {
    res.status(400).send({
        error: {
            code: code,
            message: message
        }
    });
    log.debug(`Bad Results endpoint call: ${message}`);
}

function validateResult(index, grade) {
    if (!new RegExp('^[0-9]{2}(00|02)[0-9]{4}$').test(index)){
        return {
            success: false,
            grade: grade,
            indexNumber: index,
            reason: 'Invalid index number'
        }
    }else if(['A+','A','A-','B+','B','B-','C+','C','C-','D+','D','D-','E','F','MC'].indexOf(grade) === -1){
        return {
            success: false,
            grade: grade,
            indexNumber: index,
            reason: 'Invalid grade'
        }
    }else{
        return {
            success: true,
            grade: grade === 'F' ? 'MC' : grade,
            indexNumber: index
        }
    }
}

router.post('/dataset',function (req,res) {
    let subjectCode = req.body.subject;
    let examYear = req.body.year;
    let resultData = req.body.data;

    // Year validation
    if (!new RegExp('^[0-9]{4}$').test(examYear)){
        reportBadRequest(res, 0x001, `Invalid examination year ${examYear}`);
        return;
    }

    // Data validation
    if (typeof resultData !== 'object'){
        reportBadRequest(res, 0x003, `Invalid result data. Expected object but received ${typeof resultData}`);
        return;
    }
    if (Object.keys(resultData).length === 0){
        reportBadRequest(res, 0x003, `Invalid result data. Result data keys length returned 0`);
        return;
    }

    validateSubject(subjectCode)
    .then((subjectCodeValidity)=>{
        if (subjectCodeValidity){
            createNewDatasetEntry(subjectCode, req.facebookVerification.id || 'API Token')
            .then((datasetId)=>{
                let mainQuery = 'INSERT INTO `result` (`index`, `subject`, `grade`, `examYear`, `dataset`) VALUES ';
                let valuesQuery = '';
                let failedTasks = [];
                let completed = 0;
                _.forEach(Object.keys(resultData), function (indexNumber) {
                    let resultValidation = validateResult(indexNumber, resultData[indexNumber]);
                    if (resultValidation.success){
                        valuesQuery += `(${resultValidation.indexNumber}, '${subjectCode}', '${resultValidation.grade}', ${examYear}, ${datasetId}),`;
                    }else{
                        failedTasks.push(resultValidation);
                    }
                    completed += 1;
                    if (completed === Object.keys(resultData).length){
                        valuesQuery = valuesQuery.substring(0,valuesQuery.length -1);
                        let query = mainQuery + valuesQuery;
                        mysql.query(query,function (error_insertion, payload_insertion) {
                            if (!error_insertion){
                                log.info(`Dataset for ${subjectCode} examination year ${examYear} processing completed. ${failedTasks.length} indexes failed.`);
                                res.header('datasetId' , datasetId );
                                res.send({
                                    success: true,
                                    failed: failedTasks,
                                    datasetId: datasetId
                                });
                                messenger.sendToEventSubscribers('system_new_dataset',
                                    `Dataset for ${subjectCode} examination year ${examYear} processing completed.`);
                            }else{
                                log.crit(`Dataset for ${subjectCode} examination year ${examYear} processing failed.`, error_insertion);
                                reportError(req, res, error_insertion, true);
                            }
                        })
                    }
                })
            })
            .catch((error_datasetEntry)=>{
                console.log(error_datasetEntry);
                reportError(req, res, error_datasetEntry, true);
            })
        }else{
            reportBadRequest(res, 0x002, `Invalid subject code ${subjectCode}`);
        }
    })
    .catch((error_subjectCodeValidation)=>{
        reportError(req,res,error_subjectCodeValidation,true);
    });
});

router.delete('/dataset/:id',function (req,res) {
    let datasetId = parseInt(req.params['id']);
    mysql.query('DELETE FROM `dataset` WHERE `id` = ?', [datasetId], function (error, payload) {
        if (!error){
            if (payload.affectedRows !== 0){
                res.send({
                    success: true,
                    payload: payload
                });
                log.info(`Result dataset ${datasetId} was deleted as requested by ${req.facebookVerification.name}`);
            }else{
                res.status(404).send({
                    success : false
                })
            }
        }else {
            reportError(req, res, error, true);
        }
    })
});

module.exports = router;
