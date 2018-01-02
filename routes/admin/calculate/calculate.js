const express = require('express');
const router = express.Router();
const _ = require('lodash');

const logger = require('../../../modules/logger');
const mysql = require('../../../modules/database.js');

let taskLock = false;

function getGradePoint(grade){
    switch (grade){
        case "A+":
            return 4.25;
            break;
        case "A":
            return 4.0;
            break;
        case "A-":
            return 3.75;
            break;
        case "B+":
            return 3.25;
            break;
        case "B":
            return 3.0;
            break;
        case "B-":
            return 2.75;
            break;
        case "C+":
            return 2.25;
            break;
        case "C":
            return 2.0;
            break;
        case "C-":
            return 1.75;
            break;
        case "D+":
            return 1.25;
            break;
        case "D":
            return 1.0;
            break;
        case "D-":
            return 0.75;
            break;
        default:
            return 0;
            break;
    }
}

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
                    resolve(payload);
                }else{
                    reject(error);
                }
            })
    });
}

function setSemesterRankings(pattern, column, updateColumn){
    return new Promise(function(resolve, reject){
        let prevGPA = -1;
        let cur = 0;
        let buffer = 0;
        let valuesQuery = '';
        mysql.query(`SELECT indexNumber, ${column} as gpa FROM undergraduate WHERE indexNumber LIKE '${pattern}%' ORDER BY ${column} DESC;`,
        function (error, payload) {
            if (!error){
                logger.log(`Updating ${updateColumn} with pattern ${pattern} started`);
                _.forEach(payload,function (data) {
                    if (data.gpa === prevGPA){
                        buffer++;
                    }else{
                        cur+= buffer + 1;
                        buffer = 0;
                    }
                    valuesQuery += `(${data.indexNumber}, ${cur}),`;
                    prevGPA = data.gpa;
                    if ((cur+buffer) === payload.length){
                        valuesQuery = valuesQuery.substring(0,valuesQuery.length -1);
                        mysql.query(`INSERT INTO \`results\`.\`undergraduate\`
                                        (  \`indexNumber\`,\`${updateColumn}\`) 
                                    VALUES ${valuesQuery} 
                                    ON DUPLICATE KEY UPDATE \`${updateColumn}\` = VALUES(${updateColumn});`,
                        function (error_update, payload_update) {
                            if (!error_update){
                                logger.log(`Updating ${updateColumn} with pattern ${pattern} completed`);
                                resolve(payload_update);
                            }else{
                                logger.log(`Updating ${updateColumn} with pattern ${pattern} failed`);
                                reject(error_update);
                            }
                        });
                    }
                })
            }else{
                reject(error);
            }
        })
    });


}

function calculateUndergraduateSemesterGPA(indexNumber, semesterInfo) {
    return new Promise(function (resolve, reject) {
        getSemesterResultsByIndex(indexNumber, semesterInfo.year, semesterInfo.semester)
            .then((resultsCollection)=>{
                let credits = 0;
                let gpa = 0;
                let nonGpaCredits = 0;
                let filteredCollection = _.filter(resultsCollection, function(o) { return o.isBest; });
                let progress = 0;
                if (filteredCollection.length === 0){
                    resolve({
                        indexNumber: indexNumber,
                        semester: semesterInfo.semester,
                        year: semesterInfo.year,
                        gpa: 0,
                        credits: 0,
                        nonGpaCredits: 0,
                        results: resultsCollection
                    })
                }
                _.forEach(filteredCollection,function (result) {
                    credits += result.credits;
                    nonGpaCredits += result.nonGpaCredits;
                    gpa += getGradePoint(result.grade) * result.credits;
                    progress++;
                    if (progress === filteredCollection.length){
                        resolve({
                            indexNumber: indexNumber,
                            semester: semesterInfo.semester,
                            year: semesterInfo.year,
                            gpa: gpa/credits,
                            credits: credits,
                            nonGpaCredits: nonGpaCredits,
                            results: resultsCollection
                        })
                    }
                })
            })
            .catch((error)=>{
                reject(error);
            })
    })
}

