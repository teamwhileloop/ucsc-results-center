let mysql = require('mysql');
const log = require('perfect-logger');
let credentials = require('./credentials');
let database = require('./database');
let utilities = require('./utilities');

let backOffTime = 1;
let connection = mysql.createConnection({
    host: credentials.database.host,
    user: credentials.database.username,
    password: credentials.database.password,
    database: credentials.database.database
});

connection.connectedToDatabase = false;

function exponentialBackOff() {
    log.crit(`Backing off for ${backOffTime} seconds`);
    connection.end();
    setTimeout(function () {
        reconnect(true);
        backOffTime *= 2;
    }, backOffTime * 1000);
}

function resetExponentialBackOff(start = 1) {
    backOffTime = start;
}

function reconnect(recon = false) {
    let databaseConnectionTime = new Date();
    connection.destroy();
    connection = mysql.createConnection({
        host: credentials.database.host,
        user: credentials.database.username,
        password: credentials.database.password,
        database: credentials.database.database
    });
    connection.connect(function(err) {
        if (err){
            log.crit_nodb('Unable to connect to the database after ' + utilities.timeSpent(databaseConnectionTime));
            log.writeData(err);
            exponentialBackOff();
        }else{
            resetExponentialBackOff();
            const apiHitCounter = require('./api-hit-counter');
            apiHitCounter.updateApiHits();
            log.info(`Connected to the database ${credentials.database.database} in ${utilities.timeSpent(databaseConnectionTime)}`);
            connection.connectedToDatabase = true;
        }
    });
}

connection.on('error', function(err) {
    log.crit_nodb('Error occurred in the database connection. ' + err.code);
    log.writeData(err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') {
        log.info('Attempting to reconnect to the database');
        reconnect(true);
    }
});

reconnect();

module.exports = connection;