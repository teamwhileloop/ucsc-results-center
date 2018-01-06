let mysql = require('mysql');
const logger = require('./logger');
let credentials = require('./credentials');
let database = require('./database');

let connection = mysql.createConnection({
    host: credentials.database.host,
    user: credentials.database.username,
    password: credentials.database.password,
    database: credentials.database.database
});

function reconnect() {
    let databaseConnectionTime = new Date();
    connection.connect(function(err) {
        if (err){
            logger.log('Unable to connect to the database after ' + logger.timeSpent(databaseConnectionTime),'crit',true);
        }else{
            logger.log('Connected to the database in ' + logger.timeSpent(databaseConnectionTime));
        }
    });
}

connection.on('error', function(err) {
    logger.log('Error occurred in the database connection. ' + err.code, 'WARN', true, err);
    logger.log('Attempting to reconnect to the database', 'INFO', true, err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') {
        reconnect();
    }
});

reconnect();

module.exports = connection;