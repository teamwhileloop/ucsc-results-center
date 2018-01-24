const express = require('express');
const _ = require('lodash');
const router = express.Router();

let logger = require('../../modules/logger');
let mysql = require('../../modules/database');

let cacheRankings = {};

function ranker(number){
    switch (number){
        case 1:
            return number + "st";
        case 2:
            return number + "nd";
        case 3:
            return number + "rd";
        default:
            return number + "th";
    }
}

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

function getBatchDistribution(indexNumber) {
    return new Promise((resolve, reject)=>{
        mysql.query('SELECT ROUND(`gpa`,1) as gpaRange, COUNT(`gpa`) as count FROM `undergraduate` WHERE `indexNumber` LIKE ? GROUP BY ROUND(`gpa`,1)',
        [indexNumber.toString().substring(0,4) + '%'],
        function (err, payload) {
            if (!err){
                let outputObject = {
                    '0.0': 0,
                    '0.1': 0,
                    '0.2': 0,
                    '0.3': 0,
                    '0.4': 0,
                    '0.5': 0,
                    '0.6': 0,
                    '0.7': 0,
                    '0.8': 0,
                    '0.9': 0,
                    '1.0': 0,
                    '1.1': 0,
                    '1.2': 0,
                    '1.3': 0,
                    '1.4': 0,
                    '1.5': 0,
                    '1.6': 0,
                    '1.7': 0,
                    '1.8': 0,
                    '1.9': 0,
                    '2.0': 0,
                    '2.1': 0,
                    '2.2': 0,
                    '2.3': 0,
                    '2.4': 0,
                    '2.5': 0,
                    '2.6': 0,
                    '2.7': 0,
                    '2.8': 0,
                    '2.9': 0,
                    '3.0': 0,
                    '3.1': 0,
                    '3.2': 0,
                    '3.3': 0,
                    '3.4': 0,
                    '3.5': 0,
                    '3.6': 0,
                    '3.7': 0,
                    '3.8': 0,
                    '3.9': 0,
                    '4.0': 0,
                    '4.1': 0,
                    '4.2': 0,
                    '4.3': 0
                };
                let progress = 0;
                if (payload.length){
                    _.forEach(payload, function (o) {
                        outputObject[o.gpaRange.toFixed(1).toString()] = o.count;
                        progress += 1;
                        if (progress === payload.length){
                            resolve({
                                keys: Object.keys(outputObject),
                                values: Object.values(outputObject)
                            });
                        }
                    })
                }else{
                    resolve({
                        keys: Object.keys(outputObject),
                        values: Object.values(outputObject)
                    });
                }
            }else {
                reject(err);
            }
        });

    });
}

function getGpaVariation(indexNumber) {
    return new Promise((resolve, reject)=>{
        mysql.query('SELECT `y1s1_gpa`, `y1s2_gpa`, `y2s1_gpa`, `y2s2_gpa`, `y3s1_gpa`, `y3s2_gpa`, `y4s1_gpa`, `y4s2_gpa` FROM `undergraduate` WHERE `indexNumber` = ?',
        [indexNumber],
        function (err, payload) {
            if (!err){
                resolve(Object.values(payload[0]));
            }else {
                reject(err);
            }
        });

    });
}

