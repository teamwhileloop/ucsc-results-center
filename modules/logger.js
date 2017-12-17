let database = require('./database');

let databaseWrite = true;
let statusCodes = { event : 'EVENT' };
let defaultStatusCodeKey = {};
let statusCodeLength = 5;

exports.disableDatabaseWrite = function () {
    databaseWrite = false;
};

exports.enableDatabaseWrite = function () {
    databaseWrite = true;
};

exports.setStatusCodes = function (codes) {
    statusCodes = codes;
};

exports.setDefaultStatusCodeKey = function (code) {
    defaultStatusCodeKey = code;
};

exports.setStatusCodeLength = function (codeLength) {
    statusCodeLength = codeLength;
};

exports.log = function (message,statusCode = defaultStatusCodeKey,writeToDatabase = false, databaseEntry = null) {
    // TIME DATA PREPARATIONS
    let now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' }));
    let date = now.getFullYear() + '/' + ('0' + now.getMonth()).substr(-2,2) + '/' + ('0' + now.getDate()).substr(-2,2);
    let time = ('0' + now.getHours()).substr(-2,2) + ':' + ('0' + now.getMinutes()).substr(-2,2) + ':' + ('0' + now.getSeconds()).substr(-2,2);

    // GET STATUS CODE
    statusCode = statusCodes[statusCode] || statusCode[defaultStatusCodeKey] ;
    if (statusCode === undefined){
        statusCode = 'LOG';
    }
    statusCode = (statusCode+' '.repeat(statusCodeLength)).substring(0,statusCodeLength);

    // LOG TO CONSOLE
    console.log(date,"|",time,"|",statusCode,"|",message);

    // WRITE TO DATABASE
    if(databaseWrite && writeToDatabase){
        database.query('INSERT INTO `log` VALUES(?,?,?,?)',
            [date,time,statusCode,databaseEntry || message],
            function (err,payload) {
                if(err){
                    exports.log('Unable insert log entry to the database : ' + message,'crit',false);
                }
            });
    }
};

exports.timeSpent = function (start) {
    let duration = new Date() - start;
    return duration/1000 + 's';
};