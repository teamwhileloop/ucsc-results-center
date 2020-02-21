const express = require('express');
const router = express.Router();
const _ = require('lodash');

const log = require('perfect-logger');
const mysql = require('../../../modules/database.js');
const utilities = require('../../../modules/utilities');

let taskLock = false;

function getGradePoint(grade){
    switch (grade){
        case "A+":
            return 4.25;
        case "A":
            return 4.0;
        case "A-":
            return 3.75;
        case "B+":
            return 3.25;
        case "B":
            return 3.0;
        case "B-":
            return 2.75;
        case "C+":
            return 2.25;
        case "C":
            return 2.0;
        case "C-":
            return 1.75;
        case "D+":
            return 1.25;
        case "D":
            return 1.0;
        case "D-":
            return 0.75;
        default:
            return 0;
    }
}

function getGradePointV2(grade){
    switch (grade){
        case "A+":
            return 4.0;
        case "A":
            return 4.0;
        case "A-":
            return 3.7;
        case "B+":
            return 3.3;
        case "B":
            return 3.0;
        case "B-":
            return 2.7;
        case "C+":
            return 2.3;
        case "C":
            return 2.0;
        case "C-":
            return 1.7;
        case "D+":
            return 1.3;
        case "D":
            return 1.0;
        case "D-":
            return 0.0;
        case "E":
            return 0.0;
        case "F":
            return 0.0;
        default:
            return 0;
    }
}

function reportError(req, res, error, sendResponse = false) {
    log.crit(error.sqlMessage, _.assignIn(error,{
        meta: req.facebookVerification,
        env: req.headers.host
    }));
    if (sendResponse){
        res.status(500).send({ error: error });
    }
}

