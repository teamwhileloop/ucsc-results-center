let database = require('./database');

let databaseWrite = true;
let statusCodes = { event : 'EVENT' };
let defaultStatusCodeKey = {};
let statusCodeLength = 5;
let virtualConsoleLog = [];
let liveText = {};

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

exports.getVirtualConsoleLog = function () {
    if (!liveText.message){
        return virtualConsoleLog;
    }else{
        return virtualConsoleLog.concat(liveText);
    }
};

exports.clearVirtualConsoleLog = function () {
    virtualConsoleLog = [];
    return{
        success: true
    }
};

exports.setLiveText = function (text) {
    let now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' }));
    let date = now.getFullYear() + '/' + ('0' + now.getMonth() + 1).substr(-2,2) + '/' + ('0' + now.getDate()).substr(-2,2);
    let time = ('0' + now.getHours()).substr(-2,2) + ':' + ('0' + now.getMinutes() ).substr(-2,2) + ':' + ('0' + now.getSeconds()).substr(-2,2);
    liveText = {
        date: date,
        time: time,
        statusCode: ('LIVE '.repeat(statusCodeLength)).substring(0,statusCodeLength),
        message: text
    };
    if (text){
        process.stdout.write(`${date} | ${time} | ${liveText.statusCode} | ${text}\r`);
    }
};

/**
 * Represents a book.
 * @constructor
 * @param {string} message - Log message.
 * @param {string} statusCode - Log status code.
 * @param {boolean} writeToDatabase - Write to database.
 * @param {object} databaseEntry - What should go to the db record.
 */
exports.log = function (message,statusCode = defaultStatusCodeKey,writeToDatabase = false, databaseEntry = null) {
    // TIME DATA PREPARATIONS
    let now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' }));
    let date = now.getFullYear() + '/' + ('0' + now.getMonth() + 1).substr(-2,2) + '/' + ('0' + now.getDate()).substr(-2,2);
    let time = ('0' + now.getHours()).substr(-2,2) + ':' + ('0' + now.getMinutes()).substr(-2,2) + ':' + ('0' + now.getSeconds()).substr(-2,2);

    // GET STATUS CODE
    statusCode = statusCodes[statusCode] || statusCode[defaultStatusCodeKey] ;
    if (statusCode === undefined){
        statusCode = 'LOG';
    }
    statusCode = (statusCode+' '.repeat(statusCodeLength)).substring(0,statusCodeLength);

    // LOG TO CONSOLE
    console.log(date,"|",time,"|",statusCode,"|",message);

    virtualConsoleLog.push({
        date: date,
        time: time,
        statusCode: statusCode,
        message: message
    });

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