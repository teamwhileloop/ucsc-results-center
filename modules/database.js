let mysql = require('mysql');
const logger = require('./logger');
let credentials = require('./credentials');
let database = require('./database');

const databaseConnectionTime = new Date();
let connection = mysql.createConnection({
    host: credentials.database.host,
    user: credentials.database.username,
    password: credentials.database.password,
    database: credentials.database.database
});

connection.connect(function(err) {
    if (err){
        logger.log('Unable to connect to the database after ' + logger.timeSpent(databaseConnectionTime),'crit',true);
    }else{
        logger.log('Connected to the database in ' + logger.timeSpent(databaseConnectionTime));
    }
});

module.exports = connection;