// Environment variables
const port = process.env.PORT || 3000;

// Imports
let logger = require('./modules/logger');
let credentials = require('./modules/credentials');
let postman = require('./modules/postman');

const express = require('express');
const path = require('path');
const app = express();
const http = require('http').Server(app);
const socketIO = require('./index');

// Setup Logger
if (!credentials.isDeployed){
    logger.disableDatabaseWrite();
    logger.enableDatabaseWrite();
}else {
    logger.enableDatabaseWrite();
}
logger.setStatusCodeLength(4);
logger.setStatusCodes({
    info : 'INFO',
    warn : 'WARN',
    crit : 'CRIT',
    log : 'LOG'
});
logger.setDefaultStatusCodeKey('info');

// Setup Express
app.set('views', __dirname + '/');
app.engine('html', require('ejs').renderFile);
http.listen(port, function(){
    logger.log('Server started and listening on PORT ' + port);
});

// Route Imports and Config
const user = require('./routes/user');
app.use('/user', user);

// Static Files
app.use('/public',express.static(path.join(__dirname, 'public')));
app.use('/cdn',express.static(path.join(__dirname, 'node_modules')));

// Middlewares
app.use('/api',function (req,res,next) {
    next();
})

// Routing
app.get('/', function(req, res) {
    res.render('index.html');
});

app.get('/api/v1/', function(req, res) {
    res.send({});
});

module.exports = http;