function getGradePointUsingIndex(indexNumber = '00', grade) {
    const batch = ( parseInt(String(indexNumber).substr(0,2)));
    if (batch < 17) {
        return getGradePoint(grade);
    }

    return getGradePointV2(grade);
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
                        mysql.query(`INSERT INTO \`undergraduate\`
                                        (  \`indexNumber\`,\`${updateColumn}\`) 
                                    VALUES ${valuesQuery} 
                                    ON DUPLICATE KEY UPDATE \`${updateColumn}\` = VALUES(\`${updateColumn}\`);`,
                        function (error_update, payload_update) {
                            if (!error_update){
                                resolve(payload_update);
                            }else{
                                log.crit(`Updating ${updateColumn} with pattern ${pattern} failed`, error_update);
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
                _.forEach(filteredCollection,(result) => {
                    credits += result.credits;
                    nonGpaCredits += result.nonGpaCredits;
                    gpa += getGradePointUsingIndex(indexNumber, result.grade) * result.credits;
                    progress++;
                    if (progress === filteredCollection.length){
                        gpaval = 0;
                        if (credits !== 0){
                            gpaval = gpa/credits;
                        }
                        resolve({
                            indexNumber: indexNumber,
                            semester: semesterInfo.semester,
                            year: semesterInfo.year,
                            gpa: gpaval,
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
    let skipOverallUpdate = req.body.skipOverallUpdate || false;
    let targetSemMode = false;
    let taskReport = {
        success: true,
        body: req.body,
        pattern: pattern,
        errors: []
    };
    const startTime = new Date();

    log.debug(`Running recalculation for pattern ${pattern} as requested by ${req.facebookVerification.name}`);

    // academicYear validation
    if (academicYear && !new RegExp('^[1-4]$','gm').test(academicYear)){
        res.status(400).send({
            error: {
                code: 0x001,
                message: `Invalid academic year ${academicYear}`
            }
        });

        log.debug(`Recalculation task rejected: Invalid academic year: ${academicYear}`);
        return;
    }

    // academicSemester validation
    if (academicYear && !new RegExp('^[1-2]$','gm').test(academicSemester)){
        res.status(400).send({
            error: {
                code: 0x002,
                message: `Invalid academic semester ${academicSemester}`
            }
        });
        log.debug(`Recalculation task rejected: Invalid academic semester: ${academicSemester}`);
        return;
    }else if (academicYear){
        targetSemMode = true;
    }

    // pattern validation
    if (!new RegExp('^[0-9]{2}(00|02)$','gm').test(pattern)){
        res.status(400).send({
            error: {
                code: 0x003,
                message: `Invalid pattern ${req.params['pattern']}`
            }
        });
        log.debug(`Recalculation task rejected: Invalid pattern: ${pattern}`);
        return;
    }

    if (taskLock){
        res.status(423).send({
            error: {
                code: 0x004,
                message: 'A task is already in progress'
            }
        });
        log.debug('Recalculation task rejected: Another recalculation task is in progress');
        return;
    }


    taskLock = true;
    log.debug('Recalculation task lock acquired');
    getUndergraduates(pattern)
        .then((undergraduateList)=>{
            getCompletedSemesters(pattern)
                .then((completedSemesters)=>{
                    let overallProgress = 0;
                    let successCount = 0;

                    if (targetSemMode && _.filter(completedSemesters, { 'semester': academicSemester, 'year': academicYear }).length === 0){
                        taskLock = false;
                        log.debug(`Recalculation task lock released. Y${academicYear}S${academicSemester} for pattern ${pattern} not found`);
                        res.status(404).send({
                            error: {
                                'semester': academicSemester,
                                'year': academicYear
                            }
                        });
                        return;
                    }

                    _.forEach(completedSemesters,function (semester) {
                        let valuesQuery = '';
                        let completedUgs = 0;
                        let completedPercentage = 0.0;
                        let runThisTask = true;

                        if (targetSemMode){
                            if (academicYear === semester.year && academicSemester === semester.semester){
                                runThisTask = true;
                            }else {
                                runThisTask = false;
                                successCount += 1;
                            }
                        }

                        if (runThisTask){
                            _.forEach(undergraduateList,function (undergraduate) {
                                calculateUndergraduateSemesterGPA(undergraduate.indexNumber, semester)
                                    .then((GpaData)=>{
                                        completedUgs += 1;
                                        overallProgress += 1;
                                        valuesQuery += `(${undergraduate.indexNumber}, ${GpaData.gpa}, NULL, ${GpaData.credits},  ${GpaData.nonGpaCredits}) ,`;
                                        completedPercentage = parseFloat(overallProgress*100.0 * (targetSemMode ? completedSemesters.length : 1)/(undergraduateList.length*completedSemesters.length)).toFixed(2);
                                        log.setLiveText(`Calculation progress for pattern '${pattern}' ${completedPercentage}%`);
                                        if (completedUgs === undergraduateList.length){
                                            valuesQuery = valuesQuery.substring(0,valuesQuery.length -1);
                                            mysql.query(`INSERT INTO \`undergraduate\`
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
                                                        successCount += 1;

                                                        let localSuccessCount = successCount;
                                                        setSemesterRankings(pattern,`y${semester.year}s${semester.semester}_gpa`,`y${semester.year}s${semester.semester}_rank`)
                                                            .then((response)=>{
                                                                //RANKING CALCULATION
                                                                if (localSuccessCount === completedSemesters.length){
                                                                    if (!skipOverallUpdate){
                                                                        // TODO : ADD OVERALL GPA, RANK CALCULATION
                                                                        setSemesterRankings(pattern,'gpa','rank')
                                                                        .then((_overallUpdateResponse)=>{
                                                                            if (taskReport.success){
                                                                                log.info(`Calculation successfully completed for pattern ${pattern} after ${utilities.timeSpent(startTime)}`);
                                                                                log.setLiveText('');
                                                                                taskLock = false;
                                                                                log.debug('Recalculation task lock released');
                                                                                res.send({
                                                                                    success: true,
                                                                                    timeSpent: utilities.timeSpent(startTime)
                                                                                })
                                                                            }else{
                                                                                log.crit(`Calculation completed with failures for pattern ${pattern} after ${utilities.timeSpent(startTime)}`, taskReport);
                                                                                res.status(500).send({
                                                                                    success: false,
                                                                                    errors: taskReport.errors,
                                                                                    timeSpent: utilities.timeSpent(startTime)
                                                                                })
                                                                            }
                                                                        })
                                                                        .catch((error_overall)=>{
                                                                            reportError(req,res,error_overall, true);
                                                                        })
                                                                    }else{
                                                                        if (taskReport.success){
                                                                            log.info(`Calculation successfully completed for pattern ${pattern} after ${utilities.timeSpent(startTime)}`);
                                                                            log.setLiveText('');
                                                                            taskLock = false;
                                                                            log.debug('Recalculation task lock released');
                                                                            res.send({
                                                                                success: true,
                                                                                timeSpent: utilities.timeSpent(startTime)
                                                                            })
                                                                        }else{
                                                                            log.crit(`Calculation completed with failures for pattern ${pattern} after ${utilities.timeSpent(startTime)}`,'crit',true,taskReport);
                                                                            res.status(500).send({
                                                                                success: false,
                                                                                errors: taskReport.errors,
                                                                                timeSpent: utilities.timeSpent(startTime)
                                                                            })
                                                                        }
                                                                    }

                                                                }
                                                            })
                                                            .catch((error_ranking)=>{
                                                                reportError(req, res, error_ranking);
                                                                taskReport.errors.push(error_ranking);
                                                                taskReport.success = false;
                                                            });
                                                    }else{
                                                        reportError(req, res, error);
                                                        taskReport.errors.push(error);
                                                        taskReport.success = false;
                                                    }
                                                })
                                        }
                                    })
                                    .catch((error)=>{
                                        completedUgs += 1;
                                        overallProgress += 1;
                                        taskReport.errors.push(error);
                                        taskReport.success = false;
                                        reportError(req, res, error);
                                    });
                            });
                        }
                    })
                })
                .catch((error)=>{
                    reportError(req, res, error, true);
                    taskLock = false;
                    log.debug('Recalculation task lock released: Error occurred');
                });
        })
        .catch((error)=>{
            reportError(req, res, error);
            res.status(500).send({ error: error });
            taskLock = false;
            log.debug('Recalculation task lock released: Error occurred');
        })
});

router.get('/test',function (req,res) {
    setSemesterRankings('1400','y1s1_gpa','y1s1_rank')
    .then((response)=>{
        res.send(response);
    })
});

module.exports = router;