let mysql = require('mysql');
const logger = require('./logger');
let credentials = require('./credentials');
let database = require('./database');

let backOffTime = 1;
let connection = mysql.createConnection({
    host: credentials.database.host,
    user: credentials.database.username,
    password: credentials.database.password,
    database: credentials.database.database
});

function exponentialBackOff() {
    logger.log ? logger.log(`Backing off for ${backOffTime} seconds`) : console.log(`Backing off for ${backOffTime} seconds`);
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
            logger.log('Unable to connect to the database after ' + logger.timeSpent(databaseConnectionTime),'crit',!recon);
            exponentialBackOff();
        }else{
            resetExponentialBackOff();
            logger.log('Connected to the database in ' + logger.timeSpent(databaseConnectionTime), 'info', true);
        }
    });
}

connection.on('error', function(err) {
    logger.log('Error occurred in the database connection. ' + err.code, 'WARN', false, err);
    logger.log('Attempting to reconnect to the database', 'INFO', true, err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') {
        reconnect(true);
    }
});

reconnect();

module.exports = connection;