function getGradeDistribution(indexNumber) {
    return new Promise((resolve, reject)=>{
        getCompletedSemesters(indexNumber.toString().substring(0,4))
        .then((completedSemesters)=>{
            let outputObject = {};
            let semesterGradeSet = {
                name: '',
                data: {
                    'A+': 0,
                    'A' : 0,
                    'A-': 0,
                    'B+': 0,
                    'B' : 0,
                    'B-': 0,
                    'C+': 0,
                    'C' : 0,
                    'C-': 0,
                    'D+': 0,
                    'D' : 0,
                    'E' : 0,
                    'F' : 0
                }
            };
            _.forEach(completedSemesters, function (completedSemester) {
                outputObject[`y${completedSemester.year}s${completedSemester.semester}`] = {
                    name: `${completedSemester.year} Year ${completedSemester.semester} Semester`,
                    data: {
                        'A+': 0,
                        'A' : 0,
                        'A-': 0,
                        'B+': 0,
                        'B' : 0,
                        'B-': 0,
                        'C+': 0,
                        'C' : 0,
                        'C-': 0,
                        'D+': 0,
                        'D' : 0,
                        'E' : 0,
                        'F' : 0
                    }
                };
            });
            mysql.query("SELECT " +
                "`year`, `semester`,`grade`, COUNT(`grade`) as count " +
                "FROM `result` JOIN `subject` ON " +
                "`result`.`index`=? AND " +
                "    `result`.`subject` = `subject`.`code` AND " +
                "    isBest(`result`.`id`) = 1 AND " +
                "    `result`.`grade` IN ('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'E', 'F' ) " +
                "GROUP BY `year`, `semester`, `grade` " +
                "ORDER BY `year`, `semester`,`grade`",
                [indexNumber],
                function (err, payload) {
                    if (!err){
                        _.forEach(payload,(o)=>{
                            outputObject[`y${o.year}s${o.semester}`]['data'][o.grade] = o.count;
                        });
                        _.forEach(outputObject,(o)=>{
                            o.data = Object.values(o.data);
                        });
                        resolve(Object.values(outputObject));
                    }else{
                        reject(err);
                    }
                })

        })
        .catch((error)=>{reject(error);})

    });
}

function getProfileGraphs(indexNumber) {
    return  new Promise((resolve, reject)=>{
        Promise.all(
            [getGradeDistribution(indexNumber),
             getBatchDistribution(indexNumber),
             getGpaVariation(indexNumber)]
        )
        .then((data)=>{
            resolve({
                batchDistribution : data[1],
                gpaVariation : data[2],
                gradeDistribution : data[0]
            })
        })
        .catch((error)=>{reject(error)})
    });
}

function privacyPermission(currentUserIndex, targetUserIndex, privacyState) {
    // accessToken ByPass
    if (currentUserIndex === 0){
        console.log('bypass');
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
    // Temp disabled cache
    if (false && cacheRankings[pattern]){
        return Promise.resolve(cacheRankings[pattern]);
    }else{
        return new Promise(function (resolve, reject) {
            let query = `SELECT \`indexNumber\`,\`gpa\`,\`rank\`,\`privacy\` FROM \`undergraduate\` WHERE \`indexNumber\` LIKE '${pattern}%' ORDER BY \`rank\` ASC`;
            mysql.query(query, function (error, payload) {
                if (!error){
                    _.forEach(payload, function (value, key) {
                        if (!privacyPermission(req.facebookVerification.indexNumber || 0, value.indexNumber, value.privacy)){
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
    let indexNumber = parseInt(req.params['indexNumber']) || 0;
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
                        getProfileGraphs(indexNumber)
                        .then((graphData)=>{
                            profileSummary.graphs = graphData;
                            res.send(profileSummary);
                        })
                        .catch((error)=>{reportError(req, res, error, true)});
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

router.get('/graph/distribution/:indexNumber', function (req, res) {
    let indexNumber = parseInt(req.params['indexNumber']);
    getBatchDistribution(indexNumber)
    .then((data)=>{
        res.send(data);
    })
    .catch((error)=>{
        res.send(error);
    });
});

router.get('/graph/gpa/:indexNumber', function (req, res) {
    let indexNumber = parseInt(req.params['indexNumber']);
    getGpaVariation(indexNumber)
    .then((data)=>{
        res.send(data);
    })
    .catch((error)=>{
        res.send(error);
    });
});

router.get('/graph/grade/:indexNumber', function (req, res) {
    let indexNumber = parseInt(req.params['indexNumber']);
    getGradeDistribution(indexNumber)
    .then((data)=>{
        res.send(data);
    })
    .catch((error)=>{
        res.send(error);
    });
});

router.get('/graph/all/:indexNumber', function (req, res) {
    let indexNumber = parseInt(req.params['indexNumber']);
    getProfileGraphs(indexNumber)
    .then((data)=>{
        res.send(data);
    })
    .catch((error)=>{
        res.send(error);
    });
});

module.exports = router;