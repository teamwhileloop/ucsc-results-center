const express = require('express');
const _ = require('lodash');
const router = express.Router();

let logger = require('../../modules/logger');
let mysql = require('../../modules/database');

let cacheRankings = {};

function reportError(req, res, error, sendResponse = false) {
    logger.log(error.sqlMessage || error,'crit',true, JSON.stringify(_.assignIn(error,{
        meta: req.facebookVerification,
        env: req.headers.host
    })));
    if (sendResponse){
        res.status(500).send({ error: error });
    }
}

function checkProfileStatus(indexNumber = 0) {
    return new Promise(function (resolve, reject) {
        mysql.query('SELECT * FROM `undergraduate` WHERE `indexNumber` = ?', indexNumber, function (error, payload) {
            if (!error){
                resolve({
                    status : payload.length ? payload[0].privacy : 'not-found',
                    summary : payload.length ? payload[0] : null
                });
            }else {
                reject(error);
            }
        })
    })
}

function getCompletedSemesters(pattern) {
    return new Promise(function (resolve, reject) {
        mysql.query("SELECT DISTINCT `year`, `semester`  FROM " +
            "(SELECT DISTINCT `subject` from `result` WHERE `index` LIKE ?) as dst " +
            "JOIN subject ON `dst`.`subject` = `subject`.`code`",
            [`${pattern}%`],
            function (error, payload) {
                if(!error){
                    resolve(payload);
                }else{
                    reject(error);
                }
            })
    });
}

function getSemesterResultsByIndex(indexNumber, year, semester) {
    return new Promise(function (resolve, reject) {
        mysql.query("SELECT *, isBest(id) as isBest FROM ( " +
            "SELECT * FROM ( " +
            "SELECT * FROM `result` WHERE `index` = ? " +
            ") AS ugSubjects JOIN `subject` ON `ugSubjects`.`subject` = `subject`.`code` " +
            ") AS `o` WHERE `o`.`year`=? AND `o`.`semester`=?;",
            [indexNumber, year, semester],
            function (error, payload) {
                if (!error){
                    resolve({
                        year: year,
                        semester: semester,
                        results: payload
                    });
                }else{
                    reject(error);
                }
            })
    });
}

function privacyPermission(currentUserIndex, targetUserIndex, privacyState) {
    // accessToken ByPass
    if (currentUserIndex === 0){
        logger.log(`AccessToken Bypass for ${targetUserIndex}`);
        return true;
    }

    switch (privacyState){
        case 'public':
            return true;
        case 'private':
            return currentUserIndex === targetUserIndex;
        case 'batch':
            return parseInt(currentUserIndex.toString().substring(0,2)) === parseInt(targetUserIndex.toString().substring(0,2));
        case 'not-found':
            return true;
    }
}

function getBatchRankings(indexNumber, req) {
    let pattern = indexNumber.toString().substring(0,4);
    if (cacheRankings[pattern]){
        return Promise.resolve(cacheRankings[pattern]);
    }else{
        return new Promise(function (resolve, reject) {
            let query = `SELECT \`indexNumber\`,\`gpa\`,\`rank\`,\`privacy\` FROM \`undergraduate\` WHERE \`indexNumber\` LIKE '${pattern}%' ORDER BY \`rank\` ASC`;
            mysql.query(query, function (error, payload) {
                if (!error){
                    _.forEach(payload, function (value, key) {
                        if (!privacyPermission(req.facebookVerification.indexNumber || 0, value.indexNumber, value.privacy)){
                            console.log(req.facebookVerification.indexNumber || 0, value.indexNumber, value.privacy);
                            payload[key]['privacy'] = 'private';
                            delete payload[key]['indexNumber'];
                            delete payload[key]['gpa'];
                            delete payload[key]['rank'];
                        }
                    });
                    cacheRankings[pattern] = payload;
                    resolve(payload);
                }else {
                    reject(error);
                }
            });
        })
    }
}

router.get('/:indexNumber',function (req,res) {
    let indexNumber = parseInt(req.params['indexNumber']);
    checkProfileStatus(indexNumber)
    .then((profileSummary)=>{
        let permissionStatus = privacyPermission(req.facebookVerification.indexNumber || 0, indexNumber, profileSummary.status);
        if (permissionStatus){
            if (profileSummary.status === 'not-found'){
                res.send({ status: 'not-found' });
                return;
            }
            getCompletedSemesters(indexNumber)
            .then((completedSemesters)=>{
                profileSummary.completedSemesters = completedSemesters;

                let promiseArray = [];
                _.forEach(completedSemesters,function (o) {
                    promiseArray.push(getSemesterResultsByIndex(indexNumber, o.year, o.semester));
                });

                Promise.all(promiseArray)
                .then((resultsData)=>{
                    profileSummary.results = resultsData;
                    getBatchRankings(indexNumber, req)
                    .then((rankingData)=>{
                        profileSummary.rankingData = rankingData;
                        res.send(profileSummary);
                    })
                    .catch((error)=>{
                        reportError(req, res, error, true)
                    })
                })
                .catch((error)=>{
                    reportError(req, res, error, true)
                })

            })
            .catch((error)=>{
                reportError(req, res, error, true)
            })
        }else{
            res.send({ status: 'private' })
        }
    })
    .catch((error)=>{
        reportError(req, res, error, true)
    })
});

router.delete('/cache',function (req,res) {
    cacheRankings = {};
    res.send({ success: true });
});

module.exports = router;