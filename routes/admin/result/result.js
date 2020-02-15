const express = require('express');
const router = express.Router();
const _ = require('lodash');
const messenger = require('../../../modules/messenger');

const log = require('perfect-logger');
const mysql = require('../../../modules/database');
const fbPage = require('../../../modules/facebook-page');

let releasedSubjects = [];

function validateSubject(subjectCode = '') {
    return new Promise(function (resolve,reject) {
        mysql.query('SELECT * FROM `subject` WHERE `code` = ?', [subjectCode], function (error, payload) {
            if (!error){
                resolve(payload);
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
    }else if(['A+','A','A-','B+','B','B-','C+','C','C-','D+','D','D-','E','F','MC','CM','NC'].indexOf(grade) === -1){
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
    .then((subjectCodeValidityReport)=>{
        if (subjectCodeValidityReport.length > 0){
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
                                releasedSubjects.push({
                                    subjectCode: subjectCode,
                                    subjectName: subjectCodeValidityReport[0].name,
                                    examinationYear: examYear
                                })
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
    mysql.query('SELECT DISTINCT(LEFT(`index` , 4)) as pattern FROM `result` WHERE `dataset` = ? ;', [datasetId], (e,p)=>{
        if (!e){
            mysql.query('DELETE FROM `dataset` WHERE `id` = ?', [datasetId], function (error, payload) {
                if (!error){
                    if (payload.affectedRows !== 0){
                        let patterns = [];
                        _.forEach(p, (item)=>{
                            patterns.push(item.pattern);
                        })
                        res.send({
                            success: true,
                            afftectedPatterns: patterns,
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
        }else {
            reportError(req, res, error, true);
        }
    })
});

router.get('/subject-list', function (req, res) {
    mysql.query('SELECT `code`,`name` FROM `subject`;', function (err, payload) {
        if (!err){
            res.send(payload);
        }else {
            reportError(req, res, err,true);
        }
    })
});

router.get('/datasets/:code', function (req, res) {
    let code = req.params['code'];
    mysql.query('SELECT * FROM `dataset` WHERE `subject` = ?;', [code],function (err, payload) {
        if (!err){
            res.send(payload);
        }else {
            reportError(req, res, err,true);
        }
    })
});

router.get('/last-datasets/:qt', function (req, res) {
    let quantity = parseInt(req.params['qt']);
    mysql.query('SELECT * FROM `dataset` ORDER BY `id` DESC LIMIT ?;',
        [quantity],function (err, payload) {
        if (!err){
            res.send(payload);
        }else {
            reportError(req, res, err,true);
        }
    })
});

router.post('/facebook/publish', function (req, res) {
    let i = 0;
    let msg = "New Results Released:\n";
    for (i = 0; i < releasedSubjects.length; i++)
    {
        const subject = releasedSubjects[i];
        msg += `- ${subject.subjectCode} ${subject.subjectName} [${subject.examinationYear}]\n`
    }
    msg += '\nVisit https://ucscresults.herokuapp.com/ to view your results.\nThis is an automated message.'
    fbPage.createPost(msg);
    releasedSubjects = [];
    res.send({});
})

module.exports = router;