router.post('/pattern/:pattern',function (req,res) {
    let academicYear = parseInt(req.body.year);
    let academicSemester = parseInt(req.body.semester);
    let pattern = parseInt(req.params['pattern']);
    let runOverallGpaUpdate = !!req.body.overallUpdate;
    let taskReport = {
        success: true,
        body: req.body,
        pattern: pattern,
        errors: []
    };
    const startTime = new Date();

    // academicYear validation
    // if (!new RegExp('^[1-4]$','gm').test(academicYear)){
    //     res.status(400).send({
    //         error: {
    //             code: 0x001,
    //             message: `Invalid academic year ${academicYear}`
    //         }
    //     });
    //     return;
    // }
    //
    // // academicSemester validation
    // if (!new RegExp('^[1-2]$','gm').test(academicSemester)){
    //     res.status(400).send({
    //         error: {
    //             code: 0x002,
    //             message: `Invalid academic semester ${academicSemester}`
    //         }
    //     });
    //     return;
    // }

    // pattern validation
    if (!new RegExp('^[0-9]{2}(00|02)$','gm').test(pattern)){
        res.status(400).send({
            error: {
                code: 0x003,
                message: `Invalid pattern ${req.params['pattern']}`
            }
        });
        return;
    }

    if (taskLock){
        res.status(423).send({
            error: {
                code: 0x004,
                message: 'A task is already in progress'
            }
        });
        return;
    }

    taskLock = true;
    getUndergraduates(pattern)
        .then((undergraduateList)=>{
            logger.log(`Undergraduates list received for pattern ${pattern} after ${logger.timeSpent(startTime)}`);
            getCompletedSemesters(pattern)
                .then((completedSemesters)=>{
                    let overallProgress = 0;
                    let successCount = 0;
                    logger.log(`Semester list received for pattern ${pattern} after ${logger.timeSpent(startTime)}`);
                    logger.log(`Starting calculations for patten ${pattern} at ${logger.timeSpent(startTime)}`);
                    _.forEach(completedSemesters,function (semester) {
                        let valuesQuery = '';
                        let completedUgs = 0;
                        let completedPercentage = 0.0;
                        _.forEach(undergraduateList,function (undergraduate) {
                            calculateUndergraduateSemesterGPA(undergraduate.indexNumber, semester)
                                .then((GpaData)=>{
                                    completedUgs += 1;
                                    overallProgress += 1;
                                    valuesQuery += `(${undergraduate.indexNumber}, ${GpaData.gpa}, NULL, ${GpaData.credits},  ${GpaData.nonGpaCredits}) ,`;
                                    completedPercentage = parseFloat(overallProgress*100.0/(undergraduateList.length*completedSemesters.length)).toFixed(2);
                                    logger.setLiveText(`Calculation progress for pattern '${pattern}' ${completedPercentage}%`);
                                    if (completedUgs === undergraduateList.length){
                                        valuesQuery = valuesQuery.substring(0,valuesQuery.length -1);
                                        logger.log(`Submitting Query for Y${semester.year}S${semester.semester} after ${logger.timeSpent(startTime)}`);
                                        mysql.query(`INSERT INTO \`results\`.\`undergraduate\`
                                                        (  \`indexNumber\`, 
                                                            \`y${semester.year}s${semester.semester}_gpa\`, 
                                                            \`y${semester.year}s${semester.semester}_rank\`, 
                                                            \`y${semester.year}s${semester.semester}_credits\`, 
                                                            \`y${semester.year}s${semester.semester}_credits_non_gpa\`) 
                                                    VALUES ${valuesQuery} 
                                                    ON DUPLICATE KEY UPDATE 
                                                        \`indexNumber\` = VALUES(\`indexNumber\`), 
                                                        \`y${semester.year}s${semester.semester}_gpa\`             = VALUES(\`y${semester.year}s${semester.semester}_gpa\`), 
                                                        \`y${semester.year}s${semester.semester}_rank\`            = VALUES(\`y${semester.year}s${semester.semester}_rank\`), 
                                                        \`y${semester.year}s${semester.semester}_credits\`         = VALUES(\`y${semester.year}s${semester.semester}_credits\`), 
                                                        \`y${semester.year}s${semester.semester}_credits_non_gpa\` = VALUES(\`y${semester.year}s${semester.semester}_credits_non_gpa\`);`,
                                        function (error, payload) {
                                            if (!error){
                                                logger.log(`Calculation completed for Y${semester.year}S${semester.semester} after ${logger.timeSpent(startTime)}`);
                                                successCount += 1;

                                                let localSuccessCount = successCount;
                                                setSemesterRankings(pattern,`y${semester.year}s${semester.semester}_gpa`,`y${semester.year}s${semester.semester}_rank`)
                                                .then((response)=>{
                                                    //RANKING CALCULATION
                                                    if (localSuccessCount === completedSemesters.length){
                                                        if (runOverallGpaUpdate){
                                                            // TODO : ADD OVERALL GPA, RANK CALCULATION
                                                        }else{
                                                            if (taskReport.success){
                                                                logger.log(`Calculation successfully completed for pattern ${pattern} after ${logger.timeSpent(startTime)}`);
                                                                logger.setLiveText('');
                                                                taskLock = false;
                                                                res.send({
                                                                    success: true,
                                                                    timeSpent: logger.timeSpent(startTime)
                                                                })
                                                            }else{
                                                                console.log(taskReport);
                                                                logger.log(`Calculation completed with failures for pattern ${pattern} after ${logger.timeSpent(startTime)}`,'crit',true,taskReport);
                                                                res.status(500).send({
                                                                    success: false,
                                                                    errors: taskReport.errors,
                                                                    timeSpent: logger.timeSpent(startTime)
                                                                })
                                                            }
                                                        }

                                                    }
                                                })
                                                .catch((error_ranking)=>{
                                                    logger.log(error_ranking.sqlMessage,'crit',true, JSON.stringify(_.assignIn(error_ranking,{
                                                        meta: req.facebookVerification,
                                                        env: req.headers.host
                                                    })));
                                                    taskReport.errors.push(error_ranking);
                                                    taskReport.success = false;
                                                });
                                            }else{
                                                logger.log(error.sqlMessage,'crit',true, JSON.stringify(_.assignIn(error,{
                                                    meta: req.facebookVerification,
                                                    env: req.headers.host
                                                })));
                                                taskReport.errors.push(error);
                                                taskReport.success = false;
                                            }
                                        })
                                    }
                                })
                                .catch((error)=>{
                                    completedUgs += 1;
                                    overallProgress += 1;
                                    logger.log(error.sqlMessage,'crit',true, JSON.stringify(_.assignIn(error,{
                                        meta: req.facebookVerification,
                                        env: req.headers.host
                                    })));
                                    taskReport.errors.push(error);
                                    taskReport.success = false;
                                });
                        });
                    })
                })
                .catch((error)=>{
                    logger.log(error.sqlMessage,'crit',true, JSON.stringify(_.assignIn(error,{
                        meta: req.facebookVerification,
                        env: req.headers.host
                    })));
                    res.status(500).send({ error: error });
                    taskLock = false;
                });
        })
        .catch((error)=>{
            logger.log(error.sqlMessage,'crit',true, JSON.stringify(_.assignIn(error,{
                meta: req.facebookVerification,
                env: req.headers.host
            })));
            res.status(500).send({ error: error });
            taskLock = false;
        })
});

router.get('/test',function (req,res) {
    setSemesterRankings('1400','y1s1_gpa','y1s1_rank')
    .then((response)=>{
        res.send(response);
    })
});

module.exports = router;